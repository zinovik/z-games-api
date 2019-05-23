import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';
import { IBaseGameData, GAME_NOT_STARTED, GAME_STARTED, GAME_FINISHED, BaseGame } from 'z-games-base-game';

import { User, Game } from '../db/entities';
import { IUser, IGame } from '../db/interfaces';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { GamesServices, gamesNames } from '../games';
import {
  JoiningGameException,
  OpeningGameException,
  WatchingGameException,
  LeavingGameException,
  ClosingGameException,
  StartingGameException,
  MakingMoveException,
  RemovingGameException,
} from '../exceptions';
import {
  OPEN_GAME_FIELDS,
  ALL_GAMES_JOIN_PLAYERS,
  ALL_GAMES_JOIN_NEXT_PLAYERS,
  OPEN_GAME_JOIN_WATCHERS,
  OPEN_GAME_JOIN_PLAYERS_ONLINE,
  OPEN_GAME_JOIN_LOGS,
  OPEN_GAME_JOIN_LOGS_USERNAMES,
  LOGS_FIELD_ORDER_BY,
  ALL_GAMES_FIELDS,
  ALL_GAMES_FIELDS_MONGO,
  ALL_GAMES_POPULATE_CREATED_BY,
  ALL_GAMES_POPULATE_PLAYERS,
  ALL_GAMES_POPULATE_NEXT_PLAYERS,
  OPEN_GAME_FIELDS_MONGO,
  OPEN_GAME_POPULATE_WATCHERS,
  OPEN_GAME_POPULATE_PLAYERS_ONLINE,
  OPEN_GAME_POPULATE_NEXT_PLAYERS,
  OPEN_GAME_POPULATE_LOGS,
  OPEN_GAME_POPULATE_LOGS_USERNAMES,
  LOGS_FIELD_ORDER_BY_MONGO,
} from '../db/scopes/Game';
import { IFilterSettings } from './IFilterSettings.interface';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

@Injectable()
export class GameService {
  gameModel: Model<IGame>;

  constructor(
    private readonly connection: Connection,
    private readonly logger: LoggerService,
    @InjectConnection() private readonly connectionMongo: ConnectionMongo,
  ) {
    this.gameModel = this.connectionMongo.model('Game');
  }

