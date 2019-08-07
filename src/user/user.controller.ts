import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';

import { GoogleGuard } from '../guards/google.guard';
import { LocalGuard } from '../guards/local.guard';
import { JwtGuard } from '../guards/jwt.guard';
import { UserService } from './user.service';
import { JwtService } from '../services/jwt.service';
import { ConfigService } from '../config/config.service';
import { CreatingUserException, ActivationUserException } from '../exceptions';
import { User } from '../db/entities';
import { IUser } from '../db/interfaces';
import { FileUploadInterceptor } from '../interceptors/file-interceptor';
import { IGoogleProfile } from './google-profile.interface';
import { EmailService } from '../services/email.service';

@Controller('users')
export class UserController {
  private readonly CLIENT_URL = ConfigService.get().CLIENT_URL;
  userModel: Model<IUser>;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    @InjectConnection() private readonly connectionMongo: ConnectionMongo,
  ) {
    this.userModel = this.connectionMongo.model('User');
  }

  @Get()
  getAllUsers(): Promise<User[] | IUser[]> {
    return this.userService.getAllUsers();
  }

  @Get('id/:userId')
  findOneById(@Param('userId') userId: string): Promise<User | IUser> {
    if (!userId) {
      return null;
    }

    try {
      return this.userService.findOneById(userId);
    } catch (error) {
      return null;
    }
  }

  @Get('username/:username')
  findOneByUsername(@Param('username') username: string): Promise<User | IUser> {
    if (!username) {
      return null;
    }

    try {
      return this.userService.findOneByUsername(username);
    } catch (error) {
      return null;
    }
  }

  @Post('register')
  async register(@Req()
  {
    body: { username, password, email },
  }: Request & {
    body: { username: string; password: string; email: string };
  }): Promise<User | IUser> {
    if (!password || !email || !username) {
      throw new CreatingUserException('All fields are are required!');
    }

    const usernameRegexp = new RegExp('[0-9a-zA-Z]{3,30}');
    const passwordRegexp = new RegExp('[0-9a-zA-Z]{6,30}');
    const emailRegexp = new RegExp(
      '^([a-zA-Z0-9_\\-.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)$',
    );

    const isUsernameOk = usernameRegexp.test(username);
    const isPasswordOk = passwordRegexp.test(password);
    const isEmailOk = emailRegexp.test(email);

    if (!isUsernameOk || !isPasswordOk || !isEmailOk) {
      throw new CreatingUserException('Error fields validation!');
    }

    let user: User | IUser;

    try {
      user = await this.userService.create({
        username: username || email,
        password,
        email,
      });
    } catch (error) {
      throw new CreatingUserException(error.message);
    }

    try {
      await this.emailService.sendRegistrationMail({
        id: user.id,
        email: user.email,
      });
    } catch (error) {
      throw new CreatingUserException('Error sending email, please contact administration to support');
    }

    return user;
  }

  @Post('activate')
  async activate(@Req()
  {
    body: { token: activationToken },
  }: Request & { body: { token: string } }): Promise<{ token: string }> {
    const userId = this.jwtService.getUserIdByToken(activationToken);

    const user = await this.userService.findOneById(userId);

    if (!user) {
      throw new ActivationUserException('Invalid link!');
    }

    if (user.isConfirmed) {
      throw new ActivationUserException('User has already been activated!');
    }

    await this.userModel.findOneAndUpdate(
      { _id: user.id },
      {
        isConfirmed: true,
      },
    );

    const token = this.jwtService.generateToken({ id: user.id }, '7 days');

    return { token };
  }

  @Post('authorize')
  @UseGuards(LocalGuard)
  async authorize(@Req() { user }: { user: User | IUser }): Promise<{
    token: string;
  }> {
    const token = this.jwtService.generateToken({ id: user.id }, '7 days');

    return { token };
  }

  @Post('forgot-password')
  async forgotPassword(@Req() { body: { username } }: Request & { body: { username: string } }): Promise<{
    result: string;
    message?: string;
  }> {
    let user: User | IUser;

    try {
      user = await this.userService.findOneByUsername(username);
    } catch (error) {
      throw new CreatingUserException(error.message);
    }

    if (!user) {
      return { result: 'error', message: "User isn't found" };
    }

    try {
      await this.emailService.sendResetPasswordMail({
        id: user.id,
        email: user.email,
      });
    } catch (error) {
      throw new CreatingUserException('Error sending email, please contact administration to support');
    }

    return { result: 'success' };
  }

  @Post('set-password')
  async setPassword(@Req()
  {
    body: { token: setPasswordToken, password },
  }: Request & { body: { token: string; password: string } }): Promise<any> {
    const passwordRegexp = new RegExp('[0-9a-zA-Z]{6,30}');

    const isPasswordOk = passwordRegexp.test(password);

    if (!isPasswordOk) {
      throw new CreatingUserException('Too week password!');
    }

    const userId = this.jwtService.getUserIdByToken(setPasswordToken);

    const user = await this.userService.findOneById(userId);

    if (!user) {
      throw new ActivationUserException('Invalid link!');
    }

    await this.userModel.findOneAndUpdate(
      { _id: user.id },
      {
        password,
        isConfirmed: true,
      },
    );

    const token = this.jwtService.generateToken({ id: user.id }, '7 days');

    return { token };
  }

  @Post('update')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  async update(@Req()
  {
    body: { username, notificationsToken },
    user,
  }: Request & { body: { username?: string; notificationsToken?: string }; user: IUser | User }): Promise<void> {
    this.userService.update({ userId: user.id, username, notificationsToken });
  }

  @Post('avatar')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileUploadInterceptor)
  async updateAvatar(
    @UploadedFile() file: any,
    @Req() { user: { id } }: Request & { user: IUser | User },
  ): Promise<{ avatar: string }> {
    const avatar = file && file.secure_url;
    await this.userService.update({ userId: id, avatar });
    return { avatar };
  }

  @Get('authorize/google')
  @UseGuards(GoogleGuard)
  googleAuth() {
    // redirecting to google...
  }

  @Get('authorize/google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(
    @Req() req: { user: IGoogleProfile },
    @Res() res: Response & { redirect: (url: string) => void },
  ) {
    const user = await this.userService.findOneByEmail(req.user.emails[0].value);

    let id: string;

    if (user) {
      id = user.id;
    } else {
      try {
        const newUser = await this.userService.create({
          username: req.user.displayName || req.user.emails[0].value,
          email: req.user.emails[0].value,
          provider: 'google',
          firstName: req.user.name.givenName,
          lastName: req.user.name.familyName,
          avatar: req.user.photos[0].value,
        });

        id = newUser.id;
      } catch (error) {
        throw new CreatingUserException(error.message);
      }
    }

    const token = this.jwtService.generateToken({ id }, '7 days');

    res.redirect(`${this.CLIENT_URL}/${token}`);
  }

  @Get('find/:username')
  @UseGuards(JwtGuard)
  async getUsers(@Param() { username }: { username: string }): Promise<User[] | IUser[]> {
    if (!username) {
      return [] as User[] | IUser[];
    }

    const users = await this.userService.findManyByUsername(username);

    return users;
  }
}
