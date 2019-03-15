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

import { GoogleGuard } from '../guards/google.guard';
import { UserService } from './user.service';
import { JwtService } from '../services/jwt.service';
import { ConfigService } from '../config/config.service';
import { CreatingUserError } from '../errors';
import { User } from '../db/entities/user.entity';
import { IUser } from '../db/interfaces/user.interface';
import { FileUploadInterceptor } from '../interceptors/file-interceptor';

interface IGoogleProfile {
  emails: Array<{
    value: string;
  }>;

  displayName: string;

  name: {
    givenName: string;
    familyName: string;
  };

  photos: Array<{
    value: string;
  }>;
}

@Controller('users')
export class UserController {
  private readonly CLIENT_URL = ConfigService.get().CLIENT_URL;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

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

    let user: User | IUser;

    try {
      user = await this.userService.create({
        username,
        password,
        email,
      });
    } catch (error) {
      throw new CreatingUserError(error.message);
    }

    res.send(user);
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
