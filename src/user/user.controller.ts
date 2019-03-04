import { Controller, Get, UseGuards, Req, Res, Param } from '@nestjs/common';

import { GoogleGuard } from './guards/google.guard';
import { UserService } from './user.service';
import { JwtService } from '../services/jwt.service';
import { ConfigService } from '../config/config.service';
import { CreatingUserError } from '../errors';
import { User } from '../db/entities/user.entity';

interface GoogleProfile {
  emails: Array<{
    value: string,
  }>;

  displayName: string;

  name: {
    givenName: string,
    familyName: string,
  };

  photos: Array<{
    value: string,
  }>;
}

@Controller('users')
export class UserController {

  private readonly CLIENT_URL = ConfigService.get().CLIENT_URL;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  @Get()
  getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Get(':userId')
  findOneByUserId(@Param('userId') userId: string): Promise<User> {
    return this.userService.findOneByUserId(userId);
  }

  @Get('authorize/google')
  @UseGuards(GoogleGuard)
  googleAuth() {
    // redirecting to google...
  }

  @Get('authorize/google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(@Req() req: { user: GoogleProfile }, @Res() res: { redirect: (url: string) => void }) {
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
        throw new CreatingUserError(error.message);
      }

    }

    const token = this.jwtService.generateToken({ id }, '7 days');

    res.redirect(`${this.CLIENT_URL}/${token}`);
  }

}
