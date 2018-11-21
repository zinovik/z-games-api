import {
  Authorized, Body, Delete, Get, JsonController, OnUndefined, Param, Post, Put, Req
} from 'routing-controllers';
import {
  ConnectedSocket, MessageBody, OnConnect, OnDisconnect, OnMessage, SocketController,
  SocketQueryParam
} from 'socket-controllers';

import { GameNotFoundError } from '../errors/GameNotFoundError';
import { Game } from '../models/Game';
import { GameService } from '../services/GameService';

@JsonController('/games')
@SocketController()
export class GameController {

  constructor(
    private gameService: GameService
  ) { }

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
  public newGame(@MessageBody() name: string): void {
    console.log(3, name);
    const ret = this.gameService.newGame(name);
    console.log(ret);
  }
}
