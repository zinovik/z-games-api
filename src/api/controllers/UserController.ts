import {
    Authorized, Body, Delete, Get, JsonController, OnUndefined, Param, Post, Put, Req, Res
} from 'routing-controllers';

import { UserNotFoundError } from '../errors/UserNotFoundError';
import { User } from '../models/User';
import { JwtService } from '../services/jwt';
import { UserService } from '../services/UserService';

// TODO: socket-controllers

@JsonController('/users')
export class UserController {

  constructor(
    private userService: UserService,
    private jwtService: JwtService
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
  public async create(@Body() user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Post('/authorize')
  public async authorize(@Body() user: User, @Res() res: any): Promise<any> {
    const { email, password } = user;

    const userDb = await this.userService.findOne(email);

    if (!userDb) {
      return 'user not found';
    }

    if (!await User.comparePassword(userDb, password)) {
      return 'wrong password';
    }

    const token = this.jwtService.generateToken({ email }, '7 days');
    res.set('Authorization', token);

    return 'authorized';
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

}
