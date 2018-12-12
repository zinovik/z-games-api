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
import { UserService } from '../services/UserService';

@JsonController('/users')
@SocketController()
export class UserController {

  private userService: UserService;
  private authService: AuthService;

  constructor() {
    this.userService = Container.get(UserService);
    this.authService = Container.get(AuthService);
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
  public async getCurrentUser(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any
  ): Promise<User> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return undefined;
    }

    return user;
  }

}
