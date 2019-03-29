import {
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { JwtGuard } from '../guards/jwt.guard';
import { User } from '../db/entities';

@WebSocketGateway()
export class UserGateway {

  @WebSocketServer()
  server: Server;

  handlConnect() {
    this.updateUsersOnline();
  }

  handleDisconnect() {
    this.updateUsersOnline();
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('get-current-user')
  public getCurrentUser(
    client: Socket & { user: User },
  ): WsResponse<User> {
    return { event: 'update-current-user', data: client.user };
  }

  @SubscribeMessage('get-users-online')
  public getUsersOnline(): void {
    this.updateUsersOnline();
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('logout')
  public async logout(client: Socket & { user: User }): Promise<WsResponse<null>> {
    client.emit('new-token', null);
    return { event: 'update-current-user', data: null };
  }

  private updateUsersOnline() {
    this.server.emit('update-users-online', this.getUsersOnlineFromSockets(this.server.sockets.connected));
  }

  private getUsersOnlineFromSockets(sockets: { [key: string]: Socket }): {
    users: User[],
    usersCount: number,
  } {
    const users: User[] = [];

    Object.keys(sockets).forEach(socketId => {
      const socket = sockets[socketId] as Socket & { user: User };

      if (socket.user) {
        users.push(socket.user);
      }
    });

    return {
      users,
      usersCount: Object.keys(sockets).length,
    };
  }

}
