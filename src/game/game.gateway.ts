import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { GameService } from './game.service';
import { UserService } from '../user/user.service';
import { LogService } from '../log/log.service';
import { LoggerService } from '../logger/logger.service';
import { JwtGuard } from '../user/guards/jwt.guard';
import { JwtService } from '../services/jwt.service';
import { Game } from '../db/entities/game.entity';
import { User } from '../db/entities/user.entity';
import { Log } from '../db/entities/log.entity';

import * as types from '../constants/Games';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private disconnectTimers: { [key: string]: NodeJS.Timeout } = {};
  private connectTimers: { [key: string]: NodeJS.Timeout } = {};

  constructor(
    private readonly gameService: GameService,
    private readonly userService: UserService,
    private readonly logService: LogService,
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token;

    if (this.connectTimers[token]) {
      return;
    }

    this.connectTimers[token] = setTimeout(async () => {
      delete this.connectTimers[token];
    }, 4000);

    const userId = this.jwtService.getUserIdByToken(token);

    const user = await this.userService.findOneByUserId(userId);

    if (!user) {
      return;
    }

    if (!user.openedGame) {
      return;
    }

    client.join(user.openedGame.id);

    if (this.disconnectTimers[user.id]) {
      clearTimeout(this.disconnectTimers[user.id]);
      delete this.disconnectTimers[user.id];
      return;
    }

    const game = JSON.parse(JSON.stringify(await this.gameService.findOne(user.openedGame.number)));

    const log = await this.logService.create({ type: 'connect', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    this.sendGameToGameUsers({ game });
    this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake.query.token;

    const userId = this.jwtService.getUserIdByToken(token);

    const user = await this.userService.findOneByUserId(userId);

    if (!user) {
      return;
    }

    if (!user.openedGame) {
      return;
    }

    this.disconnectTimers[user.id] = setTimeout(async () => {
      const game = JSON.parse(JSON.stringify(await this.gameService.findOne(user.openedGame.number)));

      const log = await this.logService.create({ type: 'disconnect', user, gameId: game.id });
      game.logs = [log, ...game.logs];

      client.leave(game.id);

      this.sendGameToGameUsers({ game });
      this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));

      delete this.disconnectTimers[user.id];
    }, 4000);
  }

  @SubscribeMessage('get-all-games')
  async getAllGames(client: Socket, conditions: {
    ignoreNotStarted: boolean,
    ignoreStarted: boolean,
    ignoreFinished: boolean,
  }): Promise<WsResponse<Game[]>> {
    return { event: 'all-games', data: await this.gameService.getAllGames(conditions) };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('get-opened-game')
  public async getOpenedGame(client: Socket & { user: User }): Promise<WsResponse<Game>> {
    if (!client.user) {
      return;
    }

    if (!client.user.openedGame && !client.user.currentWatch) {
      return;
    }

    const gameNumber = client.user.openedGame ? client.user.openedGame.number : client.user.currentWatch.number;
    const game = JSON.parse(JSON.stringify(await this.gameService.findOne(gameNumber)));

    client.join(game.id);

    return { event: 'update-opened-game', data: this.gameService.parseGameForUser({ game, user: client.user }) };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('new-game')
  public async newGame(client: Socket & { user: User }, name: string): Promise<void> {
    const game = await this.gameService.newGame(name);

    try {
      await this.logService.create({ type: 'create', user: client.user, gameId: game.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    this.server.emit('new-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('join-game')
  public async joinGame(client: Socket & { user: User }, gameNumber: number): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.joinGame({ user: client.user, gameNumber });
    } catch (error) {
      client.emit('');
      return this.sendError({ client, message: error.message });
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'join', user: client.user, gameId: game.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    game.logs = [log, ...game.logs];

    client.join(game.id);

    this.sendGameToGameUsers({ game });
    this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('open-game')
  public async openGame(client: Socket & { user: User }, gameNumber: number): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.openGame({ user: client.user, gameNumber });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'open', user: client.user, gameId: game.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    game.logs = [log, ...game.logs];

    client.join(game.id);

    this.sendGameToGameUsers({ game });
    this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('watch-game')
  public async watchGame(client: Socket & { user: User }, gameNumber: number): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.watchGame({ user: client.user, gameNumber });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'watch', user: client.user, gameId: game.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    game.logs = [log, ...game.logs];

    client.join(game.id);

    this.sendGameToGameUsers({ game });
    this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('leave-game')
  public async leaveGame(client: Socket & { user: User }, gameNumber: number): Promise<WsResponse<Game>> {
    let game: Game;

    try {
      game = await this.gameService.leaveGame({ user: client.user, gameNumber });
    } catch (error) {
      this.sendError({ client, message: error.message });
      return;
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'leave', user: client.user, gameId: game.id });
    } catch (error) {
      this.sendError({ client, message: error.message });
      return;
    }

    game.logs = [log, ...game.logs];

    client.leave(game.id);

    this.sendGameToGameUsers({ game });
    this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));

    return { event: 'update-opened-game', data: null };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('close-game')
  public async closeGame(client: Socket & { user: User }, gameNumber: number): Promise<WsResponse<Game>> {
    let game: Game;

    try {
      game = await this.gameService.closeGame({ user: client.user, gameNumber });
    } catch (error) {
      this.sendError({ client, message: error.message });
      return;
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'close', user: client.user, gameId: game.id });
    } catch (error) {
      this.sendError({ client, message: error.message });
      return;
    }

    game.logs = [log, ...game.logs];

    client.leave(game.id);

    this.sendGameToGameUsers({ game });
    this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));

    return { event: 'update-opened-game', data: null };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('toggle-ready')
  public async toggleReady(client: Socket & { user: User }, gameNumber: number): Promise<void> {

    let game: Game;

    try {
      game = await this.gameService.toggleReady({ user: client.user, gameNumber });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'ready', user: client.user, gameId: game.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    game.logs = [log, ...game.logs];

    this.sendGameToGameUsers({ game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('start-game')
  public async startGame(client: Socket & { user: User }, gameNumber: number): Promise<void> {

    let game: Game;

    try {
      game = await this.gameService.startGame({ gameNumber });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'start', user: client.user, gameId: game.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    game.logs = [log, ...game.logs];

    this.sendGameToGameUsers({ game });
    this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('make-move')
  public async move(client: Socket & { user: User }, { gameNumber, move }: { gameNumber: number, move: string }): Promise<void> {
    if (!client.user.currentGames || !client.user.currentGames.some(currentGame => currentGame.number === gameNumber)) {
      return this.sendError({ client, message: 'You can\'t make move if you are not this game player' });
    }

    let game: Game;

    try {
      game = await this.gameService.makeMove({ move, gameNumber, userId: client.user.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    let log: Log;

    try {
      log = await this.logService.create({ type: 'move', user: client.user, gameId: game.id, text: move });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    game.logs = [log, ...game.logs];

    if (game.state === types.GAME_FINISHED) {
      const finishLog = await this.logService.create({ type: 'finish', user: client.user, gameId: game.id });
      game.logs = [finishLog, ...game.logs];
    }

    this.sendGameToGameUsers({ game });

    if (game.state === types.GAME_FINISHED) {
      this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
    }
  }

  private sendGameToGameUsers({ game }: { game: Game }): void {
    if (!this.server.sockets.adapter.rooms[game.id]) {
      return;
    }

    Object.keys(this.server.sockets.adapter.rooms[game.id].sockets).forEach(socketId => {
      const socketInGame = this.server.sockets.connected[socketId] as Socket & { user: User };
      const userInGame = socketInGame.user;

      if (userInGame) {
        socketInGame.emit('update-opened-game', this.gameService.parseGameForUser({ game, user: userInGame }));
      }
    });
  }

  private sendError({ client, message }: { client: Socket, message: string }): void {
    this.logger.error(message, '');
    client.emit('error-message', message);
  }

}
