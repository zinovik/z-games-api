import { JsonController } from 'routing-controllers';
import {
  ConnectedSocket, EmitOnFail, EmitOnSuccess, MessageBody, OnConnect, OnDisconnect, OnMessage,
  SocketController, SocketIO, SocketQueryParam
} from 'socket-controllers';
import { Container } from 'typedi';

import { AuthService } from '../../auth/AuthService';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { VerifyingTokenError } from '../errors';
import { JoiningGameError } from '../errors/JoiningGameError';
import { Game } from '../models/Game';
import { GameService } from '../services/GameService';
import { LogService } from '../services/LogService';

@JsonController('/games')
@SocketController()
export class GameController {

  private gameService: GameService;
  private authService: AuthService;
  private logService: LogService;

  constructor(
    @Logger(__filename) private log: LoggerInterface
  ) {
    this.gameService = Container.get(GameService);
    this.authService = Container.get(AuthService);
    this.logService = Container.get(LogService);
  }

  @OnConnect()
  public async connection(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any
  ) {
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

    await this.sendGameToGameUsers({ game, io });
    await this.sendGameUpdateToAllUsers({ game, io });
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

    await this.sendGameToGameUsers({ game, io });
    await this.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('new-game')
  @EmitOnFail('error-message')
  public async newGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() name: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      socket.emit('error-message', 'Error verifying token!');
      this.log.warn('Error verifying token!');
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.newGame(name);

    await this.logService.create({ type: 'create', user, gameId: game.id });

    io.emit('new-game', this.gameService.parseGameForAllUsers(game));
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
  ): Promise<Game> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    if (!user.openedGame) {
      return undefined;
    }

    const game = await this.gameService.findOne(user.openedGame.number);

    socket.join(user.openedGame.id);
    return this.gameService.parseGameForUser({ game, user });
  }

  @OnMessage('join-game')
  @EmitOnFail('error-message')
  public async joinGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    let game: Game;
    try {
      game = await this.gameService.joinGame({ user, gameNumber });
    } catch (error) {
      throw new JoiningGameError(error.message);
    }

    const log = await this.logService.create({ type: 'join', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.join(game.id);

    await this.sendGameToGameUsers({ game, io });
    await this.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('open-game')
  @EmitOnFail('error-message')
  public async openGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.openGame({ user, gameNumber });

    const log = await this.logService.create({ type: 'open', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.join(game.id);

    await this.sendGameToGameUsers({ game, io });
    await this.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('watch-game')
  @EmitOnFail('error-message')
  public async watchGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.watchGame({ user, gameNumber });

    const log = await this.logService.create({ type: 'watch', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.join(game.id);

    await this.sendGameToGameUsers({ game, io });
    await this.sendGameUpdateToAllUsers({ game, io });
  }

  @OnMessage('leave-game')
  @EmitOnSuccess('update-opened-game')
  @EmitOnFail('error-message')
  public async leaveGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<undefined> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.leaveGame({ user, gameNumber });

    const log = await this.logService.create({ type: 'leave', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.leave(game.id);

    await this.sendGameToGameUsers({ game, io });
    await this.sendGameUpdateToAllUsers({ game, io });

    return undefined;
  }

  @OnMessage('close-game')
  @EmitOnSuccess('update-opened-game')
  @EmitOnFail('error-message')
  public async closeGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.closeGame({ user, gameNumber });

    const log = await this.logService.create({ type: 'close', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    // TODO Check if player or watcher
    socket.leave(game.id);

    await this.sendGameToGameUsers({ game, io });
    await this.sendGameUpdateToAllUsers({ game, io });

    return undefined;
  }

  @OnMessage('toggle-ready')
  @EmitOnFail('error-message')
  public async toggleReady(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.toggleReady({ user, gameNumber });

    const log = await this.logService.create({ type: 'ready', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    await this.sendGameToGameUsers({ game, io });
  }

  @OnMessage('start-game')
  @EmitOnFail('error-message')
  public async startGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @MessageBody() gameNumber: number
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.startGame({ gameNumber });

    const log = await this.logService.create({ type: 'start', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    await this.sendGameToGameUsers({ game, io });
  }

  @OnMessage('make-move')
  @EmitOnFail('error-message')
  public async move(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @MessageBody() move: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new VerifyingTokenError();
    }

    const game = await this.gameService.makeMove({ move, gameNumber: user.openedGame.number, userId: user.id });

    const moveLog = await this.logService.create({ type: 'move', user, gameId: game.id, text: move });
    game.logs = [moveLog, ...game.logs];

    if (game.state === 2) {
      const finishLog = await this.logService.create({ type: 'finish', user, gameId: game.id });
      game.logs = [finishLog, ...game.logs];
    }

    await this.sendGameToGameUsers({ game, io });
  }

  private async sendGameToGameUsers({ game, io }: { game: Game, io: any }): Promise<void> {
    if (!io.sockets.adapter.rooms[game.id]) {
      return;
    }

    Object.keys(io.sockets.adapter.rooms[game.id].sockets).forEach(async socketId => {
      const socketInGame = io.sockets.connected[socketId];
      const userInGame = await this.authService.verifyAndDecodeJwt(socketInGame.handshake.query.token);
      socketInGame.emit('update-opened-game', this.gameService.parseGameForUser({ game, user: userInGame }));
    });
  }

  private async sendGameUpdateToAllUsers({ game, io }: { game: Game, io: any }): Promise<void> {
    io.emit('update-game', this.gameService.parseGameForAllUsers(game));
  }

}

// TODO: move token check into separate decorator
// TODO: Add and check error conditions, add errors
// TODO: social login
// TODO: tests
// TODO: bots
// TODO: game modules
