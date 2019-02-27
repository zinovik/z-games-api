import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseGame } from 'z-games-base-game';
import { NoThanks } from 'z-games-no-thanks';
import { Perudo } from 'z-games-perudo';

import { Game } from '../db/entities/game.entity';
import { User } from '../db/entities/user.entity';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { JoiningGameError } from '../errors/joining-game';
import { OpeningGameError } from '../errors/opening-game';
import { WatchingGameError } from '../errors/watching-game';
import { LeavingGameError } from '../errors/leaving-game';
import { ClosingGameError } from '../errors/closing-game';
import { StartingGameError } from '../errors/starting-game';
import { MakingMoveError } from '../errors/making-move';
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

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

const gamesServices: { [key: string]: BaseGame } = {
  [types.NO_THANKS]: NoThanks.Instance,
  [types.PERUDO]: Perudo.Instance,
};

@Injectable()
export class GameService {

  constructor(
    private readonly connection: Connection,
    private readonly logger: LoggerService,
    @InjectModel('Game') private readonly gameModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>,
  ) { }

  public async findOne(gameNumber: number): Promise<Game | undefined> {
    this.logger.info(`Find one game number ${gameNumber}`);

    if (IS_MONGO_USED) {
      return this.gameModel.findOne({ number: gameNumber })
        .populate('players')
        .populate('watchers')
        .populate('playersOnline')
        .populate('nextPlayers')
        .populate({
          path: 'logs',
          options: { sort: { createdAt: -1 } },
          populate: { path: 'user' },
        })
        .exec();
    }

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

  public async getAllGames({ ignoreNotStarted, ignoreStarted, ignoreFinished }: {
    ignoreNotStarted: boolean,
    ignoreStarted: boolean,
    ignoreFinished: boolean,
  }): Promise<Game[]> {
    this.logger.info('Get all games');

    if (IS_MONGO_USED) {
      return JSON.parse(JSON.stringify(
        await this.gameModel.find()
          .populate('players')
          .populate('watchers')
          .populate('playersOnline')
          .populate('nextPlayers')
          .populate({
            path: 'logs',
            populate: { path: 'user' },
          })
          .sort({ number: -1 })
          .exec(),
      ));
    }

    return await this.connection.getRepository(Game)
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

    if (IS_MONGO_USED) {
      game.number = await this.getNewGameNumber();

      const gameMongo = new this.gameModel(game);

      try {
        return JSON.parse(JSON.stringify(await gameMongo.save()));
      } catch (error) {
        // TODO
      }
    }

    try {
      return await this.connection.getRepository(Game).save(game);
    } catch (error) {
      // TODO
    }
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

    const gameData = gamesServices[game.name].addPlayer({ gameData: game.gameData, userId: user.id });

    if (IS_MONGO_USED) {
      try {

        await this.gameModel.findOneAndUpdate({ _id: game.id }, {
          gameData,
          $push: {
            players: user.id,
            playersOnline: user.id,
          },
        });

        await this.userModel.findOneAndUpdate({ _id: user.id }, {
          openedGame: game.id,
          $push: {
            currentGames: game.id,
          },
        });

      } catch (error) {
        console.log(error.message);
        // TODO
      }

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    const newUser = new User();
    newUser.id = user.id;
    newUser.username = user.username;

    game.players.push(newUser);
    game.playersOnline.push(newUser);

    game.gameData = gameData;

    return await this.connection.getRepository(Game).save(game);
  }

  public async openGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (!game.players.some(player => player.id === user.id)) {
      throw new OpeningGameError('Can\'t open game without joining');
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      throw new OpeningGameError('Can\'t open game twice');
    }

    if (IS_MONGO_USED) {
      try {

        await this.gameModel.findOneAndUpdate({ _id: game.id }, {
          $push: {
            playersOnline: user.id,
          },
        });

        await this.userModel.findOneAndUpdate({ _id: user.id }, {
          openedGame: game.id,
        });

      } catch (error) {
        console.log(error.message);
        // TODO
      }

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    const newUser = new User();

    newUser.id = user.id;
    newUser.username = user.username;

    game.playersOnline.push(newUser);

    return await this.connection.getRepository(Game).save(game);
  }

  public async watchGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (!game.state) {
      throw new WatchingGameError('Can\'t watch not started game');
    }

    if (game.players.some(player => player.id === user.id)) {
      throw new WatchingGameError('Can\'t watch joining game');
    }

    if (game.watchers.some(watcher => watcher.id === user.id)) {
      throw new WatchingGameError('Can\'t watch game twice');
    }

    if (IS_MONGO_USED) {
      try {

        await this.gameModel.findOneAndUpdate({ _id: game.id }, {
          $push: {
            watchers: user.id,
          },
        });

        await this.userModel.findOneAndUpdate({ _id: user.id }, {
          currentWatch: game.id,
        });

      } catch (error) {
        console.log(error.message);
        // TODO
      }

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    const newUser = new User();

    newUser.id = user.id;
    newUser.username = user.username;

    game.watchers.push(newUser);

    return await this.connection.getRepository(Game).save(game);
  }

  public async leaveGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (game.state === types.GAME_STARTED) {
      throw new LeavingGameError('Can\'t leave started and not finished game');
    }

    if (!game.players.some(player => player.id === user.id)) {
      throw new LeavingGameError('Can\'t leave game without joining');
    }

    const gameData = gamesServices[game.name].removePlayer({ gameData: game.gameData, userId: user.id });

    if (IS_MONGO_USED) {
      try {

        await this.gameModel.findOneAndUpdate({ _id: game.id }, {
          gameData,
          $pull: {
            players: user.id,
            playersOnline: user.id,
          },
        });

        await this.userModel.findOneAndUpdate({ _id: user.id }, {
          openedGame: undefined,
          $pull: {
            currentGames: game.id,
          },
        });

      } catch (error) {
        console.log(error.message);
        // TODO
      }

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    game.players = game.players.filter(player => player.id !== user.id);
    game.playersOnline = game.players.filter(player => player.id !== user.id);

    game.gameData = gameData;

    return await this.connection.getRepository(Game).save(game);
  }

  public async closeGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    const isUserInPlayers = game.players.some(player => player.id === user.id);
    const isUserInWatchers = game.watchers.some(player => player.id === user.id);

    if (!isUserInPlayers && !isUserInWatchers) {
      throw new ClosingGameError('Can\'t close game without joining or watching');
    }

    if (IS_MONGO_USED) {
      try {

        await this.gameModel.findOneAndUpdate({ _id: game.id }, {
          $pull: {
            watchers: user.id,
            playersOnline: user.id,
          },
        });

        await this.userModel.findOneAndUpdate({ _id: user.id }, {
          openedGame: undefined,
          currentWatch: undefined,
        });

      } catch (error) {
        console.log(error.message);
        // TODO
      }

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    if (isUserInWatchers) {
      game.watchers = game.watchers.filter(watcher => watcher.id !== user.id);
    }

    if (isUserInPlayers) {
      game.playersOnline = game.players.filter(player => player.id !== user.id);
    }

    return await this.connection.getRepository(Game).save(game);
  }

  public async toggleReady({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    const gameData = gamesServices[game.name].toggleReady({ gameData: game.gameData, userId: user.id });

    if (IS_MONGO_USED) {
      try {

        await this.gameModel.findOneAndUpdate({ _id: game.id }, {
          gameData,
        });

      } catch (error) {
        console.log(error.message);
        // TODO
      }

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    game.gameData = gameData;

    return await this.connection.getRepository(Game).save(game);
  }

  public async startGame({ gameNumber }: { gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (game.players.length < game.playersMin) {
      throw new StartingGameError('Not enough players');
    }

    if (game.players.length > game.playersMax) {
      throw new StartingGameError('Too many players');
    }

    if (!gamesServices[game.name].checkReady(game.gameData)) {
      throw new StartingGameError('Not all players are ready');
    }

    const { gameData, nextPlayersIds } = gamesServices[game.name].startGame(game.gameData);

    if (IS_MONGO_USED) {
      try {

        await this.gameModel.findOneAndUpdate({ _id: game.id }, {
          gameData,
          state: types.GAME_STARTED,
          nextPlayers: nextPlayersIds,
        });

        // TODO Update users

      } catch (error) {
        console.log(error.message);
        // TODO
      }

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    game.gameData = gameData;
    game.state = types.GAME_STARTED;
    game.nextPlayers = [];

    nextPlayersIds.forEach(nextPlayerId => {
      const nextUser = new User();
      nextUser.id = nextPlayerId;
      game.nextPlayers.push(nextUser);
    });

    return this.connection.getRepository(Game).save(game);
  }

  public async makeMove({ move, gameNumber, userId }: { move: string, gameNumber: number, userId: string }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (!game.nextPlayers.some(nextPlayer => nextPlayer.id === userId)) {
      throw new MakingMoveError('It\'s not your turn to move');
    }

    const { gameData, nextPlayersIds } = gamesServices[game.name].makeMove({ gameData: game.gameData, move, userId });

    if (nextPlayersIds.length) {

      if (IS_MONGO_USED) {
        try {

          await this.gameModel.findOneAndUpdate({ _id: game.id }, {
            gameData,
            nextPlayers: nextPlayersIds,
          });

          // TODO Update users

        } catch (error) {
          console.log(error.message);
          // TODO
        }

        return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
      }

      game.gameData = gameData;

      game.nextPlayers = [];
      nextPlayersIds.forEach(nextPlayerId => {
        const nextUser = new User();
        nextUser.id = nextPlayerId;
        game.nextPlayers.push(nextUser);
      });

    } else {

      if (IS_MONGO_USED) {
        try {

          await this.gameModel.findOneAndUpdate({ _id: game.id }, {
            gameData,
            state: types.GAME_FINISHED,
            nextPlayers: nextPlayersIds,
          });

          // TODO Update users

        } catch (error) {
          console.log(error.message);
          // TODO
        }

        return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
      }

      game.state = types.GAME_FINISHED;

      game.gameData = gameData;
      const gameDataParsed = JSON.parse(game.gameData);

      game.players.forEach(player => {
        const user = new User();

        user.id = player.id;
        user.gamesPlayed = player.gamesPlayed + 1;

        if (gameDataParsed.players.find(playerInGame => playerInGame.id === player.id)!.place === 1) {
          user.gamesWon = player.gamesWon + 1;
        }

        this.connection.getRepository(Game).save(user);
      });

    }

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

  public parseGameForUser({ game, user }: { game: Game, user: User }): Game {
    if (game.state === types.GAME_FINISHED) {
      return { ...game, gameData: JSON.parse(JSON.stringify(game.gameData)) } as Game;
    }

    const gameData = gamesServices[game.name].parseGameDataForUser({ gameData: game.gameData, userId: user.id });

    return { ...game, gameData } as Game;
  }

  private async getNewGameNumber(): Promise<number> {
    const allGames = (await this.getAllGames({
      ignoreNotStarted: false,
      ignoreStarted: false,
      ignoreFinished: false,
    })).sort((game1, game2) => game2.number - game1.number);

    if (allGames.length) {
      return allGames[0].number + 1;
    }

    return 0;
  }

}
