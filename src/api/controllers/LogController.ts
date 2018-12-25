import { Authorized, JsonController } from 'routing-controllers';
import {
  ConnectedSocket, MessageBody, OnMessage, SocketController, SocketIO, SocketQueryParam
} from 'socket-controllers';
import { Container } from 'typedi';

import { AuthService } from '../../auth/AuthService';
import { LogService } from '../services/LogService';
import { UserService } from '../services/UserService';

@Authorized()
@JsonController('/logs')
@SocketController()
export class LogController {

  private authService: AuthService;
  private logService: LogService;
  private userService: UserService;

  constructor() {
    this.authService = Container.get(AuthService);
    this.logService = Container.get(LogService);
    this.userService = Container.get(UserService);
  }

  @OnMessage('message')
  public async message(
    @SocketQueryParam('token') token: string,
    @SocketIO() io: any,
    @ConnectedSocket() socket: any,
    @MessageBody() { gameId, message }: { gameId: string, message: string }
  ): Promise<void> {
    const user = await this.authService.verifyAndDecodeJwt(token);

    if (!user) {
      return;
    }

    if (!user.currentGames || !user.currentGames.some(currentGame => currentGame.id === gameId)) {
      return this.userService.sendError({ socket, message: 'You can\'t make move if you are not this game player' });
    }

    const log = await this.logService.create({ type: 'message', user, gameId, text: message });

    io.to(user.openedGame.id).emit('new-log', log);
  }

}
