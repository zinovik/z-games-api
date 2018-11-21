import {
  Authorized, Body, Delete, Get, JsonController, OnUndefined, Param, Post, Put, Req, Res
} from 'routing-controllers';
import {
  ConnectedSocket, OnConnect, OnDisconnect, SocketController, SocketQueryParam
} from 'socket-controllers';

import { UserNotFoundError } from '../errors/UserNotFoundError';
import { User } from '../models/User';
import { UserService } from '../services/UserService';

@JsonController('/users')
@SocketController()
export class UserController {

  constructor(
    private userService: UserService
  ) { }

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

  @Post()
  @Authorized()
  public async create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Put('/:id')
  @Authorized()
  public update(@Param('id') id: string, @Body() user: User): Promise<User> {
    return this.userService.update(id, user);
  }

  @Authorized()
  @Delete('/:id')
  public delete(@Param('id') id: string): Promise<void> {
    return this.userService.delete(id);
  }

  @Post('/register')
  public async register(@Body() { email, password }: { email: string, password: string }): Promise<User> {
    const user = new User();

    user.email = email;
    user.password = password;

    return this.userService.create(user);
  }

  @Post('/authorize')
  public async authorize(@Body() { email, password }: { email: string, password: string }, @Res() res: any): Promise<any> {
    const token = await this.userService.authorize({ email, password });

    res.set('Authorization', token);

    return 'authorized';
  }

  @OnConnect()
  connection(@ConnectedSocket() socket: any, @SocketQueryParam('token') token: string) {
    console.log(1, 'UserController', token);
  }

  @OnDisconnect()
  disconnect(@ConnectedSocket() socket: any, @SocketQueryParam('token') token: string) {
    console.log(token);
  }

}
