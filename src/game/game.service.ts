import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { BaseGame } from 'z-games-base-game';
import { NoThanks } from 'z-games-no-thanks';
import { Perudo } from 'z-games-perudo';

import { Game } from '../db/entities/game.entity';
import { User } from '../db/entities/user.entity';
import { LoggerService } from '../logger/logger.service';
import { JoiningGameError } from '../errors/joining-game';
import {
  OPEN_GAME_FIELDS,
  ALL_GAMES_JOIN_PLAYERS,
  OPEN_GAME_JOIN_WATCHERS,
  OPEN_GAME_JOIN_PLAYERS_ONLINE,
  OPEN_GAME_JOIN_NEXT_PLAYERS,
  OPEN_GAME_JOIN_LOGS,
  OPEN_GAME_JOIN_LOGS_USERNAMES,
  LOGS_FIELD_ORDER_BY,
  FIELDS_TO_REMOVE_IN_ALL_GAMES,
  ALL_GAMES_FIELDS,
} from '../db/scopes/Game';

import * as types from '../constants';

const gamesServices: { [key: string]: BaseGame } = {
  [types.NO_THANKS]: NoThanks.Instance,
  [types.PERUDO]: Perudo.Instance,
};

@Injectable()
export class GameService {

  constructor(private connection: Connection, private logger: LoggerService) { }

  public findOne(gameNumber: number): Promise<Game | undefined> {
    this.logger.info('Find one game');

    return this.connection.getRepository(Game)
      .createQueryBuilder('game')
      .select(OPEN_GAME_FIELDS)
      .leftJoin(...ALL_GAMES_JOIN_PLAYERS)
      .leftJoin(...OPEN_GAME_JOIN_WATCHERS)
      .leftJoin(...OPEN_GAME_JOIN_PLAYERS_ONLINE)
      .leftJoin(...OPEN_GAME_JOIN_NEXT_PLAYERS)
      .leftJoin(...OPEN_GAME_JOIN_LOGS)
      .leftJoin(...OPEN_GAME_JOIN_LOGS_USERNAMES)
      .where({ number: gameNumber })
      .orderBy({ [LOGS_FIELD_ORDER_BY]: 'DESC' })
      .getOne();
  }

  getAllGames({ ignoreNotStarted, ignoreStarted, ignoreFinished }: {
    ignoreNotStarted: boolean,
    ignoreStarted: boolean,
    ignoreFinished: boolean,
  }): Promise<Game[]> {
    this.logger.info('get all games');

    return this.connection.getRepository(Game)
      .createQueryBuilder('game')
      .select(ALL_GAMES_FIELDS)
      .leftJoin(...ALL_GAMES_JOIN_PLAYERS)
      .orderBy({ number: 'DESC' })
      .getMany();
  }

  public async newGame(name: string): Promise<Game> {
    this.logger.info(`New ${name} game`);

    const { playersMax, playersMin, gameData } = gamesServices[name].getNewGame();

    const game = new Game();
    game.name = name;
    game.isPrivate = false;
    game.playersMax = playersMax;
    game.playersMin = playersMin;
    game.players = [];
    game.gameData = gameData;

    const newGame = await this.connection.getRepository(Game).save(game);
    return newGame;
  }

  public async joinGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (game.state) {
      throw new JoiningGameError('Can\'t join started or finished game');
    }

    if (game.players.length >= game.playersMax) {
      throw new JoiningGameError('Can\'t join game with maximum players inside');
    }

    if (game.players.some(player => player.id === user.id)) {
      throw new JoiningGameError('Can\'t join game twice');
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      throw new JoiningGameError('Can\'t join opened game');
    }

    const newUser = new User();
    newUser.id = user.id;
    newUser.username = user.username;

    game.players.push(newUser);
    game.playersOnline.push(newUser);

    game.gameData = gamesServices[game.name].addPlayer({ gameData: game.gameData, userId: user.id });

    return this.connection.getRepository(Game).save(game);
  }

  public parseGameForAllUsers(game: Game): Game {
    const newGame = { ...game } as Game;

    FIELDS_TO_REMOVE_IN_ALL_GAMES.forEach(field => {
      if (newGame[field]) {
        delete newGame[field];
      }
    });

    return newGame;
  }

}
