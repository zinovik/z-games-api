import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';

import { GoogleGuard } from './guards/google.guard';
import { UserService } from './user.service';
import { JwtService } from '../services/jwt.service';
import { ConfigService } from '../config/config.service';

@Controller('user')
export class UserController {

  private readonly CLIENT_URL = ConfigService.get().CLIENT_URL;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) { }

  @Get('google')
  @UseGuards(GoogleGuard)
  googleAuth() { }

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  async googleAuthCallback(@Req() req, @Res() res) {
    // const user = await this.userService.createExternalUser(
    //   req.user.email,
    //   'google',
    // );
    // const token = await this.jwtService.generateUserToken({ user });

    // res.redirect(`${this.CLIENT_URL}/callback/${token}`);
  }

}
