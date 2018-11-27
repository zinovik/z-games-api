import { Authorized, JsonController } from 'routing-controllers';
import {
  MessageBody, OnMessage, SocketController, SocketIO, SocketQueryParam
} from 'socket-controllers';
import { Container } from 'typedi';

import { AuthService } from '../../auth/AuthService';
import { LogService } from '../services/LogService';

@Authorized()
@JsonController('/logs')
@SocketController()
export class LogController {

  private authService: AuthService;
  private logService: LogService;

  constructor() {
    this.authService = Container.get(AuthService);
    this.logService = Container.get(LogService);
  }

  @OnMessage('message')
  public async message(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @MessageBody() text: string
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return;
    }

    const log = await this.logService.create({ type: 'message', userId: user.id, gameId: user.openedGame.id, text });

    io.to(user.openedGame.id).emit('new-log', log);
  }

}
