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
import { User } from '../db/entities/user.entity';
import { Log } from '../db/entities/log.entity';
import { ILog } from '../db/interfaces/log.interface';

@WebSocketGateway()
export class LogGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logService: LogService,
    private readonly logger: LoggerService,
  ) {}

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
      !client.user.currentGames ||
      !client.user.currentGames.some(currentGame => currentGame.id === gameId)
    ) {
      return this.sendError({
        client,
        message: 'You can\'t make a move if you are not this game player',
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
      return this.sendError({ client, message: error.message });
    }

    this.server.to(client.user.openedGame.id).emit('new-log', log);
  }

  private sendError({
    client,
    message,
  }: {
    client: Socket;
    message: string;
  }): void {
    this.logger.error(message, '');
    client.emit('error-message', message);
  }
}
