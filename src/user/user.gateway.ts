import { SubscribeMessage, WebSocketGateway, WsResponse } from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';

import { JwtGuard } from './guards/jwt.guard';
import { User } from '../db/entities/user.entity';

@WebSocketGateway()
export class UserGateway {

  @UseGuards(JwtGuard)
  @SubscribeMessage('get-current-user')
  public getCurrentUser(client: any, payload: any): WsResponse<User> {
    return { event: 'update-current-user', data: client.user };
  }

  @SubscribeMessage('logout')
  public logout(client: any, payload: any): WsResponse<undefined> {
    return { event: 'update-current-user', data: undefined };
  }

}
