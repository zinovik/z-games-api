import {
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { JwtGuard } from '../guards/jwt.guard';
import { JwtService } from '../services/jwt.service';
import { UserService } from '../user/user.service';
// import { LogService } from '../log/log.service';
// import { GameService } from '../game/game.service';
import { User } from '../db/entities/user.entity';
import { Game } from '../db/entities/game.entity';

@WebSocketGateway()
export class UserGateway {

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    // private readonly logService: LogService,
    // private readonly gameService: GameService,
  ) { }

  private disconnectTimers: { [key: string]: NodeJS.Timeout } = {};
  private connectTimers: { [key: string]: NodeJS.Timeout } = {};

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token;

    if (this.connectTimers[token]) {
      return;
    }

    this.connectTimers[token] = setTimeout(async () => {
      delete this.connectTimers[token];
    }, 4000);

    const userId = this.jwtService.getUserIdByToken(token);

    const user = await this.userService.findOneByUserId(userId);

    if (user && this.disconnectTimers[user.id]) {
      clearTimeout(this.disconnectTimers[user.id]);
      delete this.disconnectTimers[user.id];
      return;
    }

    this.updateUsersOnline(user);
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake.query.token;

    const userId = this.jwtService.getUserIdByToken(token);

    const user = await this.userService.findOneByUserId(userId);

    if (!user) {
      return;
    }

    this.disconnectTimers[user.id] = setTimeout(async () => {
      this.updateUsersOnline();
      delete this.disconnectTimers[user.id];
    }, 4000);
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('get-current-user')
  public getCurrentUser(
    client: Socket & { user: User },
    payload: void,
  ): WsResponse<User> {
    return { event: 'update-current-user', data: client.user };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('get-users-online')
  public getUsersOnline(
    client: Socket & { user: User },
    payload: void,
  ): WsResponse<User[]> {
    return { event: 'update-users-online', data: this.checkUsersOnline(client.user) };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('logout')
  public async logout(client: Socket & { user: User }, payload: void): Promise<WsResponse<null>> {
    // const token = client.handshake.query.token;

    // const userId = this.jwtService.getUserIdByToken(token);

    // const user = await this.userService.findOneByUserId(userId);

    // if (user && user.openedGame) {
    //   const log = await this.logService.create({
    //     type: 'logout',
    //     user: client.user,
    //     gameId: user.openedGame.id,
    //   });
    //   user.openedGame.logs = [log, ...user.openedGame.logs];

    //   client.leave(user.openedGame.id);

    //   this.sendGameToGameUsers({ server: this.server, game: user.openedGame });
    //   this.server.emit(
    //     'update-game',
    //     this.gameService.parseGameForAllUsers(user.openedGame),
    //   );
    // }

    client.emit('new-token', null);
    return { event: 'update-current-user', data: null };
  }

  checkUsersOnline(currentUser?: User) {
    const usersOnline: User[] = [];

    if (currentUser) {
      usersOnline.push(currentUser);
    }

    Object.keys(this.server.sockets.connected).forEach((socketId: string) => {
      const socket = this.server.sockets.connected[
        socketId
      ] as Socket & { user: User };

      const user = socket.user;

      if (!user) {
        return;
      }

      if (!currentUser || user.id !== currentUser.id) {
        usersOnline.push(user);
      }
    });

    return usersOnline;
  }

  updateUsersOnline(currentUser?: User) {
    this.server.emit('update-users-online', this.checkUsersOnline(currentUser));
  }

  // TODO: Move to the game service
  // private sendGameToGameUsers({ server, game }: { server: Server, game: Game }): void {
  //   if (!server.sockets.adapter.rooms[game.id]) {
  //     return;
  //   }

  //   Object.keys(server.sockets.adapter.rooms[game.id].sockets).forEach(
  //     (socketId: string) => {
  //       const socketInGame = server.sockets.connected[
  //         socketId
  //       ] as Socket & { user: User };
  //       const userInGame = socketInGame.user;

  //       if (userInGame) {
  //         socketInGame.emit(
  //           'update-opened-game',
  //           this.gameService.parseGameForUser({ game, user: userInGame }),
  //         );
  //       }
  //     },
  //   );
  // }
}
