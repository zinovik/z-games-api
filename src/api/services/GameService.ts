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
    game.gameData = JSON.stringify(gameData);

    return await this.create(game);
  }

  public async joinGame({ user, gameId }: { user: User, gameId: string }): Promise<Game> {
    const game = await this.gameRepository.findOne({ id: gameId }, { relations: ['players'] });

    if (game.state || game.players.length >= game.playersMax || game.players.some(player => player.id === user.id)) {
      throw new Error(); // TODO
    }

    game.players.push(user);

    return this.gameRepository.save(game);
  }

}
