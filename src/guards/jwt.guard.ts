import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { JwtService } from '../services/jwt.service';
import { UserService } from '../user/user.service';
import { LoggerService } from '../logger/logger.service';
import { User } from '../db/entities/user.entity';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private logger: LoggerService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.query.token;

    if (!token) {
      this.logger.info('No token provided');
      return false;
    }

    const userId = this.jwtService.getUserIdByToken(token);

    if (!userId) {
      this.logger.info('No user id in token');
      return false;
    }

    const user: User = await this.userService.findOneByUserId(userId);

    if (!user) {
      this.logger.info('No user with token username');
      return false;
    }

    const newToken = this.jwtService.generateToken({ id: userId }, '7 days');

    context
      .switchToWs()
      .getClient()
      .emit('new-token', newToken);
    context.switchToWs().getClient().user = user;

    return true;
  }
}
