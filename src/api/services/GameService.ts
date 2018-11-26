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

  public findOne(id: string): Promise<Game | undefined> {
    this.log.info('Find one game');
    return this.gameRepository.findOne({ id });
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
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'playersOnline', 'logs'] });

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

    const gameData = JSON.parse(game.gameData);
    gameData.players[user.id] = { ready: false };
    game.gameData = JSON.stringify(gameData);

    return this.gameRepository.save(game);
  }

  public async openGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'playersOnline', 'logs'] });

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
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'watchers', 'logs'] });

    if (!game.state) {
      this.log.warn('Can\'t watch not started game');
      throw new Error();
    }

    if (game.players.some(player => player.id === user.id)) {
      this.log.warn('Can\'t watch joining game');
      throw new Error();
    }

    if (!game.watchers.some(watcher => watcher.id === user.id)) {
      this.log.warn('Can\'t watch gae twice');
      throw new Error(); // TODO
    }

    game.watchers.push(user);

    return this.gameRepository.save(game);
  }

  public async leaveGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'playersOnline', 'logs'] });

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

    const gameData = JSON.parse(game.gameData);
    delete gameData.players[user.id];
    game.gameData = JSON.stringify(gameData);

    return this.gameRepository.save(game);
  }

  public async closeGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'watchers', 'playersOnline', 'logs'] });

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
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'watchers', 'playersOnline', 'logs'] });

    const gameData = JSON.parse(game.gameData);
    gameData.players[user.id].ready = !gameData.players[user.id].ready;
    game.gameData = JSON.stringify(gameData);

    return this.gameRepository.save(game);
  }

  public async startGame({ gameNumber }: { gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'watchers', 'playersOnline', 'logs'] });

    const currentGameService = this.getGameServiceByName(game.name);

    const { gameData, nextPlayerId } = currentGameService.startGame(game.gameData);
    game.gameData = gameData;
    game.state = 1;
    const nextUser = new User();
    nextUser.id = nextPlayerId;
    game.nextPlayers = [nextUser];

    return this.gameRepository.save(game);
  }

  private getGameServiceByName(name: string): {
    getNewGame: () => { playersMax: number, playersMin: number, gameData: string },
    startGame: (gameData: string) => { gameData: string, nextPlayerId: string },
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
