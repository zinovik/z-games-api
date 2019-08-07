import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GAME_FINISHED } from 'z-games-base-game';

import { LoggerService } from '../logger/logger.service';
import { GamesServices } from '../games';
import { User, Game } from '../db/entities';
import { IGame } from '../db/interfaces';
import { FIELDS_TO_REMOVE_IN_ALL_GAMES } from '../db/scopes/Game';

@Injectable()
export class SocketService {
  constructor(private logger: LoggerService) {}

  public sendError({ client, message }: { client: Socket; message: string }): void {
    this.logger.error(message, '');
    client.emit('error-message', { message });
  }

  public updateGame({ server, game }: { server: Server; game: Game | IGame }) {
    server.emit('update-game', this.parseGameForAllUsers(game));
  }

  public isUserOnline({ server, userId }: { server: Server; userId: string }) {
    const sockets = server.sockets.connected;

    return Object.keys(sockets).some(currentSocketId => {
      const currentSocket = sockets[currentSocketId] as Socket & { user: User };
      return currentSocket.user && currentSocket.user.id === userId;
    });
  }

  public emitByUserId({
    server,
    userId,
    event,
    data,
  }: {
    server: Server;
    userId: string;
    event: string;
    data: any;
  }): void {
    const sockets = server.sockets.connected;

    const socketId = Object.keys(sockets).find(currentSocketId => {
      const currentSocket = sockets[currentSocketId] as Socket & { user: User };
      return currentSocket.user && currentSocket.user.id === userId;
    });

    if (!socketId) {
      return;
    }

    sockets[socketId].emit(event, data);
  }

  public sendGameToGameUsers({ server, game }: { server: Server; game: Game | IGame }): void {
    if (!server.sockets.adapter.rooms[game.id]) {
      return;
    }

    Object.keys(server.sockets.adapter.rooms[game.id].sockets).forEach(socketId => {
      const socketInGame = server.sockets.connected[socketId] as Socket & {
        user: User;
      };
      const userInGame = socketInGame.user;

      if (userInGame) {
        socketInGame.emit('update-opened-game', this.parseGameForUser({ game, userId: userInGame.id }));
      }
    });
  }

  private parseGameForAllUsers(game: Game | IGame): Game | IGame {
    const newGame = { ...game } as { [key: string]: any };

    FIELDS_TO_REMOVE_IN_ALL_GAMES.forEach(field => {
      if (newGame[field]) {
        delete newGame[field];
      }
    });

    return newGame as Game;
  }

  public parseGameForUser({ game, userId }: { game: Game | IGame; userId: string }): Game | IGame {
    if (game.state === GAME_FINISHED) {
      return {
        ...game,
        gameData: JSON.parse(JSON.stringify(game.gameData)),
      } as Game | IGame;
    }

    const gameData = GamesServices[game.name].parseGameDataForUser({
      gameData: game.gameData,
      userId,
    });

    return { ...game, gameData } as Game | IGame;
  }
}
