import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

import { Game } from '../db/entities/game.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class GameService {

  constructor(private connection: Connection, private logger: LoggerService) { }

  getAllGames({ ignoreNotStarted, ignoreStarted, ignoreFinished }: {
    ignoreNotStarted: boolean,
    ignoreStarted: boolean,
    ignoreFinished: boolean,
  }): Promise<Game[]> {
    this.logger.info('get all games');
    this.logger.info(`${ignoreNotStarted}, ${ignoreStarted}, ${ignoreFinished}`);

    return this.connection.getRepository(Game)
      .createQueryBuilder('log')
      .select()
      .getMany();
  }

}
