import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';

import { GameService } from './game.service';
import { Game } from '../db/entities/game.entity';

@WebSocketGateway()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  wss;

  constructor(private gameService: GameService) { }

  handleConnection(client) {
    console.log(1);

    // const user = await this.authService.verifyAndDecodeJwt(token);

    // if (!user) {
    //   return;
    // }

    // if (!user.openedGame) {
    //   return;
    // }

    // socket.join(user.openedGame.id);

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
    console.log(9);
  }

  // @SubscribeMessage('new-game')
  // public async newGame(
  //   @SocketQueryParam('token') token: string,
  //   @SocketIO() io: any,
  //   @ConnectedSocket() socket: any,
  //   @MessageBody() name: string
  // ): Promise<void> {
  //   const user = await this.authService.verifyAndDecodeJwt(token);

  //   if (!user) {
  //     return this.userService.sendError({ socket, message: 'Error verifying token!' });
  //   }

  //   const game = await this.gameService.newGame(name);

  //   await this.logService.create({ type: 'create', user, gameId: game.id });

  //   this.gameService.sendNewGameToAllUsers({ game, io });
  // }

  @SubscribeMessage('get-all-games')
  async getAllGames(client: any, conditions: {
    ignoreNotStarted: boolean,
    ignoreStarted: boolean,
    ignoreFinished: boolean,
  }): Promise<Game[]> {
    return await this.gameService.getAllGames(conditions);
  }

}
