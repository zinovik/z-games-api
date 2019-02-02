import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';

import { GoogleGuard } from './guards/google.guard';
import { UserService } from './user.service';
import { JwtService } from '../services/jwt.service';
import { ConfigService } from '../config/config.service';

@Controller('users')
export class UserController {

  private readonly CLIENT_URL = ConfigService.get().CLIENT_URL;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  @Get('authorize/google')
  @UseGuards(GoogleGuard)
  googleAuth() {
    // redirecting to google...
  }

  @Get('authorize/google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(@Req() req, @Res() res) {
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

    res.redirect(`${this.CLIENT_URL}/${token}`);
  }

}
