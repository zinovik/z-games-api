import { Container, Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { Logger, LoggerInterface } from '../../decorators/Logger';
import { WrongGameName } from '../errors/WrongGameName';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { GameRepository } from '../repositories/GameRepository';
import { NoThanks } from '../services/games/no-thanks';
import { Perudo } from '../services/games/perudo';

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
    return this.gameRepository.find({
      select: [
        'id',
        'number',
        'name',
        'state',
        'playersMax',
        'playersMin',
        'createdAt',
      ],
      relations: ['players'],
      where: { isPrivate: false },
    });
  }

  public async newGame(name: string): Promise<Game> {
    this.log.info(`New ${name} game`);

    const game = new Game();
    game.name = name;
    game.isPrivate = false;

    let currentGameService;

    switch (name) {
      case 'No, Thanks!':
        currentGameService = this.noThanks;
        break;
      case 'Perudo': {
        currentGameService = this.perudo;
        break;
      }
      default:
        throw new WrongGameName();
    }

    const { playersMax, playersMin, gameData } = currentGameService.getNewGame();

    game.playersMax = playersMax;
    game.playersMin = playersMin;
    game.players = [];
    game.gameData = JSON.stringify(gameData);

    return await this.create(game);
  }

  public async joinGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'playersOnline'] });

    if (game.state) {
      throw new Error(); // TODO
    }

    if (game.players.length >= game.playersMax) {
      throw new Error(); // TODO
    }

    if (game.players.some(player => player.id === user.id)) {
      throw new Error(); // TODO
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      throw new Error(); // TODO
    }

    game.players.push(user);
    game.playersOnline.push(user);

    return this.gameRepository.save(game);
  }

  public async openGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'playersOnline'] });

    if (!game.players.some(player => player.id === user.id)) {
      throw new Error(); // TODO
    }

    if (game.playersOnline.some(playerOnline => playerOnline.id === user.id)) {
      throw new Error(); // TODO
    }

    game.playersOnline.push(user);

    return this.gameRepository.save(game);
  }

  public async watchGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'watchers'] });

    if (!game.state) {
      throw new Error(); // TODO
    }

    if (!game.players.some(player => player.id === user.id)) {
      throw new Error(); // TODO
    }

    if (!game.watchers.some(watcher => watcher.id === user.id)) {
      throw new Error(); // TODO
    }

    game.watchers.push(user);

    return this.gameRepository.save(game);
  }

  public async leaveGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'playersOnline'] });

    if (game.state === 1) {
      throw new Error(); // TODO
    }

    if (!game.players.some(player => player.id === user.id)) {
      throw new Error(); // TODO
    }

    game.players = game.players.filter(player => player.id !== user.id);
    game.playersOnline = game.players.filter(player => player.id !== user.id);

    return this.gameRepository.save(game);
  }

  public async closeGame({ user, gameNumber }: { user: User, gameNumber: number }): Promise<Game> {
    const game = await this.gameRepository.findOne({ number: gameNumber }, { relations: ['players', 'watchers', 'playersOnline'] });

    if (game.state === 1) {
      throw new Error(); // TODO
    }

    const isUserInPlayers = game.players.some(player => player.id === user.id);
    const isUserInWatchers = game.watchers.some(player => player.id === user.id);

    if (!isUserInPlayers && !isUserInWatchers) {
      throw new Error(); // TODO
    }

    if (isUserInWatchers) {
      game.watchers = game.watchers.filter(watcher => watcher.id !== user.id);
    }

    if (isUserInPlayers) {
      game.playersOnline = game.players.filter(player => player.id !== user.id);
    }

    return this.gameRepository.save(game);
  }

}
