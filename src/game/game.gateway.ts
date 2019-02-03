import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
} from '@nestjs/websockets';

import { GameService } from './game.service';
import { UserService } from '../user/user.service';
import { LogService } from '../log/log.service';
import { JwtGuard } from './../user/guards/jwt.guard';
import { Game } from '../db/entities/game.entity';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  wss;

  constructor(
    private gameService: GameService,
    private userService: UserService,
    private logService: LogService,
  ) { }

  handleConnection(client: any) {
    // console.log(client.user);
    // const user = await this.authService.verifyAndDecodeJwt(token);

    // if (!user) {
    //   return;
    // }

    // if (!user.openedGame) {
    //   return;
    // }

    // client.join(user.openedGame.id);

    // if (this.disconnectTimers[user.id]) {
    //   clearTimeout(this.disconnectTimers[user.id]);
    //   delete this.disconnectTimers[user.id];
    //   return;
    // }

    // const game = await this.gameService.findOne(user.openedGame.number);

    // const log = await this.logService.create({ type: 'connect', user, gameId: game.id });
    // game.logs = [log, ...game.logs];

    // await this.gameService.sendGameToGameUsers({ game, io });
    // await this.gameService.sendGameUpdateToAllUsers({ game, io });
  }

  handleDisconnect(client) {
    //
  }

  @SubscribeMessage('get-all-games')
  async getAllGames(client: any, conditions: {
    ignoreNotStarted: boolean,
    ignoreStarted: boolean,
    ignoreFinished: boolean,
  }): Promise<WsResponse<Game[]>> {
    return { event: 'all-games', data: await this.gameService.getAllGames(conditions) };
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('new-game')
  public async newGame(client: any, name: string): Promise<void> {
    const game = await this.gameService.newGame(name);

    await this.logService.create({ type: 'create', user: client.user, gameId: game.id });

    this.wss.emit('new-game', this.gameService.parseGameForAllUsers(game));
  }

  @UseGuards(JwtGuard)
  @SubscribeMessage('join-game')
  public async joinGame(client: any, gameNumber: number): Promise<void> {
    let game: Game;
    try {
      game = await this.gameService.joinGame({ user: client.user, gameNumber });
    } catch (error) {
      // return this.userService.sendError({ socket, message: error.message });
    }

    const log = await this.logService.create({ type: 'join', user: client.user, gameId: game.id });
    game.logs = [log, ...game.logs];

    client.join(game.id);

    // await this.gameService.sendGameToGameUsers({ game, io });
    // await this.gameService.sendGameUpdateToAllUsers({ game, io });
  }

}
