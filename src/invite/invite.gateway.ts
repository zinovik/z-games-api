import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { InviteService } from './invite.service';
import { SocketService } from '../services/socket.service';
import { UserService } from '../user/user.service';
import { EmailService } from '../services/email.service';
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
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) { }

  @UseGuards(JwtGuard)
  @SubscribeMessage('new-invite')
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
        createdBy: client.user.id,
        invitee: userId,
      });
    } catch ({ response: { message } }) {
      return this.socketService.sendError({ client, message });
    }

    client.emit('new-invite', invite);

    if (this.socketService.isUserOnline({ server: this.server, userId })) {
      this.socketService.emitByUserId({
        server: this.server,
        userId,
        event: 'new-invite',
        data: invite,
      });
    } else {
      const { email } = await this.userService.findOneById(userId);
      await this.emailService.sendInviteMail({ gameNumber: invite.game.number, email });
    }

  }

}
