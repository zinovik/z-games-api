import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

import { GameService } from './game.service';
import { Game } from '../db/entities/game.entity';

@WebSocketGateway()
export class GameGateway {

  constructor(private gameService: GameService) { }

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
  }): Promise<any> {
    return await this.gameService.getAllGames(conditions);
  }

}
