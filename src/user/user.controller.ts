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
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';

import { GoogleGuard } from '../guards/google.guard';
import { UserService } from './user.service';
import { JwtService } from '../services/jwt.service';
import { ConfigService } from '../config/config.service';
import { CreatingUserError, ActivationUserError, AuthorizationUserError } from '../errors';
import { User } from '../db/entities/user.entity';
import { IUser } from '../db/interfaces/user.interface';
import { FileUploadInterceptor } from '../interceptors/file-interceptor';
import { IGoogleProfile } from './google-profile.interface';
import { EmailService } from '../services/email.service';

@Controller('users')
export class UserController {
  private readonly CLIENT_URL = ConfigService.get().CLIENT_URL;
  userModel: Model<IUser>;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectConnection() private readonly connectionMongo: ConnectionMongo,
  ) {
    this.userModel = this.connectionMongo.model('User');
  }

  @Get()
  getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Get(':userId')
  findOneByUserId(@Param('userId') userId: string): Promise<User> {
    return this.userService.findOneByUserId(userId);
  }

  @Post('register')
  async register(
    @Req() { body: { username, password, email } }: { body: { username: string, password: string, email: string } },
    @Res() res: any,
  ) {
    if (!password || !email) {
      throw new CreatingUserError('Email and password are required fields!');
    }

    let user: User | IUser;

    try {
      user = await this.userService.create({
        username: username || email,
        password,
        email,
      });
    } catch (error) {
      throw new CreatingUserError(error.message);
    }

    try {
      await this.emailService.sendRegistrationMail({ id: user.id, email: user.email });
    } catch (error) {
      throw new CreatingUserError('Error sending email, please contact administration to support');
    }

    res.send(user);
  }

  @Post('activate')
  async activate(@Req() { body: { token: activationToken } }: { body: { token: string } }, @Res() res: any) {
    const userId = this.jwtService.getUserIdByToken(activationToken);

    const user = await this.userService.findOneByUserId(userId);

    if (!user) {
      throw new ActivationUserError('Invalid link!');
    }

    if (user.isConfirmed) {
      throw new ActivationUserError('User has already been activated!');
    }

    await this.userModel.findOneAndUpdate(
      { _id: user.id },
      {
        isConfirmed: true,
      },
    );

    const token = this.jwtService.generateToken({ id: user.id }, '7 days');

    res.send({ token });
  }

  @Post('authorize')
  async authorize(@Req() { body: { username, password } }: { body: { username: string, password: string } }, @Res() res: any) {
    const user = await this.userService.findOneByUsername(username);

    if (!user) {
      throw new AuthorizationUserError('Invalid username!');
    }

    if (!await User.comparePassword(user, password)) {
      throw new AuthorizationUserError('Invalid password!');
    }

    if (!user.isConfirmed) {
      throw new AuthorizationUserError('User is not activated! Check email to activate user');
    }

    const token = this.jwtService.generateToken({ id: user.id }, '7 days');

    res.send({ token });
  }

  @Post('avatar')
  // @UseGuards(JwtGuard)
  @UseInterceptors(FileUploadInterceptor)
  async updateAvatar(
    @UploadedFile() file: any,
    @Req() req: any,
    @Res() res: any,
  ) {
    // const user = await this.userService.updateAvatar(req.user.email, file && file.secure_url);
    // res.send(user);
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
    @Res() res: { redirect: (url: string) => void },
  ) {
    const user = await this.userService.findOneByEmail(
      req.user.emails[0].value,
    );

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
        throw new CreatingUserError(error.message);
      }
    }

    const token = this.jwtService.generateToken({ id }, '7 days');

    res.redirect(`${this.CLIENT_URL}/${token}`);
  }
}
