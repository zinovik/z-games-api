import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { GameService } from './game.service';
import { UserService } from '../user/user.service';
import { LogService } from '../log/log.service';
import { JwtGuard } from './../user/guards/jwt.guard';
import { JwtService } from './../services/jwt.service';
import { Game } from '../db/entities/game.entity';
import * as types from '../constants/Games';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server;

  private disconnectTimers = {};

  constructor(
    private gameService: GameService,
    private userService: UserService,
    private logService: LogService,
    private jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token;

    const username = this.jwtService.getUserNameByToken(token);

    const user = await this.userService.findOneByUsername(username);

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

    const game = await this.gameService.findOne(user.openedGame.number);

    const log = await this.logService.create({ type: 'connect', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    await this.sendGameToGameUsers({ game });
    await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake.query.token;

    const username = this.jwtService.getUserNameByToken(token);

    const user = await this.userService.findOneByUsername(username);

    if (!user) {
      return;
    }

    if (!user.openedGame) {
      return;
    }

    this.disconnectTimers[user.id] = setTimeout(async () => {
      const game = await this.gameService.findOne(user.openedGame.number);

      const log = await this.logService.create({ type: 'disconnect', user, gameId: game.id });
      game.logs = [log, ...game.logs];

      client.leave(game.id);

      await this.sendGameToGameUsers({ game });
      await await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));

      delete this.disconnectTimers[user.id];
    }, 5000);
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
  public async getOpenedGame(client: Socket): Promise<WsResponse<Game | undefined>> {
    if (!client.user) {
      return;
    }

    if (!client.user.openedGame && !client.user.currentWatch) {
      return;
    }

    const gameNumber = client.user.openedGame ? client.user.openedGame.number : client.user.currentWatch.number;
    const game = await this.gameService.findOne(gameNumber);

    client.join(game.id);

    return { event: 'update-opened-game', data: this.gameService.parseGameForUser({ game, user: client.user }) };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('new-game')
  public async newGame(client: Socket, name: string): Promise<void> {
    const game = await this.gameService.newGame(name);

    await this.logService.create({ type: 'create', user: client.user, gameId: game.id });

    await this.server.emit('new-game', this.gameService.parseGameForAllUsers(
      (game as any)._doc ? (game as any)._doc : game,
    ));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('join-game')
  public async joinGame(client: Socket, gameNumber: number): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.joinGame({ user: client.user, gameNumber });
    } catch (error) {
      client.emit('');
      return this.sendError({ client, message: error.message });
    }

    const log = await this.logService.create({ type: 'join', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    client.join(game.id);

    this.sendGameToGameUsers({ game });
    await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('open-game')
  public async openGame(client: Socket, gameNumber: number): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.openGame({ user: client.user, gameNumber });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    const log = await this.logService.create({ type: 'open', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    client.join(game.id);

    this.sendGameToGameUsers({ game });
    await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('watch-game')
  public async watchGame(client: Socket, gameNumber: number): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.watchGame({ user: client.user, gameNumber });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    const log = await this.logService.create({ type: 'watch', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    client.join(game.id);

    this.sendGameToGameUsers({ game });
    await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('leave-game')
  public async leaveGame(client: Socket, gameNumber: number): Promise<WsResponse<Game>> {
    let game: Game;

    try {
      game = await this.gameService.leaveGame({ user: client.user, gameNumber });
    } catch (error) {
      this.sendError({ client, message: error.message });
      return undefined;
    }

    const log = await this.logService.create({ type: 'leave', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    client.leave(game.id);

    this.sendGameToGameUsers({ game });
    await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));

    return { event: 'update-opened-game', data: undefined };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('close-game')
  public async closeGame(client: Socket, gameNumber: number): Promise<WsResponse<Game>> {
    let game: Game;

    try {
      game = await this.gameService.closeGame({ user: client.user, gameNumber });
    } catch (error) {
      this.sendError({ client, message: error.message });
      return undefined;
    }

    const log = await this.logService.create({ type: 'close', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    client.leave(game.id);

    this.sendGameToGameUsers({ game });
    await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));

    return { event: 'update-opened-game', data: undefined };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('toggle-ready')
  public async toggleReady(client: Socket, gameNumber: number): Promise<void> {
    const game = await this.gameService.toggleReady({ user: client.user, gameNumber });

    const log = await this.logService.create({ type: 'ready', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    this.sendGameToGameUsers({ game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('start-game')
  public async startGame(client: Socket, gameNumber: number): Promise<void> {
    const game = await this.gameService.startGame({ gameNumber });

    const log = await this.logService.create({ type: 'start', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    this.sendGameToGameUsers({ game });
    await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('make-move')
  public async move(client: Socket, { gameNumber, move }: { gameNumber: number, move: string }): Promise<void> {
    if (!client.user.currentGames || !client.user.currentGames.some(currentGame => currentGame.number === gameNumber)) {
      return this.sendError({ client, message: 'You can\'t make move if you are not this game player' });
    }

    let game: Game;

    try {
      game = await this.gameService.makeMove({ move, gameNumber, userId: client.user.id });
    } catch (error) {
      return this.sendError({ client, message: error.message });
    }

    const moveLog = await this.logService.create({ type: 'move', user: client.user, gameId: game.id, text: move });
    game.logs = [moveLog, ...game.logs];

    if (game.state === types.GAME_FINISHED) {
      const finishLog = await this.logService.create({ type: 'finish', user: client.user, gameId: game.id });
      game.logs = [finishLog, ...game.logs];
    }

    this.sendGameToGameUsers({ game });

    if (game.state === types.GAME_FINISHED) {
      await this.server.emit('update-game', this.gameService.parseGameForAllUsers(game));
    }
  }

  private sendGameToGameUsers({ game }: { game: Game }): void {
    if (!this.server.sockets.adapter.rooms[game.id]) {
      return;
    }

    Object.keys(this.server.sockets.adapter.rooms[game.id].sockets).forEach(socketId => {
      const socketInGame = this.server.sockets.connected[socketId];
      const userInGame = socketInGame.user;

      if (userInGame) {
        socketInGame.emit('update-opened-game', this.gameService.parseGameForUser({ game, user: userInGame }));
      }
    });
  }

  private sendError({ client, message }: { client: Socket, message: string }): void {
    client.emit('error-message', message);
    // return this.logger.error(message);
  }

}

// TODO: move token check into separate decorator
// TODO: Add and check error conditions, add errors
