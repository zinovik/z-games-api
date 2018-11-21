import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Game } from '../models/Game';
import { GameRepository } from '../repositories/GameRepository';

@Service()
export class GameService {

  constructor(
    @OrmRepository() private gameRepository: GameRepository,
    @Logger(__filename) private log: LoggerInterface
  ) { }

  public find(): Promise<Game[]> {
    this.log.info('Find all games');
    return this.gameRepository.find({ relations: ['logs'] });
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

  public newGame(name: string): boolean {
    this.log.info(name);
    console.log(4, name);
    return true;
  }

}
