import {
  Authorized, Body, Get, JsonController, OnUndefined, Param, Post, Put, Redirect, Req, Res,
  UseBefore
} from 'routing-controllers';
import {
  ConnectedSocket, EmitOnSuccess, OnMessage, SocketController, SocketIO, SocketQueryParam
} from 'socket-controllers';
import { Container } from 'typedi';

import { AuthService } from '../../auth/AuthService';
import { env } from '../../env';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { GoogleMiddleware } from '../middlewares/GoogleMiddleware';
import { User } from '../models/User';
import { JwtService } from '../services/jwt';
import { UserService } from '../services/UserService';

@JsonController('/users')
@SocketController()
export class UserController {

  private userService: UserService;
  private authService: AuthService;
  private jwtService: JwtService;

  constructor() {
    this.userService = Container.get(UserService);
    this.authService = Container.get(AuthService);
    this.jwtService = Container.get(JwtService);
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
  public one(@Param('username') email: string): Promise<User | undefined> {
    return this.userService.findOne(email);
  }

  @Put('/:id')
  @Authorized()
  public update(@Param('id') id: string, @Body() user: User): Promise<User> {
    return this.userService.update(id, user);
  }

  @Post('/register')
  public async register(@Body() { username, email, password }: { username: string, email: string, password: string }): Promise<User> {
    return this.userService.register({ username, email, password });
  }

  @Post('/authorize')
  public async authorize(@Body() { username, password }: { username: string, password: string }, @Res() res: any): Promise<User> {
    const { user, token } = await this.userService.authorize({ username, password });

    res.set('Authorization', token);

    return user;
  }

  @Get('/authorize/google')
  @UseBefore(GoogleMiddleware)
  public async authorizeGoogle(): Promise<void> {
    // redirecting to google...
  }

  @Get('/authorize/google/callback')
  @Redirect(`${env.app.frontEndUrl}/:token`)
  @UseBefore(GoogleMiddleware)
  public async authorizeGoogleCallback(@Req() req: any, @Res() res: any): Promise<{ token: string }> {
    const user = await this.userService.findOne(req.user.emails[0].value);

    const username = req.user.displayName || req.user.emails[0].value;

    if (!user) {
      const newUser = this.userService.register({
        username,
        email: req.user.emails[0].value,
        provider: 'google',
        firstName: req.user.name.givenName,
        lastName: req.user.name.familyName,
        avatar: req.user.photos[0].value,
      });

      if (!newUser) {
        throw new Error(); // TODO: Error
      }
    }

    const token = this.jwtService.generateToken({ username }, '7 days');

    return {
      token,
    };
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
