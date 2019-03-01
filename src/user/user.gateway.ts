import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Socket } from 'socket.io';

import { JwtGuard } from './guards/jwt.guard';
import { User } from '../db/entities/user.entity';

@WebSocketGateway()
export class UserGateway {

  @UseGuards(JwtGuard)
  @SubscribeMessage('get-current-user')
  public getCurrentUser(client: Socket & { user: User }, payload: void): WsResponse<User> {
    return { event: 'update-current-user', data: client.user };
  }

  @SubscribeMessage('logout')
  public logout(client: Socket, payload: void): WsResponse<null> {
    return { event: 'update-current-user', data: null };
  }

}
