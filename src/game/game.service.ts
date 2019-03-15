import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';
import { BaseGame, BaseGameData, BaseGamePlayer, GAME_STARTED, GAME_FINISHED } from 'z-games-base-game';
import { NoThanks, NO_THANKS } from 'z-games-no-thanks';
import { Perudo, PERUDO } from 'z-games-perudo';
import { LostCities, LOST_CITIES } from 'z-games-lost-cities';

import { Game } from '../db/entities/game.entity';
import { User } from '../db/entities/user.entity';
import { IUser } from '../db/interfaces/user.interface';
import { IGame } from '../db/interfaces/game.interface';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import {
  JoiningGameError,
  OpeningGameError,
  WatchingGameError,
  LeavingGameError,
  ClosingGameError,
  StartingGameError,
  MakingMoveError,
} from '../errors';
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
  ALL_GAMES_FIELDS_MONGO,
  ALL_GAMES_POPULATE_PLAYERS,
  OPEN_GAME_FIELDS_MONGO,
  OPEN_GAME_POPULATE_WATCHERS,
  OPEN_GAME_POPULATE_PLAYERS_ONLINE,
  OPEN_GAME_POPULATE_NEXT_PLAYERS,
  OPEN_GAME_POPULATE_LOGS,
  OPEN_GAME_POPULATE_LOGS_USERNAMES,
  LOGS_FIELD_ORDER_BY_MONGO,
} from '../db/scopes/Game';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

const gamesServices: { [key: string]: BaseGame } = {
  [NO_THANKS]: NoThanks.Instance,
  [PERUDO]: Perudo.Instance,
  [LOST_CITIES]: LostCities.Instance,
};

@Injectable()
export class GameService {
  gameModel: Model<IGame>;
  userModel: Model<IUser>;

  constructor(
    private readonly connection: Connection,
    private readonly logger: LoggerService,
    @InjectConnection() private readonly connectionMongo: ConnectionMongo,
  ) {
    this.gameModel = this.connectionMongo.model('Game');
    this.userModel = this.connectionMongo.model('User');
  }

  public async findOne(gameNumber: number): Promise<Game> {
    this.logger.info(`Find one game number ${gameNumber}`);

    if (IS_MONGO_USED) {
      return (this.gameModel as Model<any>)
        .findOne({ number: gameNumber }, OPEN_GAME_FIELDS_MONGO)
        .populate(...ALL_GAMES_POPULATE_PLAYERS)
        .populate(...OPEN_GAME_POPULATE_WATCHERS)
        .populate(...OPEN_GAME_POPULATE_PLAYERS_ONLINE)
        .populate(...OPEN_GAME_POPULATE_NEXT_PLAYERS)
        .populate({
          path: OPEN_GAME_POPULATE_LOGS[0],
          select: OPEN_GAME_POPULATE_LOGS[1],
          populate: {
            path: OPEN_GAME_POPULATE_LOGS_USERNAMES[0],
            select: OPEN_GAME_POPULATE_LOGS_USERNAMES[1],
          },
          options: { sort: { [LOGS_FIELD_ORDER_BY_MONGO]: -1 } },
        })
        .exec();
    }

    return this.connection
      .getRepository(Game)
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

  public async getAllGames({
    ignoreNotStarted,
    ignoreStarted,
    ignoreFinished,
  }: {
    ignoreNotStarted?: boolean;
    ignoreStarted?: boolean;
    ignoreFinished?: boolean;
  }): Promise<Game[]> {
    this.logger.info('Get all games');

    if (IS_MONGO_USED) {
      return JSON.parse(
        JSON.stringify(
          await this.gameModel
            .find({}, ALL_GAMES_FIELDS_MONGO)
            .populate(...ALL_GAMES_POPULATE_PLAYERS)
            .sort({ number: -1 })
            .exec(),
        ),
      );
    }

    return await this.connection
      .getRepository(Game)
      .createQueryBuilder('game')
      .select(ALL_GAMES_FIELDS)
      .leftJoin(...ALL_GAMES_JOIN_PLAYERS)
      .orderBy({ number: 'DESC' })
      .getMany();
  }

  public async newGame(name: string): Promise<Game> {
    this.logger.info(`New ${name} game`);

    const { playersMax, playersMin, gameData } = gamesServices[
      name
    ].getNewGame();

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

      return JSON.parse(JSON.stringify(await gameMongo.save()));
    }

    return await this.connection.getRepository(Game).save(game);
  }

