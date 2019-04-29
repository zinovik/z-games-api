import { UseGuards } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GAME_STARTED, GAME_FINISHED } from 'z-games-base-game';

import { GameService } from './game.service';
import { UserService } from '../user/user.service';
import { InviteService } from '../invite/invite.service';
import { LogService } from '../log/log.service';
import { JwtGuard } from '../guards/jwt.guard';
import { JwtService } from '../services/jwt.service';
import { SocketService } from '../services/socket.service';
import { Game, User, Invite } from '../db/entities';
import { IFilterSettings } from './IFilterSettings.interface';
import { IGame, IUser, IInvite } from '../db/interfaces';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private disconnectTimers: { [key: string]: NodeJS.Timeout } = {};
  private connectTimers: { [key: string]: NodeJS.Timeout } = {};
  private readonly logService: LogService;

  constructor(
    private readonly gameService: GameService,
    private readonly userService: UserService,
    private readonly inviteService: InviteService,
    private readonly jwtService: JwtService,
    private readonly socketService: SocketService,
    private readonly moduleRef: ModuleRef,
  ) {
    this.logService = this.moduleRef.get(LogService, { strict: false });
  }

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

    await this.gameService.connectGame({ user, gameNumber: user.openedGame.number });

    const log = await this.logService.create({
      type: 'connect',
      user,
      gameId: user.openedGame.id,
    });

    await this.gameService.addLog({ gameId: user.openedGame.id, logId: log.id });

    const game = JSON.parse(JSON.stringify(await this.gameService.findOne(user.openedGame.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game });
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

      await this.gameService.disconnectGame({ user, gameNumber: user.openedGame.number });

      const log = await this.logService.create({
        type: 'disconnect',
        user,
        gameId: user.openedGame.id,
      });

      await this.gameService.addLog({ gameId: user.openedGame.id, logId: log.id });

      client.leave(user.openedGame.id);

      const game = JSON.parse(JSON.stringify(await this.gameService.findOne(user.openedGame.number)));

      this.socketService.sendGameToGameUsers({ server: this.server, game });
      this.socketService.updateGame({ server: this.server, game });

      delete this.disconnectTimers[user.id];
    }, 4000);
  }

  @SubscribeMessage('get-all-games')
  async getAllGames(
    client: Socket & { user: User },
    filterSettings: IFilterSettings,
  ): Promise<WsResponse<Game[]>> {
    return {
      event: 'all-games',
      data: await this.gameService.getAllGames(filterSettings),
    };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('get-opened-game')
  public async getOpenedGame(
    client: Socket & { user: User },
  ): Promise<WsResponse<Game | IGame>> {
    if (!client.user) {
      return;
    }

    if (!client.user.openedGame && !client.user.openedGameWatcher) {
      return {
        event: 'update-opened-game',
        data: null,
      };
    }

    const gameNumber = client.user.openedGame
      ? client.user.openedGame.number
      : client.user.openedGameWatcher.number;
    const game = JSON.parse(
      JSON.stringify(await this.gameService.findOne(gameNumber)),
    );

    client.join(game.id);

    return {
      event: 'update-opened-game',
      data: this.socketService.parseGameForUser({ game, userId: client.user.id }),
    };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('new-game')
  public async newGame(
    client: Socket & { user: User },
    name: string,
  ): Promise<string> {
    let gameId = '';

    try {
      ({ id: gameId } = await this.gameService.newGame(name, client.user.id));

      await this.userService.addCreatedGame({ userId: client.user.id, gameId });

      const { id: logId } = await this.logService.create({
        type: 'create',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.server.emit('new-game', game);

    await this.joinGame(client, game.number);

    return game.id;
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('join-game')
  public async joinGame(
    client: Socket & { user: User },
    gameNumber: number,
  ): Promise<void> {
    let gameId = '';

    try {
      ({ id: gameId } = await this.gameService.joinGame({ user: client.user, gameNumber }));

      await this.userService.updateOpenAndAddCurrentGame({ userId: client.user.id, gameId });

      const { id: logId } = await this.logService.create({
        type: 'join',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.join(gameId);

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('open-game')
  public async openGame(
    client: Socket & { user: User },
    gameNumber: number,
  ): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.openGame({ user: client.user, gameNumber });

      await this.userService.updateOpenGame({ userId: client.user.id, gameId: game.id });

      const log = await this.logService.create({
        type: 'open',
        user: client.user,
        gameId: game.id,
      });

      await this.gameService.addLog({ gameId: game.id, logId: log.id });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.join(game.id);

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(game.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('watch-game')
  public async watchGame(
    client: Socket & { user: User },
    gameNumber: number,
  ): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.watchGame({
        user: client.user,
        gameNumber,
      });

      await this.userService.updateOpenGameWatcher({ userId: client.user.id, gameId: game.id });

      const log = await this.logService.create({
        type: 'watch',
        user: client.user,
        gameId: game.id,
      });

      await this.gameService.addLog({ gameId: game.id, logId: log.id });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    client.join(game.id);

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(game.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('leave-game')
  public async leaveGame(
    client: Socket & { user: User },
    gameNumber: number,
  ): Promise<WsResponse<Game>> {
    let game: Game;

    try {
      game = await this.gameService.leaveGame({
        user: client.user,
        gameNumber,
      });

      await this.userService.updateOpenAndRemoveCurrentGame({ userId: client.user.id, gameId: game.id });

      const log = await this.logService.create({
        type: 'leave',
        user: client.user,
        gameId: game.id,
      });

      await this.gameService.addLog({ gameId: game.id, logId: log.id });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.leave(game.id);

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(game.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game });

    return { event: 'update-opened-game', data: null };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('close-game')
  public async closeGame(
    client: Socket & { user: User },
  ): Promise<WsResponse<Game>> {
    let game: Game;

    // TODO: Check game number
    if (!client.user.openedGame && !client.user.openedGameWatcher) {
      this.socketService.sendError({ client, message: 'You don\'t have opened game to close' });
      return;
    }

    const gameNumber = (client.user.openedGame && client.user.openedGame.number)
      || (client.user.openedGameWatcher && client.user.openedGameWatcher.number);

    const gameId = (client.user.openedGame && client.user.openedGame.id)
      || (client.user.openedGameWatcher && client.user.openedGameWatcher.id);

    try {
      await this.gameService.closeGame({
        user: client.user,
        gameNumber,
      });

      await this.userService.updateOpenGame({ userId: client.user.id, gameId: null });
      await this.userService.updateOpenGameWatcher({ userId: client.user.id, gameId: null });

      const log = await this.logService.create({
        type: 'close',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId: log.id });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.leave(gameId);

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(gameNumber)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game });

    return { event: 'update-opened-game', data: null };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('remove-game')
  public async removeGame(
    client: Socket & { user: User },
    gameNumber: number,
  ): Promise<void> {
    const game = await this.gameService.findOne(gameNumber);

    try {
      await this.gameService.removeGame({ user: client.user, gameNumber });
      await this.inviteService.closeInvites({ gameId: game.id });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    this.kickUsersFromGame({ server: this.server, game });

    this.server.emit('remove-game', gameNumber);
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('repeat-game')
  public async repeatGame(
    client: Socket & { user: User },
    gameNumber: number,
  ): Promise<void> {
    const game = await this.gameService.findOne(gameNumber);

    await this.closeGame(client);
    const newGameId = await this.newGame(client, game.name);

    game.players.forEach(async (player: User | IUser) => {
      if (player.id === client.user.id) {
        return;
      }

      const invite = await this.inviteService.create({ gameId: newGameId, createdBy: client.user, invitee: player.id });
      this.socketService.emitByUserId({
        server: this.server,
        userId: player.id,
        event: 'new-invite',
        data: invite,
      });
      client.emit('new-invite', invite);
    });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('toggle-ready')
  public async toggleReady(
    client: Socket & { user: User },
  ): Promise<void> {
    let game: Game;

    if (!client.user.openedGame) {
      this.socketService.sendError({ client, message: 'You don\'t have opened game to toggle ready status' });
      return;
    }

    try {
      game = await this.gameService.toggleReady({
        user: client.user,
        gameNumber: client.user.openedGame.number,
      });

      const log = await this.logService.create({
        type: 'ready',
        user: client.user,
        gameId: game.id,
      });

      await this.gameService.addLog({ gameId: game.id, logId: log.id });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(game.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('update-option')
  public async updateOption(
    client: Socket & { user: User },
    { gameNumber, name, value }: { gameNumber: number, name: string, value: string },
  ): Promise<void> {
    let game: Game;

    try {
      game = await this.gameService.updateOption({
        user: client.user,
        gameNumber,
        name,
        value,
      });

      const log = await this.logService.create({
        type: 'update',
        user: client.user,
        gameId: game.id,
      });

      await this.gameService.addLog({ gameId: game.id, logId: log.id });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(game.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('start-game')
  public async startGame(
    client: Socket & { user: User },
    gameNumber: number,
  ): Promise<void> {
    let game: Game;
    let nextPlayersIds: string[];

    try {
      ({ game, nextPlayersIds } = await this.gameService.startGame({ gameNumber }));

      await this.userService.addCurrentMoves({ usersIds: nextPlayersIds, gameId: game.id });

      const log = await this.logService.create({
        type: 'start',
        user: client.user,
        gameId: game.id,
      });

      await this.gameService.addLog({ gameId: game.id, logId: log.id });

      await this.inviteService.closeInvites({ gameId: game.id });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(game.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game: { number: game.number, state: GAME_STARTED } as Game | IGame });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('make-move')
  public async move(
    client: Socket & { user: User },
    { gameNumber, move }: { gameNumber: number; move: string },
  ): Promise<void> {
    if (
      !client.user.currentGames ||
      !client.user.currentGames.some(
        currentGame => currentGame.number === gameNumber,
      )
    ) {
      return this.socketService.sendError({
        client,
        message: 'You can\'t make move if you are not this game player',
      });
    }

    let game: Game | IGame;

    try {
      game = await this.gameService.makeMove({
        move,
        gameNumber,
        userId: client.user.id,
      });

      const log = await this.logService.create({
        type: 'move',
        user: client.user,
        gameId: game.id,
        text: move,
      });

      await this.gameService.addLog({ gameId: game.id, logId: log.id });

      if (game.state === GAME_FINISHED) {
        const finishLog = await this.logService.create({
          type: 'finish',
          user: client.user,
          gameId: game.id,
        });

        await this.gameService.addLog({ gameId: game.id, logId: finishLog.id });
      }
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    game = JSON.parse(JSON.stringify(await this.gameService.findOne(game.number)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    if (game.state === GAME_FINISHED) {
      this.socketService.updateGame({ server: this.server, game });
    }
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('accept-invite')
  public async acceptInvite(client: Socket & { user: User }, inviteId: string): Promise<void> {
    let invite: Invite | IInvite;

    try {
      invite = await this.inviteService.closeInvite({ inviteId, isAccepted: true });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    if (client.user.openedGame || client.user.openedGameWatcher) {
      await this.closeGame(client);
    }

    await this.joinGame(client, invite.game.number);

    client.emit('update-invite', invite);
    this.socketService.emitByUserId({
      server: this.server,
      userId: invite.createdBy.id,
      event: 'update-invite',
      data: invite,
    });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('decline-invite')
  public async declineInvite(client: Socket & { user: User }, inviteId: string): Promise<void> {

    let invite: Invite | IInvite;

    try {
      invite = await this.inviteService.closeInvite({ inviteId, isDeclined: true });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    client.emit('update-invite', invite);
    this.socketService.emitByUserId({
      server: this.server,
      userId: invite.createdBy.id,
      event: 'update-invite',
      data: invite,
    });
  }

  private kickUsersFromGame({ server, game }: { server: Server, game: Game | IGame }): void {
    if (!server.sockets.adapter.rooms[game.id]) {
      return;
    }

    Object.keys(server.sockets.adapter.rooms[game.id].sockets).forEach(socketId => {
      const socketInGame = server.sockets.connected[socketId] as Socket & { user: User };
      const userInGame = socketInGame.user;

      if (userInGame) {
        socketInGame.emit('update-opened-game', null);
      }
    });
  }

}
