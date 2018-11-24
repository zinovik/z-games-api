import {
  Authorized, Body, Delete, Get, JsonController, OnUndefined, Param, Post, Put, Req
} from 'routing-controllers';
import {
  ConnectedSocket, EmitOnSuccess, MessageBody, OnConnect, OnDisconnect, OnMessage, SocketController,
  SocketIO, SocketQueryParam
} from 'socket-controllers';
import { Container } from 'typedi';

import { AuthService } from '../../auth/AuthService';
import { GameNotFoundError } from '../errors/GameNotFoundError';
import { Game } from '../models/Game';
import { Log } from '../models/Log';
import { GameService } from '../services/GameService';
import { LogService } from '../services/LogService';

@JsonController('/games')
@SocketController()
export class GameController {

  private gameService: GameService;
  private authService: AuthService;
  private logService: LogService;

  constructor() {
    this.gameService = Container.get(GameService);
    this.authService = Container.get(AuthService);
    this.logService = Container.get(LogService);
  }

  @Get()
  @Authorized()
  public find(): Promise<Game[]> {
    return this.gameService.find();
  }

  @Get('/me')
  @Authorized()
  public findMe(@Req() req: any): Promise<Game[]> {
    return req.game;
  }

  @Get('/:email')
  @Authorized()
  @OnUndefined(GameNotFoundError)
  public one(@Param('email') email: string): Promise<Game | undefined> {
    return this.gameService.findOne(email);
  }

  @Post()
  @Authorized()
  public async create(@Body() game: Game): Promise<Game> {
    return this.gameService.create(game);
  }

  @Put('/:id')
  @Authorized()
  public update(@Param('id') id: string, @Body() game: Game): Promise<Game> {
    return this.gameService.update(id, game);
  }

  @Authorized()
  @Delete('/:id')
  public delete(@Param('id') id: string): Promise<void> {
    return this.gameService.delete(id);
  }

  @OnConnect()
  public async connection(@ConnectedSocket() socket: any, @SocketQueryParam('token') token: string) {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return;
    }

    console.log(user);

    // user.
  }

  @OnDisconnect()
  public async disconnect(@ConnectedSocket() socket: any, @SocketQueryParam('token') token: string): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return;
    }

    console.log(user);

    // user.
  }

  @OnMessage('new-game')
  public async newGame(@MessageBody() name: string, @SocketIO() io: any, @SocketQueryParam('token') token: string): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return;
    }

    const game = await this.gameService.newGame(name);

    const log = new Log();
    log.userId = user.id;
    log.gameId = game.id;
    log.type = 'create';
    await this.logService.create(log);

    io.emit('new-game', game);
  }

  @OnMessage('get-all-games')
  @EmitOnSuccess('all-games')
  public async getAllGames(): Promise<Game[]> {
    return await this.gameService.getAllGames();
  }

  @OnMessage('join-game')
  public async joinGame(
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number,
    @SocketIO() io: any,
    @SocketQueryParam('token') token: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new Error(); // TODO
    }
    const game = await this.gameService.joinGame({ user, gameNumber });

    io.emit('update-game', game);

    await this.logService.create({ type: 'join', userId: user.id, gameId: game.id });

    socket.join(game.id);
    io.to(game.id).emit('update-open-game', game);
  }

  @OnMessage('open-game')
  public async openGame(
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number,
    @SocketIO() io: any,
    @SocketQueryParam('token') token: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new Error(); // TODO
    }
    const game = await this.gameService.openGame({ user, gameNumber });

    io.emit('update-game', game);

    await this.logService.create({ type: 'open', userId: user.id, gameId: game.id });

    socket.join(game.id);
    io.to(game.id).emit('update-open-game', game);
  }

  @OnMessage('watch-game')
  public async watchGame(
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number,
    @SocketIO() io: any,
    @SocketQueryParam('token') token: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new Error(); // TODO
    }
    const game = await this.gameService.watchGame({ user, gameNumber });

    io.emit('update-game', game);

    await this.logService.create({ type: 'watch', userId: user.id, gameId: game.id });

    socket.join(game.id);
    io.to(game.id).emit('update-open-game', game);
  }

  @OnMessage('leave-game')
  @EmitOnSuccess('update-open-game')
  public async leaveGame(
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number,
    @SocketIO() io: any,
    @SocketQueryParam('token') token: string
  ): Promise<undefined> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new Error(); // TODO
    }
    const game = await this.gameService.leaveGame({ user, gameNumber });

    io.emit('update-game', game);

    await this.logService.create({ type: 'leave', userId: user.id, gameId: game.id });

    socket.leave(game.id);
    io.to(game.id).emit('update-open-game', game);

    return undefined;
  }

  @OnMessage('close-game')
  @EmitOnSuccess('update-open-game')
  public async closeGame(
    @ConnectedSocket() socket: any,
    @MessageBody() gameNumber: number,
    @SocketIO() io: any,
    @SocketQueryParam('token') token: string
  ): Promise<undefined> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new Error(); // TODO
    }
    const game = await this.gameService.closeGame({ user, gameNumber });

    io.emit('update-game', game);

    await this.logService.create({ type: 'create', userId: user.id, gameId: game.id });

    socket.leave(game.id);
    io.to(game.id).emit('update-open-game', game);

    return undefined;
  }
}
