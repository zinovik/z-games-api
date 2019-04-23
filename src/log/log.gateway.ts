import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { LogService } from '../log/log.service';
import { LoggerService } from '../logger/logger.service';
import { JwtGuard } from '../guards/jwt.guard';
import { User, Log } from '../db/entities';
import { ILog } from '../db/interfaces';

@WebSocketGateway()
export class LogGateway {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logService: LogService,
    private readonly logger: LoggerService,
  ) { }

  @UseGuards(JwtGuard)
  @SubscribeMessage('message')
  public async message(
    client: Socket & { user: User },
    {
      gameId,
      message,
    }: {
      gameId: string;
      message: string;
    },
  ): Promise<void> {
    if (
      (!client.user.currentGames || !client.user.currentGames.some(game => game.id === gameId)) &&
      (!client.user.currentWatch || client.user.currentWatch.id !== gameId)
    ) {
      return this.sendError({
        client,
        message: 'You can\'t send a message if you are not this game player',
      });
    }

    let log: Log | ILog;

    try {
      log = await this.logService.create({
        type: 'message',
        user: client.user,
        gameId,
        text: message,
      });
    } catch (error) {
      return this.sendError({ client, message: error.response.message });
    }

    this.server.to(gameId).emit('new-log', log);
  }

  private sendError({ client, message }: { client: Socket; message: string; }): void {
    this.logger.error(message, '');
    client.emit('error-message', { message });
  }
}
