import { UseGuards } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SocketService } from '../services/socket.service';
import { LogService } from './log.service';
import { GameService } from '../game/game.service';
import { UserService } from '../user/user.service';
import { JwtGuard } from '../guards/jwt.guard';
import { User, Log } from '../db/entities';
import { ILog } from '../db/interfaces';

@WebSocketGateway()
export class LogGateway {

  @WebSocketServer()
  server: Server;

  private readonly gameService: GameService;

  constructor(
    private readonly logService: LogService,
    private readonly userService: UserService,
    private readonly socketService: SocketService,
    private readonly moduleRef: ModuleRef,
  ) {
    this.gameService = this.moduleRef.get(GameService, { strict: false });
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('message')
  public async message(client: Socket & { user: User }, { gameId, message }: { gameId: string; message: string; }): Promise<void> {
    if (
      (!client.user.currentGames || !client.user.currentGames.some(game => game.id === gameId)) &&
      (!client.user.openedGameWatcher || client.user.openedGameWatcher.id !== gameId)
    ) {
      this.socketService.sendError({
        client,
        message: 'You can\'t send a message if you are not this game player',
      });
      return;
    }

    let log: Log | ILog;

    try {
      log = await this.logService.create({
        type: 'message',
        user: client.user,
        gameId,
        text: message,
      });

      await this.gameService.addLog({ gameId, logId: log.id });
      await this.userService.addLog({ userId: client.user.id, logId: log.id });
    } catch (error) {
      return this.socketService.sendError({ client, message: error.response.message });
    }

    this.server.to(gameId).emit('new-log', log);
  }

}
