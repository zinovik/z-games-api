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
import { GAME_FINISHED } from 'z-games-base-game';

import { GameService } from './game.service';
import { UserService } from '../user/user.service';
import { InviteService } from '../invite/invite.service';
import { LogService } from '../log/log.service';
import { JwtGuard } from '../guards/jwt.guard';
import { JwtService } from '../services/jwt.service';
import { SocketService } from '../services/socket.service';
import { EmailService } from '../services/email.service';
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
    private readonly emailService: EmailService,
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

    const user = await this.userService.findOneById(userId);

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

    await this.gameService.connectGame({ user, gameId: user.openedGame.id });

    const { id: logId } = await this.logService.create({
      type: 'connect',
      user,
      gameId: user.openedGame.id,
    });

    await this.gameService.addLog({ gameId: user.openedGame.id, logId });
    await this.userService.addLog({ userId: user.id, logId });

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(user.openedGame.id)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game: { id: game.id, players: game.players } as Game | IGame });
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake.query.token;

    const userId = this.jwtService.getUserIdByToken(token);

    const user = await this.userService.findOneById(userId);

    if (!user) {
      return;
    }

    if (!user.openedGame) {
      return;
    }

    this.disconnectTimers[user.id] = setTimeout(async () => {

      await this.gameService.disconnectGame({ user, gameId: user.openedGame.id });

      const { id: logId } = await this.logService.create({
        type: 'disconnect',
        user,
        gameId: user.openedGame.id,
      });

      await this.gameService.addLog({ gameId: user.openedGame.id, logId });
      await this.userService.addLog({ userId: user.id, logId });

      client.leave(user.openedGame.id);

      const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(user.openedGame.id)));

      this.socketService.sendGameToGameUsers({ server: this.server, game });
      this.socketService.updateGame({ server: this.server, game: { id: game.id, players: game.players } as Game | IGame });

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

    const gameId = client.user.openedGame
      ? client.user.openedGame.id
      : client.user.openedGameWatcher.id;
    const game = JSON.parse(
      JSON.stringify(await this.gameService.findOneById(gameId)),
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
    { name, isPrivate }: { name: string, isPrivate: boolean },
  ): Promise<string> {
    let gameId = '';

    try {
      ({ id: gameId } = await this.gameService.newGame({ name, isPrivate, userId: client.user.id }));

      await this.userService.addCreatedGame({ userId: client.user.id, gameId });

      const { id: logId } = await this.logService.create({
        type: 'create',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.server.emit('new-game', game);

    await this.joinGame(client, game.id, { isNewGameJoin: true });

    return game.id;
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('join-game')
  public async joinGame(
    client: Socket & { user: User },
    gameId: string,
    { isJoinByInvite, isNewGameJoin }: { isJoinByInvite?: boolean, isNewGameJoin?: boolean } = {},
  ): Promise<void> {
    try {
      await this.gameService.joinGame({
        user: await this.userService.findOneById(client.user.id),
        gameId,
        isJoinByInvite,
        isNewGameJoin,
      });

      await this.userService.updateOpenAndAddCurrentGame({ userId: client.user.id, gameId });

      const { id: logId } = await this.logService.create({
        type: 'join',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.join(gameId);

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game: { id: gameId, players: game.players } as Game | IGame });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('open-game')
  public async openGame(
    client: Socket & { user: User },
    gameId: string,
  ): Promise<void> {
    try {
      await this.gameService.openGame({ user: client.user, gameId });

      await this.userService.updateOpenGame({ usersIds: [client.user.id], gameId });

      const { id: logId } = await this.logService.create({
        type: 'open',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.join(gameId);

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game: { id: gameId, players: game.players } as Game | IGame });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('watch-game')
  public async watchGame(
    client: Socket & { user: User },
    gameId: string,
  ): Promise<void> {
    try {
      await this.gameService.watchGame({
        user: client.user,
        gameId,
      });

      await this.userService.updateOpenGameWatcher({ usersIds: [client.user.id], gameId });

      const { id: logId } = await this.logService.create({
        type: 'watch',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    client.join(gameId);

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('leave-game')
  public async leaveGame(
    client: Socket & { user: User },
    gameId: string,
  ): Promise<WsResponse<Game>> {
    try {
      await this.gameService.leaveGame({
        user: client.user,
        gameId,
      });

      await this.userService.updateOpenAndRemoveCurrentGame({ userId: client.user.id, gameId });

      const { id: logId } = await this.logService.create({
        type: 'leave',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.leave(gameId);

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game: { id: gameId, players: game.players } as Game | IGame });

    return { event: 'update-opened-game', data: null };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('close-game')
  public async closeGame(
    client: Socket & { user: User },
  ): Promise<WsResponse<Game>> {
    if (!client.user.openedGame && !client.user.openedGameWatcher) {
      this.socketService.sendError({ client, message: 'You don\'t have opened game to close. Try to refresh the page' });
      return;
    }

    const gameId = (client.user.openedGame && client.user.openedGame.id)
      || (client.user.openedGameWatcher && client.user.openedGameWatcher.id);

    try {
      await this.gameService.closeGame({
        user: client.user,
        gameId,
      });

      await this.userService.updateOpenGame({ usersIds: [client.user.id], gameId: null });
      await this.userService.updateOpenGameWatcher({ usersIds: [client.user.id], gameId: null });

      const { id: logId } = await this.logService.create({
        type: 'close',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    client.leave(gameId);

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });

    return { event: 'update-opened-game', data: null };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('remove-game')
  public async removeGame(
    client: Socket & { user: User },
    gameId: string,
  ): Promise<void> {
    try {
      const game = await this.gameService.findOneById(gameId);

      const playersIds: string[] = (game.players as IUser[]).map(player => player.id);
      const watchersIds: string[] = (game.watchersOnline as IUser[]).map(watcher => watcher.id);

      await this.gameService.removeGame({ userId: client.user.id, gameId });
      await this.inviteService.closeInvites({ gameId });
      await this.userService.updateOpenGame({ usersIds: playersIds, gameId: null });
      await this.userService.updateOpenGameWatcher({ usersIds: watchersIds, gameId: null });
    } catch ({ response: { message } }) {
      this.socketService.sendError({ client, message });
      return;
    }

    this.kickUsersFromGame({ server: this.server, gameId });

    this.server.emit('remove-game', gameId);
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('repeat-game')
  public async repeatGame(
    client: Socket & { user: User },
    gameId: string,
  ): Promise<void> {
    const { name, players, isPrivate } = await this.gameService.findOneById(gameId);

    await this.closeGame(client);
    const newGameId = await this.newGame(client, { name, isPrivate });

    players.forEach(async (player: User | IUser) => {
      if (player.id === client.user.id) {
        return;
      }

      const invite = await this.inviteService.create({ gameId: newGameId, createdBy: client.user.id, invitee: player.id });

      // TODO: Call invite method?
      client.emit('new-invite', invite);

      if (this.socketService.isUserOnline({ server: this.server, userId: player.id })) {
        this.socketService.emitByUserId({
          server: this.server,
          userId: player.id,
          event: 'new-invite',
          data: invite,
        });
      } else {
        const { email } = await this.userService.findOneById(player.id);
        await this.emailService.sendInviteMail({ gameNumber: invite.game.number, email });
      }
    });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('toggle-ready')
  public async toggleReady(
    client: Socket & { user: User },
  ): Promise<void> {
    if (!client.user.openedGame) {
      this.socketService.sendError({ client, message: 'You don\'t have opened game to toggle ready status' });
      return;
    }

    const gameId = client.user.openedGame.id;

    try {
      await this.gameService.toggleReady({
        user: client.user,
        gameId,
      });

      const { id: logId } = await this.logService.create({
        type: 'ready',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('update-option')
  public async updateOption(
    client: Socket & { user: User },
    { gameId, name, value }: { gameId: string, name: string, value: string },
  ): Promise<void> {
    try {
      await this.gameService.updateOption({
        gameId,
        name,
        value,
      });

      const { id: logId } = await this.logService.create({
        type: 'update',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('start-game')
  public async startGame(
    client: Socket & { user: User },
    gameId: string,
  ): Promise<void> {
    try {
      const nextPlayersIds = await this.gameService.startGame({ gameId });

      await this.userService.addCurrentMoves({ usersIds: nextPlayersIds, gameId });

      const { id: logId } = await this.logService.create({
        type: 'start',
        user: client.user,
        gameId,
      });

      await this.gameService.addLog({ gameId, logId });
      await this.userService.addLog({ userId: client.user.id, logId });

      await this.inviteService.closeInvites({ gameId });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });
    this.socketService.updateGame({ server: this.server, game: { id: gameId, state: game.state } as Game | IGame });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('make-move')
  public async move(
    client: Socket & { user: User },
    { gameId, move }: { gameId: string; move: string },
  ): Promise<void> {
    if (
      !client.user.currentGames ||
      !client.user.currentGames.some(
        currentGame => currentGame.id === gameId,
      )
    ) {
      return this.socketService.sendError({
        client,
        message: 'You can\'t make move if you are not this game player',
      });
    }

    try {
      const { nextPlayersIds, playersIds, playerWonId, gameNumber } = await this.gameService.makeMove({
        move,
        gameId,
        userId: client.user.id,
      });

      const logMove = await this.logService.create({
        type: 'move',
        user: client.user,
        gameId,
        text: move,
      });

      await this.gameService.addLog({ gameId, logId: logMove.id });
      await this.userService.addLog({ userId: client.user.id, logId: logMove.id });

      if (nextPlayersIds.length) {
        nextPlayersIds.forEach(async (nextPlayerId) => {
          if (this.socketService.isUserOnline({ server: this.server, userId: nextPlayerId })) {
            return;
          }

          const { email } = await this.userService.findOneById(nextPlayerId);
          await this.emailService.sendMoveMail({ gameNumber, email });
        });
      } else {
        const logFinish = await this.logService.create({
          type: 'finish',
          user: client.user,
          gameId,
        });

        await this.gameService.addLog({ gameId, logId: logFinish.id });
        await this.userService.addLog({ userId: client.user.id, logId: logMove.id });

        await this.userService.updateGamesPlayed({ playersIds });
        await this.userService.updateGamesWon({ playerWonId });
      }

      await this.userService.updateCurrentMoves({ usersIds: nextPlayersIds, gameId });

    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    const game = JSON.parse(JSON.stringify(await this.gameService.findOneById(gameId)));

    this.socketService.sendGameToGameUsers({ server: this.server, game });

    if (game.state === GAME_FINISHED) {
      this.socketService.updateGame({ server: this.server, game: { id: gameId, state: game.state } as Game | IGame });
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

    await this.joinGame(client, invite.game.id, { isJoinByInvite: true });

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

  private kickUsersFromGame({ server, gameId }: { server: Server, gameId: string }): void {
    if (!server.sockets.adapter.rooms[gameId]) {
      return;
    }

    Object.keys(server.sockets.adapter.rooms[gameId].sockets).forEach(socketId => {
      const socketInGame = server.sockets.connected[socketId] as Socket & { user: User };
      const userInGame = socketInGame.user;

      if (userInGame) {
        socketInGame.emit('update-opened-game', null);
      }
    });
  }

}