  public async findOneById(id: string): Promise<Game | IGame> {
    this.logger.info(`Find one game id ${id}`);

    if (IS_MONGO_USED) {
      return this.gameModel
        .findOne({ _id: id }, OPEN_GAME_FIELDS_MONGO)
        .populate(...ALL_GAMES_POPULATE_CREATED_BY)
        .populate(...ALL_GAMES_POPULATE_PLAYERS)
        .populate(...ALL_GAMES_POPULATE_NEXT_PLAYERS)
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
      .leftJoin(...ALL_GAMES_JOIN_NEXT_PLAYERS)
      .leftJoin(...OPEN_GAME_JOIN_WATCHERS)
      .leftJoin(...OPEN_GAME_JOIN_PLAYERS_ONLINE)
      .leftJoin(...OPEN_GAME_JOIN_LOGS)
      .leftJoin(...OPEN_GAME_JOIN_LOGS_USERNAMES)
      .where({ id })
      .orderBy({ [LOGS_FIELD_ORDER_BY]: 'DESC' })
      .getOne();
  }

  public async getAllGames(filterSettings: IFilterSettings = {} as IFilterSettings, isRemoved?: boolean, userId?: string): Promise<Game[]> {
    this.logger.info('Get all games');

    const isEmptyFilter = !filterSettings || !Object.keys(filterSettings).length;

    const { isNotStarted, isStarted, isFinished, isWithMe, isWithoutMe, isMyMove, isNotMyMove, isGames, limit, offset } = filterSettings;

    const stateFilter: number[] = [];

    if (isNotStarted || isEmptyFilter) {
      stateFilter.push(GAME_NOT_STARTED);
    }

    if (isStarted || isEmptyFilter) {
      stateFilter.push(GAME_STARTED);
    }

    if (isFinished || isEmptyFilter) {
      stateFilter.push(GAME_FINISHED);
    }

    const gameNameFilter: string[] = [];

    gamesNames.forEach(gamesName => {
      if ((isGames && isGames[gamesName]) || isEmptyFilter) {
        gameNameFilter.push(gamesName);
      }
    });

    if (IS_MONGO_USED) {
      return JSON.parse(
        JSON.stringify(
          await this.gameModel
            .find({ isRemoved: { $ne: !isRemoved } }, ALL_GAMES_FIELDS_MONGO)
            .populate(...ALL_GAMES_POPULATE_CREATED_BY)
            .populate(...ALL_GAMES_POPULATE_PLAYERS)
            .populate(...ALL_GAMES_POPULATE_NEXT_PLAYERS)
            .where('state').in(stateFilter)
            .where('name').in(gameNameFilter)
            .limit(limit)
            .skip(offset)
            .sort({ number: -1 })
            .exec(),
        ),
      );
    }

    // TODO: SQL Filter
    // TODO: SQL isRemoved field

    return await this.connection
      .getRepository(Game)
      .createQueryBuilder('game')
      .select(ALL_GAMES_FIELDS)
      .leftJoin(...ALL_GAMES_JOIN_PLAYERS)
      .leftJoin(...ALL_GAMES_JOIN_NEXT_PLAYERS)
      .orderBy({ number: 'DESC' })
      .getMany();
  }

  public async newGame({ name, isPrivate, userId }: { name: string, isPrivate: boolean, userId: string }): Promise<Game> {
    this.logger.info(`New ${name} game`);

    const { playersMax, playersMin, gameData } = GamesServices[name].getNewGame();

    const game = new Game();
    game.name = name;
    game.isPrivate = false;
    game.playersMax = playersMax;
    game.playersMin = playersMin;
    game.players = [];
    game.isPrivate = isPrivate;
    game.gameData = gameData;

    if (IS_MONGO_USED) {
      game.number = await this.getNewGameNumber();

      (game as any).createdBy = userId;

      const gameMongo = new this.gameModel(game);
      const gameMongoNew = await gameMongo.save();

      return JSON.parse(JSON.stringify(gameMongoNew));
    }

    // TODO: SQL CreatedBy field

    return await this.connection.getRepository(Game).save(game);
  }

  public async joinGame({
    user,
    gameId,
    isJoinByInvite,
    isNewGameJoin,
  }: {
    user: User | IUser;
    gameId: string;
    isJoinByInvite?: boolean,
    isNewGameJoin?: boolean,
  }): Promise<void> {
    this.logger.info(`Join game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (user.openedGame || user.openedGameWatcher) {
      throw new JoiningGameException(`You are already have other game opened. Try to refresh the page`);
    }

    if (!game) {
      throw new JoiningGameException(`There is no game number ${game.number}. Try to refresh the page`);
    }

    if (game.isPrivate && !isJoinByInvite && !isNewGameJoin && user.id !== game.createdBy.id) {
      throw new JoiningGameException('This game is private. You can only join by invite');
    }

    if (game.state) {
      throw new JoiningGameException('Can\'t join started or finished game. Try to refresh the page');
    }

    if (game.players.length >= game.playersMax) {
      throw new JoiningGameException('Can\'t join game with maximum players inside. Try to refresh the page');
    }

    if (game.players.some((player: User | IUser) => player.id === user.id)) {
      throw new JoiningGameException('Can\'t join game twice. Try to refresh the page');
    }

    if (game.playersOnline.some((playerOnline: User | IUser) => playerOnline.id === user.id)) {
      throw new JoiningGameException('Can\'t join opened game');
    }

    const gameData = GamesServices[game.name].addPlayer({
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

      return;
    }

    const newUser = new User();
    newUser.id = user.id;
    newUser.username = user.username;

    game.players.push(newUser as User & IUser);
    game.playersOnline.push(newUser as User & IUser);

    game.gameData = gameData;

    await this.connection.getRepository(Game).save(game);
  }

  public async openGame({
    user,
    gameId,
  }: {
    user: User;
    gameId: string;
  }): Promise<void> {
    this.logger.info(`Open game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (user.openedGame || user.openedGameWatcher) {
      const openedGameNumber = (user.openedGame && user.openedGame.number)
        || (user.openedGameWatcher && user.openedGameWatcher.number);
      throw new OpeningGameException(`You are already in game number ${openedGameNumber}. Try to refresh the page`);
    }

    if (!game) {
      throw new OpeningGameException(`There is no game ${gameId}`);
    }

    if (!game.players.some((player: User | IUser) => player.id === user.id)) {
      throw new OpeningGameException('Can\'t open game without joining');
    }

    if (game.playersOnline.some((playerOnline: User | IUser) => playerOnline.id === user.id)) {
      throw new OpeningGameException('Can\'t open game twice. Try to refresh the page');
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

      return;
    }

    const newUser = new User();

    newUser.id = user.id;
    newUser.username = user.username;

    game.playersOnline.push(newUser as User & IUser);

    await this.connection.getRepository(Game).save(game);
  }

  public async watchGame({
    user,
    gameId,
  }: {
    user: User;
    gameId: string;
  }): Promise<Game> {
    this.logger.info(`Watch game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (!game) {
      throw new WatchingGameException(`There is no game ${gameId}`);
    }

    if (!game.state) {
      throw new WatchingGameException('Can\'t watch not started game. Try to refresh the page');
    }

    if (game.players.some((player: User | IUser) => player.id === user.id)) {
      throw new WatchingGameException('Can\'t watch joining game. Try to refresh the page');
    }

    if (game.watchersOnline.some((watcher: User | IUser) => watcher.id === user.id)) {
      throw new WatchingGameException('Can\'t watch game twice. Try to refresh the page');
    }

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          $push: {
            watchersOnline: user.id,
          },
        },
      );

      return JSON.parse(JSON.stringify(await this.findOneById(gameId)));
    }

    const newUser = new User();

    newUser.id = user.id;
    newUser.username = user.username;

    game.watchersOnline.push(newUser as User & IUser);

    return await this.connection.getRepository(Game).save(game);
  }

  public async leaveGame({
    user,
    gameId,
  }: {
    user: User;
    gameId: string;
  }): Promise<void> {
    this.logger.info(`Leave game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (!game) {
      throw new LeavingGameException(`There is no game ${gameId}`);
    }

    if (game.state === GAME_STARTED) {
      throw new LeavingGameException('Can\'t leave started and not finished game. Try to refresh the page');
    }

    if (!game.players.some((player: User | IUser) => player.id === user.id)) {
      throw new LeavingGameException('Can\'t leave game without joining. Try to refresh the page');
    }

    const gameData = GamesServices[game.name].removePlayer({
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

      return;
    }

    game.players = (game.players as Array<User | IUser>).filter(player => player.id !== user.id) as User[] | IUser[];
    game.playersOnline = (game.players as Array<User | IUser>).filter((player: User | IUser) => player.id !== user.id) as User[] | IUser[];

    game.gameData = gameData;

    await this.connection.getRepository(Game).save(game);
  }

  public async closeGame({
    user,
    gameId,
  }: {
    user: User;
    gameId: string;
  }): Promise<void> {
    this.logger.info(`Close game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (!game) {
      throw new ClosingGameException(`There is no game ${gameId}`);
    }

    const isUserInPlayers = game.players.some((player: User | IUser) => player.id === user.id);
    const isUserInWatchers = game.watchersOnline.some(
      (player: User | IUser) => player.id === user.id,
    );

    if (!isUserInPlayers && !isUserInWatchers) {
      throw new ClosingGameException(
        'Can\'t close game without joining or watching',
      );
    }

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          $pull: {
            watchersOnline: user.id,
            playersOnline: user.id,
          },
        },
      );

      return;
    }

    if (isUserInWatchers) {
      game.watchersOnline = (game.watchersOnline as Array<User | IUser>).filter(watcher => watcher.id !== user.id) as User[] | IUser[];
    }

    if (isUserInPlayers) {
      game.playersOnline = (game.players as Array<User | IUser>).filter(player => player.id !== user.id) as User[] | IUser[];
    }

    await this.connection.getRepository(Game).save(game);
  }

  public async connectGame({
    user,
    gameId,
  }: {
    user: User | IUser;
    gameId: string;
  }): Promise<void> {
    this.logger.info(`Connect game ${gameId}`);

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: gameId },
        {
          $push: {
            playersOnline: user.id,
          },
        },
      );

      return;
    }

    const game = await this.findOneById(gameId);

    const newUser = new User();

    newUser.id = user.id;
    newUser.username = user.username;

    game.playersOnline.push(newUser as User & IUser);

    await this.connection.getRepository(Game).save(game);
  }

  public async disconnectGame({
    user,
    gameId,
  }: {
    user: User | IUser;
    gameId: string;
  }): Promise<void> {
    this.logger.info(`Disconnect game ${gameId}`);

    const game = await this.findOneById(gameId);

    const isUserInPlayers = game.players.some((player: User | IUser) => player.id === user.id);
    const isUserInWatchers = game.watchersOnline.some(
      (player: User | IUser) => player.id === user.id,
    );

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          $pull: {
            watchersOnline: user.id,
            playersOnline: user.id,
          },
        },
      );

      return;
    }

    if (isUserInWatchers) {
      game.watchersOnline = (game.watchersOnline as Array<User | IUser>).filter(watcher => watcher.id !== user.id) as User[] | IUser[];
    }

    if (isUserInPlayers) {
      game.playersOnline = (game.players as Array<User | IUser>).filter(player => player.id !== user.id) as User[] | IUser[];
    }

    await this.connection.getRepository(Game).save(game);
  }

  public async removeGame({
    userId,
    gameId,
  }: {
    userId: string;
    gameId: string;
  }): Promise<void> {
    this.logger.info(`Remove game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (!game) {
      throw new RemovingGameException(`There is no game ${gameId}`);
    }

    const isUserInPlayers = game.players.some((player: User | IUser) => player.id === userId);

    if (!isUserInPlayers) {
      throw new RemovingGameException('Can\'t remove game without joining');
    }

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: gameId },
        {
          isRemoved: true,
          playersOnline: [],
          watchersOnline: [],
        },
      );

      return;
    }

    // TODO: SQL Remove Game

    if (isUserInPlayers) {
      game.playersOnline = (game.players as Array<User | IUser>).filter(player => player.id !== userId) as User[] | IUser[];
    }
  }

  public async toggleReady({
    user,
    gameId,
  }: {
    user: User;
    gameId: string;
  }): Promise<void> {
    this.logger.info(`Toggle ready game ${gameId}`);

    const game = await this.findOneById(gameId);

    const gameData = GamesServices[game.name].toggleReady({
      gameData: game.gameData,
      userId: user.id,
    });

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        { gameData },
      );

      return;
    }

    game.gameData = gameData;

    await this.connection.getRepository(Game).save(game);
  }

