import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { InviteService } from './invite.service';
import { SocketService } from '../services/socket.service';
import { JwtGuard } from '../guards/jwt.guard';
import { User, Invite } from '../db/entities';
import { IInvite } from '../db/interfaces';

@WebSocketGateway()
export class InviteGateway {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly inviteService: InviteService,
    private readonly socketService: SocketService,
  ) { }

  @UseGuards(JwtGuard)
  @SubscribeMessage('invite')
  public async invite(
    client: Socket & { user: User },
    {
      gameId,
      userId,
    }: {
      gameId: string;
      userId: string;
    },
  ): Promise<void> {
    if (
      (!client.user.currentGames || !client.user.currentGames.some(game => game.id === gameId)) &&
      (!client.user.openedGameWatcher || client.user.openedGameWatcher.id !== gameId)
    ) {
      return this.socketService.sendError({
        client,
        message: 'You can\'t invite a user if you are not this game player',
      });
    }

    let invite: Invite | IInvite;

    try {
      invite = await this.inviteService.create({
        gameId,
        createdBy: client.user,
        invitee: userId,
      });
    } catch (error) {
      return this.socketService.sendError({ client, message: error.response.message });
    }

    // TODO: Send to one user
    this.server.to(gameId).emit('new-invite', invite);
  }

}
