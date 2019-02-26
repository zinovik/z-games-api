import { UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { LogService } from '../log/log.service';
import { JwtGuard } from './../user/guards/jwt.guard';

@WebSocketGateway()
export class LogGateway {

  @WebSocketServer()
  server;

  constructor(
    private logService: LogService,
  ) { }

  @UseGuards(JwtGuard)
  @SubscribeMessage('message')
  public async message(client: Socket, { gameId, message }: { gameId: string, message: string }): Promise<void> {
    if (!client.user.currentGames || !client.user.currentGames.some(currentGame => currentGame.id === gameId)) {
      return this.sendError({ client, message: 'You can\'t make a move if you are not this game player' });
    }

    const log = await this.logService.create({ type: 'message', user: client.user, gameId, text: message });

    this.server.to(client.user.openedGame.id).emit('new-log', log);
  }

  private sendError({ client, message }: { client: Socket, message: string }): void {
    client.emit('error-message', message);
    // return this.logger.error(message);
  }

}
