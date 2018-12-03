import { JsonController } from 'routing-controllers';
import {
  ConnectedSocket, EmitOnSuccess, MessageBody, OnConnect, OnDisconnect, OnMessage, SocketController,
  SocketIO, SocketQueryParam
} from 'socket-controllers';
import { Container } from 'typedi';

import { AuthService } from '../../auth/AuthService';
import * as types from '../../constants';
import { Game } from '../models/Game';
import { GameService } from '../services/GameService';
import { LogService } from '../services/LogService';
import { UserService } from '../services/UserService';

@JsonController('/games')
@SocketController()
export class GameController {

  private gameService: GameService;
  private authService: AuthService;
  private logService: LogService;
  private userService: UserService;

  constructor(
  ) {
    this.gameService = Container.get(GameService);
    this.authService = Container.get(AuthService);
    this.logService = Container.get(LogService);
    this.userService = Container.get(UserService);
  }

  @OnConnect()
  public async connect(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return;
    }

    if (!user.openedGame) {
      return;
    }

    const game = await this.gameService.findOne(user.openedGame.number);

    const log = await this.logService.create({ type: 'connect', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.join(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });
  }

  @OnDisconnect()
  public async disconnect(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return;
    }

    if (!user.openedGame) {
      return;
    }

    const game = await this.gameService.findOne(user.openedGame.number);

    const log = await this.logService.create({ type: 'disconnect', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.leave(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('new-game')
  public async newGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() name: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return this.userService.sendError({ socket, message: 'Error verifying token!' });
    }

    const game = await this.gameService.newGame(name);

    await this.logService.create({ type: 'create', user, gameId: game.id });

    this.gameService.sendNewGameToAllUsers({ game, io });
  }

  @OnMessage('get-all-games')
  @EmitOnSuccess('all-games')
  public async getAllGames(): Promise<Game[]> {
    return await this.gameService.getAllGames();
  }

  @OnMessage('get-opened-game')
  @EmitOnSuccess('update-opened-game')
  public async getOpenedGame(
    @SocketQueryParam('token') token: string,
    @ConnectedSocket() socket: any
  ): Promise<Game | void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return undefined;
    }

    if (!user.openedGame) {
      return undefined;
    }

    const game = await this.gameService.findOne(user.openedGame.number);

    socket.join(user.openedGame.id);
    return this.gameService.parseGameForUser({ game, user });
  }

  @OnMessage('join-game')
  public async joinGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return this.userService.sendError({ socket, message: 'Error verifying token!' });
    }

    let game: Game;
    try {
      game = await this.gameService.joinGame({ user, gameNumber });
    } catch (error) {
      return this.userService.sendError({ socket, message: error.message });
    }

    const log = await this.logService.create({ type: 'join', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.join(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('open-game')
  public async openGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return this.userService.sendError({ socket, message: 'Error verifying token!' });
    }

    const game = await this.gameService.openGame({ user, gameNumber });

    const log = await this.logService.create({ type: 'open', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.join(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('watch-game')
  public async watchGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return this.userService.sendError({ socket, message: 'Error verifying token!' });
    }

    let game: Game;

    try {
      game = await this.gameService.watchGame({ user, gameNumber });
    } catch (error) {
      return this.userService.sendError({ socket, message: error.message });
    }

    const log = await this.logService.create({ type: 'watch', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.join(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('leave-game')
  @EmitOnSuccess('update-opened-game')
  public async leaveGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<Game> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      this.userService.sendError({ socket, message: 'Error verifying token!' });
      return undefined;
    }

    const game = await this.gameService.leaveGame({ user, gameNumber });

    const log = await this.logService.create({ type: 'leave', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.leave(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });

    return undefined;
  }

  @OnMessage('close-game')
  @EmitOnSuccess('update-opened-game')
  public async closeGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<Game> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      this.userService.sendError({ socket, message: 'Error verifying token!' });
      return undefined;
    }

    const game = await this.gameService.closeGame({ user, gameNumber });

    const log = await this.logService.create({ type: 'close', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    // TODO Check if player or watcher
    socket.leave(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });

    return undefined;
  }

  @OnMessage('toggle-ready')
  public async toggleReady(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return this.userService.sendError({ socket, message: 'Error verifying token!' });
    }

    const game = await this.gameService.toggleReady({ user, gameNumber });

    const log = await this.logService.create({ type: 'ready', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    await this.gameService.sendGameToGameUsers({ game, io });
  }

  @OnMessage('start-game')
  public async startGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return this.userService.sendError({ socket, message: 'Error verifying token!' });
    }

    const game = await this.gameService.startGame({ gameNumber });

    const log = await this.logService.create({ type: 'start', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    await this.gameService.sendGameToGameUsers({ game, io });
  }

  @OnMessage('make-move')
  public async move(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() move: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return this.userService.sendError({ socket, message: 'Error verifying token!' });
    }

    const game = await this.gameService.makeMove({ move, gameNumber: user.openedGame.number, userId: user.id });

    const moveLog = await this.logService.create({ type: 'move', user, gameId: game.id, text: move });
    game.logs = [moveLog, ...game.logs];

    if (game.state === types.GAME_FINISHED) {
      const finishLog = await this.logService.create({ type: 'finish', user, gameId: game.id });
      game.logs = [finishLog, ...game.logs];
    }

    await this.gameService.sendGameToGameUsers({ game, io });
  }

}

// TODO: move token check into separate decorator
// TODO: Add and check error conditions, add errors
// TODO: social login
// TODO: tests
// TODO: bots
// TODO: game modules