  public async updateOption({
    gameId,
    name,
    value,
  }: {
    gameId: string;
    name: string,
    value: string,
  }): Promise<void> {
    this.logger.info(`Update option game ${gameId}`);

    const game = await this.findOneById(gameId);

    const gameData = GamesServices[game.name].updateOption({
      gameData: game.gameData,
      name,
      value,
    });

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: gameId },
        { gameData },
      );

      return;
    }

    game.gameData = gameData;

    await this.connection.getRepository(Game).save(game);
  }

  public async startGame({
    gameId,
  }: {
    gameId: string;
  }): Promise<string[]> {
    this.logger.info(`Start game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (game.players.length < game.playersMin) {
      throw new StartingGameException('Not enough players. Try to refresh the page');
    }

    if (game.players.length > game.playersMax) {
      throw new StartingGameException('Too many players. Try to refresh the page');
    }

    if (!GamesServices[game.name].checkReady(game.gameData)) {
      throw new StartingGameException('Not all players are ready. Try to refresh the page');
    }

    if (game.state !== GAME_NOT_STARTED) {
      throw new StartingGameException('You can\'t start started game. Try to refresh the page');
    }

    const { gameData, nextPlayersIds } = GamesServices[game.name].startGame(
      game.gameData,
    );

    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: game.id },
        {
          gameData,
          state: GAME_STARTED,
          nextPlayers: nextPlayersIds,
          previousMoveAt: new Date(),
        },
      );

      return nextPlayersIds;
    }

    game.gameData = gameData;
    game.state = GAME_STARTED;
    game.nextPlayers = [];
    game.previousMoveAt = new Date();

    nextPlayersIds.forEach(nextPlayerId => {
      const nextUser = new User();
      nextUser.id = nextPlayerId;
      game.nextPlayers.push(nextUser as User & IUser);
    });

    await this.connection.getRepository(Game).save(game);

    return nextPlayersIds;
  }

  private async checkTimeout(game: Game | IGame): Promise<boolean> {
    const { previousMoveAt } = game;

    const gameDataParsed: any = JSON.parse(game.gameData);
    const { options } = gameDataParsed;

    const maxTimeOption = options.find((option: any) => option.name === 'Max Time');
    const maxTime = (BaseGame.getMaxTimeVariants() as any)[maxTimeOption!.value];

    const now = moment(new Date());
    const end = moment(previousMoveAt).add(maxTime + 3000);

    if (now > end) {
      if (IS_MONGO_USED) {
        await this.gameModel.findOneAndUpdate(
          { _id: game.id },
          {
            isMoveTimeout: true,
          },
        );
      }

      // TODO: SQL

      return true;
    }

    return false;
  }

  public async makeMove({
    move,
    gameId,
    userId,
  }: {
    move: string;
    gameId: string;
    userId: string;
  }): Promise<{ nextPlayersIds: string[], playersIds: string[], playerWonId: string, gameNumber: number }> {
    this.logger.info(`Make move game ${gameId}`);

    const game = await this.findOneById(gameId);

    if (!game.nextPlayers.some((nextPlayer: User | IUser) => nextPlayer.id === userId)) {
      throw new MakingMoveException('It\'s not your turn to move. Try to refresh the page');
    }

    if (await this.checkTimeout(game)) {
      throw new MakingMoveException('Your move time is over!');
    }

    const { gameData, nextPlayersIds } = GamesServices[game.name].makeMove({
      gameData: game.gameData,
      move,
      userId,
    });

    if (nextPlayersIds.length) {
      // If the game is not finished

      if (IS_MONGO_USED) {
        await this.gameModel.findOneAndUpdate(
          { _id: game.id },
          {
            gameData,
            nextPlayers: nextPlayersIds,
            previousMoveAt: new Date(), // TODO: Variant with simultaneous moves (6 nimmt!)
          },
        );

        return { nextPlayersIds, playersIds: [], playerWonId: '', gameNumber: game.number };
      }

      game.gameData = gameData;

      game.nextPlayers = [];
      game.previousMoveAt = new Date();

      nextPlayersIds.forEach(nextPlayerId => {
        const nextUser = new User();
        nextUser.id = nextPlayerId;
        game.nextPlayers.push(nextUser as User & IUser);
      });

    } else {
      // Else if the game is finished

      const gameDataParsed: IBaseGameData = JSON.parse(gameData);

      if (IS_MONGO_USED) {
        await this.gameModel.findOneAndUpdate(
          { _id: game.id },
          {
            gameData,
            state: GAME_FINISHED,
            nextPlayers: nextPlayersIds,
            previousMoveAt: new Date(),
          },
        );

        const playersIds: string[] = (game.players as Array<User | IUser>).map((player: User | IUser) => player.id);
        const playerWonId = gameDataParsed.players.find(gamePlayer => gamePlayer.place === 1).id;

        return { nextPlayersIds: [], playersIds, playerWonId, gameNumber: game.number };
      }

      game.players.forEach((player: User | IUser) => {
        const user = new User();

        user.id = player.id;
        user.gamesPlayed = player.gamesPlayed + 1;

        if (gameDataParsed.players.find(gamePlayer => gamePlayer.id === player.id).place === 1) {
          user.gamesWon = player.gamesWon + 1;
        }

        this.connection.getRepository(User).save(user);
      });

      game.state = GAME_FINISHED;
      game.gameData = gameData;
      game.previousMoveAt = new Date();
    }

    await this.connection.getRepository(Game).save(game);
    return { nextPlayersIds, playersIds: [], playerWonId: '', gameNumber: game.number };
  }

  public async addLog({ gameId, logId }: { gameId: string, logId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.gameModel.findOneAndUpdate(
        { _id: gameId },
        {
          $push: {
            logs: logId,
          },
        },
      );
    }
  }

  private async getNewGameNumber(): Promise<number> {
    const allGames = await this.getAllGames({} as IFilterSettings, true);

    const allGamesSorted = allGames.sort(
      (game1, game2) => game2.number - game1.number,
    );

    if (allGamesSorted.length) {
      return allGamesSorted[0].number + 1;
    }

    return 1;
  }
}
