import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Param,
  // UseInterceptors,
  UploadedFile,
  Request,
  Response,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';

import { GoogleGuard } from '../guards/google.guard';
import { UserService } from './user.service';
import { JwtService } from '../services/jwt.service';
import { ConfigService } from '../config/config.service';
import { CreatingUserException, ActivationUserException, AuthorizationUserException } from '../exceptions';
import { User } from '../db/entities';
import { IUser } from '../db/interfaces';
// import { FileUploadInterceptor } from '../interceptors/file-interceptor';
import { IGoogleProfile } from './google-profile.interface';
import { EmailService } from '../services/email.service';
import { CryptService } from '../services/crypt.service';

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
  getAllUsers(): Promise<User[] | IUser[]> {
    return this.userService.getAllUsers();
  }

  @Get(':userId')
  findOneById(@Param('userId') userId: string): Promise<User | IUser> {
    return this.userService.findOneById(userId);
  }

  @Post('register')
  async register(
    @Req() { body: { username, password, email } }: Request & { body: { username: string, password: string, email: string } },
    @Res() res: Response & { send: (user: User | IUser) => null },
  ) {
    if (!password || !email || !username) {
      throw new CreatingUserException('All fields are are required!');
    }

    const usernameRegexp = /[0-9a-zA-Z]{3,30}/;
    const passwordRegexp = /[0-9a-zA-Z]{6,30}/;
    const emailRegexp = /^([a-zA-Z0-9_\-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

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
      await this.emailService.sendRegistrationMail({ id: user.id, email: user.email });
    } catch (error) {
      throw new CreatingUserException('Error sending email, please contact administration to support');
    }

    res.send(user);
  }

  @Post('activate')
  async activate(
    @Req() { body: { token: activationToken } }: Request & { body: { token: string } },
    @Res() res: Response & { send: (parameters: { token: string }) => null },
  ) {
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

    res.send({ token });
  }

  @Post('authorize')
  async authorize(
    @Req() { body: { username, password } }: Request & { body: { username: string, password: string } },
    @Res() res: Response & { send: (parameters: { token: string }) => null },
  ) {
    const user = await this.userService.findOneByUsername(username);

    if (!user) {
      throw new AuthorizationUserException('Invalid username!');
    }

    if (!await CryptService.comparePassword(password, user.password)) {
      throw new AuthorizationUserException('Invalid password!');
    }

    if (!user.isConfirmed) {
      throw new AuthorizationUserException('User is not activated! Check email to activate user');
    }

    const token = this.jwtService.generateToken({ id: user.id }, '7 days');

    res.send({ token });
  }

  @Post('avatar')
  // @UseGuards(JwtGuard)
  // @UseInterceptors(FileUploadInterceptor)
  async updateAvatar(
    @UploadedFile() file: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // const user = await this.userService.updateAvatar(req.user.email, file && file.secure_url);
    // res.send(user);
  }

  // TODO: Add update username

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
        throw new CreatingUserException(error.message);
      }
    }

    const token = this.jwtService.generateToken({ id }, '7 days');

    res.redirect(`${this.CLIENT_URL}/${token}`);
  }

  @Get('get-users/:username')
  async getUsers(
    @Param() { username }: { username: string },
    @Res() res: Response & { send: (users: User[] | IUser[]) => null },
  ) {
    // TODO: Add guard

    if (!username) {
      throw new Error('Invalid username!'); // TODO
    }

    const users = await this.userService.findManyByUsername(username);

    res.send(users);
  }
}