  public async joinGame({
    user,
    gameNumber,
  }: {
    user: User;
    gameNumber: number;
  }): Promise<Game> {
    this.logger.info(`Join game number ${gameNumber}`);

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

    const gameData = gamesServices[game.name].addPlayer({
      gameData: game.gameData,
      userId: user.id,
    });

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          gameData,
          $push: {
            players: user.id,
            playersOnline: user.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: user.id },
        {
          openedGame: game.id,
          $push: {
            currentGames: game.id,
          },
        },
      );

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

  public async openGame({
    user,
    gameNumber,
  }: {
    user: User;
    gameNumber: number;
  }): Promise<Game> {
    this.logger.info(`Open game number ${gameNumber}`);

    const game = await this.findOne(gameNumber);

    if (!game.players.some(player => player.id === user.id)) {
      throw new OpeningGameError('Can\'t open game without joining');
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      throw new OpeningGameError('Can\'t open game twice');
    }

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          $push: {
            playersOnline: user.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: user.id },
        {
          openedGame: game.id,
        },
      );

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    const newUser = new User();

    newUser.id = user.id;
    newUser.username = user.username;

    game.playersOnline.push(newUser);

    return await this.connection.getRepository(Game).save(game);
  }

  public async watchGame({
    user,
    gameNumber,
  }: {
    user: User;
    gameNumber: number;
  }): Promise<Game> {
    this.logger.info(`Watch game number ${gameNumber}`);

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
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          $push: {
            watchers: user.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: user.id },
        {
          currentWatch: game.id,
        },
      );

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    const newUser = new User();

    newUser.id = user.id;
    newUser.username = user.username;

    game.watchers.push(newUser);

    return await this.connection.getRepository(Game).save(game);
  }

  public async leaveGame({
    user,
    gameNumber,
  }: {
    user: User;
    gameNumber: number;
  }): Promise<Game> {
    this.logger.info(`Leave game number ${gameNumber}`);

    const game = await this.findOne(gameNumber);

    if (game.state === GAME_STARTED) {
      throw new LeavingGameError('Can\'t leave started and not finished game');
    }

    if (!game.players.some(player => player.id === user.id)) {
      throw new LeavingGameError('Can\'t leave game without joining');
    }

    const gameData = gamesServices[game.name].removePlayer({
      gameData: game.gameData,
      userId: user.id,
    });

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          gameData,
          $pull: {
            players: user.id,
            playersOnline: user.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: user.id },
        {
          openedGame: null,
          $pull: {
            currentGames: game.id,
          },
        },
      );

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    game.players = game.players.filter(player => player.id !== user.id);
    game.playersOnline = game.players.filter(player => player.id !== user.id);

    game.gameData = gameData;

    return await this.connection.getRepository(Game).save(game);
  }

  public async closeGame({
    user,
    gameNumber,
  }: {
    user: User;
    gameNumber: number;
  }): Promise<Game> {
    this.logger.info(`Close game number ${gameNumber}`);

    const game = await this.findOne(gameNumber);

    const isUserInPlayers = game.players.some(player => player.id === user.id);
    const isUserInWatchers = game.watchers.some(
      player => player.id === user.id,
    );

    if (!isUserInPlayers && !isUserInWatchers) {
      throw new ClosingGameError(
        'Can\'t close game without joining or watching',
      );
    }

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          $pull: {
            watchers: user.id,
            playersOnline: user.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: user.id },
        {
          openedGame: null,
          currentWatch: null,
        },
      );

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

  public async toggleReady({
    user,
    gameNumber,
  }: {
    user: User;
    gameNumber: number;
  }): Promise<Game> {
    this.logger.info(`Toggle ready game number ${gameNumber}`);

    const game = await this.findOne(gameNumber);

    const gameData = gamesServices[game.name].toggleReady({
      gameData: game.gameData,
      userId: user.id,
    });

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          gameData,
        },
      );

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    game.gameData = gameData;

    return await this.connection.getRepository(Game).save(game);
  }

  public async startGame({
    gameNumber,
  }: {
    gameNumber: number;
  }): Promise<Game> {
    this.logger.info(`Start game number ${gameNumber}`);

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

    const { gameData, nextPlayersIds } = gamesServices[game.name].startGame(
      game.gameData,
    );

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          gameData,
          state: GAME_STARTED,
          nextPlayers: nextPlayersIds,
        },
      );

      await this.userModel.updateMany(
        {},
        {
          $pull: {
            currentMove: game.id,
          },
        },
      );

      await this.userModel.updateMany(
        { _id: { $in: nextPlayersIds } },
        {
          $push: {
            currentMove: game.id,
          },
        },
      );

      return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
    }

    game.gameData = gameData;
    game.state = GAME_STARTED;
    game.nextPlayers = [];

    nextPlayersIds.forEach(nextPlayerId => {
      const nextUser = new User();
      nextUser.id = nextPlayerId;
      game.nextPlayers.push(nextUser);
    });

    return this.connection.getRepository(Game).save(game);
  }

  public async makeMove({
    move,
    gameNumber,
    userId,
  }: {
    move: string;
    gameNumber: number;
    userId: string;
  }): Promise<Game> {
    this.logger.info(`Make move game number ${gameNumber}`);

    const game = await this.findOne(gameNumber);

    if (!game.nextPlayers.some(nextPlayer => nextPlayer.id === userId)) {
      throw new MakingMoveError('It\'s not your turn to move');
    }

    const { gameData, nextPlayersIds } = gamesServices[game.name].makeMove({
      gameData: game.gameData,
      move,
      userId,
    });

    if (nextPlayersIds.length) {
      if (IS_MONGO_USED) {
        await this.gameModel.findOneAndUpdate(
          { _id: game.id },
          {
            gameData,
            nextPlayers: nextPlayersIds,
          },
        );

        await this.userModel.updateMany(
          {},
          {
            $pull: {
              currentMove: game.id,
            },
          },
        );

        await this.userModel.updateMany(
          { _id: { $in: nextPlayersIds } },
          {
            $push: {
              currentMove: game.id,
            },
          },
        );

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
      const gameDataParsed: BaseGameData = JSON.parse(game.gameData);

      if (IS_MONGO_USED) {
        const playersIds = game.players.map(player => player.id);

        await this.userModel.updateMany(
          { _id: { $in: playersIds } },
          {
            $inc: {
              gamesPlayed: 1,
            },
          },
        );

        const playerWonId = gameDataParsed.players.find(
          (playerInGame: BaseGamePlayer) =>
            playerInGame.place === 1 || playerInGame.place === 0,
        ).id;

        await this.userModel.findOneAndUpdate(
          { _id: playerWonId },
          {
            $inc: {
              gamesWon: 1,
            },
          },
        );

        await this.gameModel.findOneAndUpdate(
          { _id: game.id },
          {
            gameData,
            state: GAME_FINISHED,
            nextPlayers: nextPlayersIds,
          },
        );

        await this.userModel.updateMany(
          {},
          {
            $pull: {
              currentMove: game.id,
            },
          },
        );

        return JSON.parse(JSON.stringify(await this.findOne(gameNumber)));
      }

      game.players.forEach(player => {
        const user = new User();

        user.id = player.id;
        user.gamesPlayed = player.gamesPlayed + 1;

        if (
          gameDataParsed.players.find(
            (playerInGame: BaseGamePlayer) => playerInGame.id === player.id,
          ).place === 1
        ) {
          user.gamesWon = player.gamesWon + 1;
        }

        this.connection.getRepository(User).save(user);
      });

      game.state = GAME_FINISHED;
      game.gameData = gameData;
    }

    return this.connection.getRepository(Game).save(game);
  }

  public parseGameForAllUsers(game: Game): Game {
    const newGame = { ...game } as any;

    FIELDS_TO_REMOVE_IN_ALL_GAMES.forEach(field => {
      if (newGame[field]) {
        delete newGame[field];
      }
    });

    return newGame as Game;
  }

  public parseGameForUser({ game, user }: { game: Game; user: User }): Game {
    if (game.state === GAME_FINISHED) {
      return {
        ...game,
        gameData: JSON.parse(JSON.stringify(game.gameData)),
      } as Game;
    }

    const gameData = gamesServices[game.name].parseGameDataForUser({
      gameData: game.gameData,
      userId: user.id,
    });

    return { ...game, gameData } as Game;
  }

  private async getNewGameNumber(): Promise<number> {
    const allGames = await this.getAllGames({});

    const allGamesSorted = allGames.sort(
      (game1, game2) => game2.number - game1.number,
    );

    if (allGamesSorted.length) {
      return allGamesSorted[0].number + 1;
    }

    return 1;
  }
}
