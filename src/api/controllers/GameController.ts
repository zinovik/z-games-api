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
  connection(@ConnectedSocket() socket: any, @SocketQueryParam('token') token: string) {
    console.log(2, 'GameController', token);
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: any, @SocketQueryParam('token') token: string) {
    console.log(token);
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
  public async getAllGames(@MessageBody() name: string, @SocketIO() io: any): Promise<Game[]> {
    const allGames = await this.gameService.getAllGames();
    return allGames;
  }
}
