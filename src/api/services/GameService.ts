import { Container, Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { Logger, LoggerInterface } from '../../decorators/Logger';
import { WrongGameName } from '../errors';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { GameRepository } from '../repositories/GameRepository';
import { NoThanks, Perudo } from '../services/games';

const ALL_GAMES_SELECT: Array<keyof Game> = [
  'number',
  'name',
  'state',
  'playersMax',
  'playersMin',
  'createdAt',
];

const GAME_RELATIONS = [
  'players',
  'watchers',
  'playersOnline',
  'logs',
  'nextPlayers',
];

@Service()
export class GameService {

  private noThanks: NoThanks;
  private perudo: Perudo;

  constructor(
    @OrmRepository() private gameRepository: GameRepository,
    @Logger(__filename) private log: LoggerInterface
  ) {
    this.noThanks = Container.get(NoThanks);
    this.perudo = Container.get(Perudo);
  }

  public find(): Promise<Game[]> {
    this.log.info('Find all games');
    return this.gameRepository.find();
  }

  public findOne(number: number): Promise<Game | undefined> {
    this.log.info('Find one game');
    return this.gameRepository.findOne({ number }, { relations: GAME_RELATIONS });
  }

  public async create(game: Game): Promise<Game> {
    this.log.info('Create a new game => ', game.toString());
    game.id = uuid.v1();
    const newGame = await this.gameRepository.save(game);
    return newGame;
  }

  public update(id: string, game: Game): Promise<Game> {
    this.log.info('Update a game');
    game.id = id;
    return this.gameRepository.save(game);
  }

  public async delete(id: string): Promise<void> {
    this.log.info('Delete a game');
    await this.gameRepository.delete(id);
    return;
  }

  public async getAllGames(): Promise<Game[]> {

    console.log(
      await this.gameRepository.createQueryBuilder()
        .select(['players_max'])
        .getMany()
    );

    return this.gameRepository.find({
      select: ALL_GAMES_SELECT,
      relations: ['players'],
      where: { isPrivate: false },
      order: { number: 'DESC' } as {},
    });
  }

  public async newGame(name: string): Promise<Game> {
    this.log.info(`New ${name} game`);

    const currentGameService = this.getGameServiceByName(name);
    const { playersMax, playersMin, gameData } = currentGameService.getNewGame();

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
      this.log.warn('Can\'t join started or finished game');
      throw new Error();
    }

    if (game.players.length >= game.playersMax) {
      this.log.warn('Can\'t join game with maximum players inside');
      throw new Error();
    }

    if (game.players.some(player => player.id === user.id)) {
      this.log.warn('Can\'t join game twice');
      throw new Error();
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      this.log.warn('Can\'t join opened game');
      throw new Error();
    }

    game.players.push(user);
    game.playersOnline.push(user);

    const currentGameService = this.getGameServiceByName(game.name);
    game.gameData = currentGameService.addPlayer({ gameData: game.gameData, userId: user.id });

    return this.gameRepository.save(game);
  }

  public async openGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (!game.players.some(player => player.id === user.id)) {
      this.log.warn('Can\'t open game without joining');
      throw new Error();
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      this.log.warn('Can\'t open game twice');
      throw new Error();
    }

    game.playersOnline.push(user);

    return this.gameRepository.save(game);
  }

  public async watchGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (!game.state) {
      this.log.warn('Can\'t watch not started game');
      throw new Error();
    }

    if (game.players.some(player => player.id === user.id)) {
      this.log.warn('Can\'t watch joining game');
      throw new Error();
    }

    if (!game.watchers.some(watcher => watcher.id === user.id)) {
      this.log.warn('Can\'t watch game twice');
      throw new Error(); // TODO
    }

    game.watchers.push(user);

    return this.gameRepository.save(game);
  }

  public async leaveGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    if (game.state === 1) {
      this.log.warn('Can\'t leave started and not finished game');
      throw new Error();
    }

    if (!game.players.some(player => player.id === user.id)) {
      this.log.warn('Can\'t leave game without joining');
      throw new Error();
    }

    game.players = game.players.filter(player => player.id !== user.id);
    game.playersOnline = game.players.filter(player => player.id !== user.id);

    const currentGameService = this.getGameServiceByName(game.name);
    game.gameData = currentGameService.removePlayer({ gameData: game.gameData, userId: user.id });

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

  public async readyToGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    const currentGameService = this.getGameServiceByName(game.name);
    game.gameData = currentGameService.toggleReady({ gameData: game.gameData, userId: user.id });

    return this.gameRepository.save(game);
  }

  public async startGame({ gameNumber }: { gameNumber: number }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    const currentGameService = this.getGameServiceByName(game.name);

    const { gameData, nextPlayersIds } = currentGameService.startGame(game.gameData);
    game.gameData = gameData;
    game.state = 1;
    const nextUser = new User();
    nextUser.id = nextPlayersIds[0]; // TODO: Many next players
    game.nextPlayers = [nextUser];

    return this.gameRepository.save(game);
  }

  public async makeMove({ move, gameNumber, userId }: { move: string, gameNumber: number, userId: string }): Promise<Game> {
    const game = await this.findOne(gameNumber);

    const currentGameService = this.getGameServiceByName(game.name);

    const { gameData, nextPlayersIds } = currentGameService.makeMove({ gameData: game.gameData, move, userId });
    game.gameData = gameData;

    if (nextPlayersIds.length) {
      const nextUser = new User();
      nextUser.id = nextPlayersIds[0]; // TODO: Many next players
      game.nextPlayers = [nextUser];
    } else {
      game.state = 2;
    }

    return this.gameRepository.save(game);
  }

  public parseGameForUser({ game, user }: { game: Game, user: User }): Game {
    const currentGameService = this.getGameServiceByName(game.name);

    const gameData = currentGameService.parseGameDataForUser({ gameData: game.gameData, userId: user.id });

    return { ...game, gameData } as Game;
  }

  private getGameServiceByName(name: string): {
    getNewGame: () => { playersMax: number, playersMin: number, gameData: string },
    addPlayer: ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }) => string,
    toggleReady: ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }) => string,
    removePlayer: ({ gameData: gameDataJSON, userId }: { gameData: string, userId: string }) => string,
    startGame: (gameData: string) => { gameData: string, nextPlayersIds: string[] },
    parseGameDataForUser: ({ gameData, userId }: { gameData: string, userId: string }) => string,
    makeMove: ({ gameData, move, userId }: { gameData: string, move: string, userId: string }) => { gameData: string, nextPlayersIds: string[] },
  } {
    switch (name) {
      case 'No, Thanks!':
        return this.noThanks;
      case 'Perudo': {
        return this.perudo;
      }
      default:
        throw new WrongGameName();
    }
  }

}
