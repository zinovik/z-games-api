import {
  Authorized, Body, Get, JsonController, OnUndefined, Param, Post, Put, Req, Res
} from 'routing-controllers';
import {
  ConnectedSocket, EmitOnSuccess, OnMessage, SocketController, SocketIO, SocketQueryParam
} from 'socket-controllers';
import { Container } from 'typedi';

import { AuthService } from '../../auth/AuthService';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { User } from '../models/User';
import { GameService } from '../services/GameService';
import { LogService } from '../services/LogService';
import { UserService } from '../services/UserService';

@JsonController('/users')
@SocketController()
export class UserController {

  private userService: UserService;
  private authService: AuthService;
  private gameService: GameService;
  private logService: LogService;

  constructor() {
    this.userService = Container.get(UserService);
    this.authService = Container.get(AuthService);
    this.gameService = Container.get(GameService);
    this.logService = Container.get(LogService);
  }

  @Get()
  @Authorized()
  public find(): Promise<User[]> {
    return this.userService.find();
  }

  @Get('/me')
  @Authorized()
  public findMe(@Req() req: any): Promise<User[]> {
    return req.user;
  }

  @Get('/:email')
  @Authorized()
  @OnUndefined(UserNotFoundError)
  public one(@Param('email') email: string): Promise<User | undefined> {
    return this.userService.findOne(email);
  }

  @Put('/:id')
  @Authorized()
  public update(@Param('id') id: string, @Body() user: User): Promise<User> {
    return this.userService.update(id, user);
  }

  @Post('/register')
  public async register(@Body() { username, password }: { username: string, password: string }): Promise<string> {
    return this.userService.register({ username, password });
  }

  @Post('/authorize')
  public async authorize(@Body() { username, password }: { username: string, password: string }, @Res() res: any): Promise<User> {
    const { user, token } = await this.userService.authorize({ username, password });

    res.set('Authorization', token);

    return user;
  }

  @OnMessage('logout')
  @EmitOnSuccess('update-current-user')
  public async logout(
    @SocketQueryParam('token') token: string
  ): Promise<User> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      throw new Error();
    }

    return undefined;
  }

  @OnMessage('get-current-user')
  @EmitOnSuccess('update-current-user')
  public async leaveGame(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any
  ): Promise<User> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return undefined;
    }

    if (!user.openedGame) {
      return user;
    }

    const game = await this.gameService.findOne(user.openedGame.number);

    const log = await this.logService.create({ type: 'disconnect', user, gameId: game.id });
    game.logs = [log, ...game.logs];

    socket.leave(game.id);

    await this.gameService.sendGameToGameUsers({ game, io });
    await this.gameService.sendGameUpdateToAllUsers({ game, io });

    return user;
  }

}
