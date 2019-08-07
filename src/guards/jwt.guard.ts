import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { JwtService } from '../services/jwt.service';
import { UserService } from '../user/user.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private jwtService: JwtService, private userService: UserService, private logger: LoggerService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const client = context.switchToWs().getClient();

    const tokenHttp =
      request.headers && request.headers.authorization && request.headers.authorization.split('Bearer ')[1];
    const tokenWebSocket = client.handshake && client.handshake.query.token;

    const token = tokenHttp || tokenWebSocket;

    if (!token) {
      this.logger.info('No token provided');
      client.emit('update-current-user', null);
      client.emit('update-opened-game', null);
      return false;
    }

    const userId = this.jwtService.getUserIdByToken(token);

    if (!userId) {
      this.logger.info('No user id in token');
      client.emit('update-current-user', null);
      client.emit('update-opened-game', null);
      return false;
    }

    let user = await this.userService.findOneById(userId);

    if (!user) {
      this.logger.info('No user with token username');
      client.emit('update-current-user', null);
      client.emit('update-opened-game', null);
      return false;
    }

    await this.userService.update({ userId });

    user = await this.userService.findOneById(userId);

    const newToken = this.jwtService.generateToken({ id: userId }, '7 days');

    client.emit('new-token', newToken);
    client.user = user;
    request.user = user;

    return true;
  }
}
