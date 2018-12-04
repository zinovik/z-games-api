import { Container, Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { AuthService } from '../../auth/AuthService';
import * as types from '../../constants';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import {
  JoiningGameError, OpeningGameError, StartingGameError, WatchingGameError
} from '../errors';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { GameRepository } from '../repositories/GameRepository';
import {
  ALL_GAMES_FIELDS, ALL_GAMES_JOIN_PLAYERS, FIELDS_TO_REMOVE_IN_ALL_GAMES, LOGS_FIELD_ORDER_BY,
  OPEN_GAME_FIELDS, OPEN_GAME_JOIN_LOGS, OPEN_GAME_JOIN_LOGS_USERNAMES, OPEN_GAME_JOIN_NEXT_PLAYERS,
  OPEN_GAME_JOIN_PLAYERS_ONLINE, OPEN_GAME_JOIN_WATCHERS
} from '../scopes';
import { NoThanks, Perudo } from '../services/games';
import { BaseGame } from './games/base-game';

const gamesServices: { [key: string]: BaseGame } = {
  [types.NO_THANKS]: Container.get(NoThanks),
  [types.PERUDO]: Container.get(Perudo),
};

@Service()
export class GameService {

  private authService: AuthService;

  constructor(
    @OrmRepository() private gameRepository: GameRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {
    this.authService = Container.get(AuthService);
  }

  public findOne(number: number): Promise<Game | undefined> {
    this.log.info('Find one game');

    return this.gameRepository.createQueryBuilder('game')
      .select(OPEN_GAME_FIELDS)
      .leftJoin(...ALL_GAMES_JOIN_PLAYERS)
      .leftJoin(...OPEN_GAME_JOIN_WATCHERS)
      .leftJoin(...OPEN_GAME_JOIN_PLAYERS_ONLINE)
      .leftJoin(...OPEN_GAME_JOIN_NEXT_PLAYERS)
      .leftJoin(...OPEN_GAME_JOIN_LOGS)
      .leftJoin(...OPEN_GAME_JOIN_LOGS_USERNAMES)
      .where({ number })
      .orderBy({ [LOGS_FIELD_ORDER_BY]: 'DESC' })
      .getOne();
  }

  public async create(game: Game): Promise<Game> {
    this.log.info('Create a new game => ', game.toString());
    game.id = uuid.v1();
    const newGame = await this.gameRepository.save(game);
    return newGame;
  }

  public async getAllGames(): Promise<Game[]> {
    return this.gameRepository.createQueryBuilder('game')
      .select(ALL_GAMES_FIELDS)
      .leftJoin(...ALL_GAMES_JOIN_PLAYERS)
      .orderBy({ number: 'DESC' })
      .getMany();
  }

  public async newGame(name: string): Promise<Game> {
    this.log.info(`New ${name} game`);

    const { playersMax, playersMin, gameData } = gamesServices[name].getNewGame();

    const game = new Game();
    game.name = name;
    game.isPrivate = false;
    game.playersMax = playersMax;
    game.playersMin = playersMin;
    game.players = [];
    game.gameData = gameData;

    return await this.create(game);
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

    return this.gameRepository.save(game);
  }

  public async openGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (!game.players.some(player => player.id === user.id)) {
      throw new OpeningGameError('Can\'t open game without joining');
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      throw new OpeningGameError('Can\'t open game twice');
    }

    game.playersOnline.push(user);

    return this.gameRepository.save(game);
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

    game.watchers.push(user);

    return this.gameRepository.save(game);
  }

  public async leaveGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (game.state === types.GAME_STARTED) {
      this.log.warn('Can\'t leave started and not finished game');
      throw new Error();
    }

    if (!game.players.some(player => player.id === user.id)) {
      this.log.warn('Can\'t leave game without joining');
      throw new Error();
    }

    game.players = game.players.filter(player => player.id !== user.id);
    game.playersOnline = game.players.filter(player => player.id !== user.id);

    game.gameData = gamesServices[game.name].removePlayer({ gameData: game.gameData, userId: user.id });

    return this.gameRepository.save(game);
  }

  public async closeGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    const isUserInPlayers = game.players.some(player => player.id === user.id);
    const isUserInWatchers = game.watchers.some(player => player.id === user.id);

    if (!isUserInPlayers && !isUserInWatchers) {
      this.log.warn('Can\'t close game without joining or watching');
      throw new Error();
    }

    if (isUserInWatchers) {
      game.watchers = game.watchers.filter(watcher => watcher.id !== user.id);
    }

    if (isUserInPlayers) {
      game.playersOnline = game.players.filter(player => player.id !== user.id);
    }

    return this.gameRepository.save(game);
  }

  public async toggleReady({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    game.gameData = gamesServices[game.name].toggleReady({ gameData: game.gameData, userId: user.id });

    return this.gameRepository.save(game);
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
    game.gameData = gameData;
    game.state = types.GAME_STARTED;

    game.nextPlayers = [];
    nextPlayersIds.forEach(nextPlayerId => {
      const nextUser = new User();
      nextUser.id = nextPlayerId;
      game.nextPlayers.push(nextUser);
    });

    return this.gameRepository.save(game);
  }

  public async makeMove({ move, gameNumber, userId }: { move: string, gameNumber: number, userId: string }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    // TODO: Check current move user
    const { gameData, nextPlayersIds } = gamesServices[game.name].makeMove({ gameData: game.gameData, move, userId });
    game.gameData = gameData;

    if (nextPlayersIds.length) {

      game.nextPlayers = [];
      nextPlayersIds.forEach(nextPlayerId => {
        const nextUser = new User();
        nextUser.id = nextPlayerId;
        game.nextPlayers.push(nextUser);
      });

    } else {
      game.state = types.GAME_FINISHED;
    }

    return this.gameRepository.save(game);
  }

  public async sendGameToGameUsers({ game, io }: { game: Game, io: any }): Promise<void> {
    if (!io.sockets.adapter.rooms[game.id]) {
      return;
    }

    Object.keys(io.sockets.adapter.rooms[game.id].sockets).forEach(async socketId => {
      const socketInGame = io.sockets.connected[socketId];
      const userInGame = await this.authService.verifyAndDecodeJwt(socketInGame.handshake.query.token);

      socketInGame.emit('update-opened-game', this.parseGameForUser({ game, user: userInGame }));
    });
  }

  public async sendNewGameToAllUsers({ game, io }: { game: Game, io: any }): Promise<void> {
    io.emit('new-game', this.parseGameForAllUsers(game));
  }

  public async sendGameUpdateToAllUsers({ game, io }: { game: Game, io: any }): Promise<void> {
    io.emit('update-game', this.parseGameForAllUsers(game));
  }

  public parseGameForUser({ game, user }: { game: Game, user: User }): Game {
    if (game.state === types.GAME_FINISHED) {
      return { ...game, gameData: JSON.parse(JSON.stringify(game.gameData)) } as Game;
    }

    const gameData = gamesServices[game.name].parseGameDataForUser({ gameData: game.gameData, userId: user.id });

    return { ...game, gameData } as Game;
  }

  private parseGameForAllUsers(game: Game): Game {
    const newGame = { ...game } as Game;

    FIELDS_TO_REMOVE_IN_ALL_GAMES.forEach(field => {
      if (newGame[field]) {
        delete newGame[field];
      }
    });

    return newGame;
  }

}
