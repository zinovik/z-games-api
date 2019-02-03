import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

import { Log } from '../db/entities/log.entity';
import { User } from '../db/entities/user.entity';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LogService {

  constructor(private connection: Connection, private logger: LoggerService) { }

  public findAll(): Promise<Log[]> {
    this.logger.info('get all logs');

    return this.connection.getRepository(Log)
      .createQueryBuilder('log')
      .select()
      .getMany();
  }

  public findByUser(user: User): Promise<Log[]> {
    this.logger.info('find logs by user');

    return this.connection.getRepository(Log)
      .createQueryBuilder('log')
      .select()
      .where({ userId: user.id })
      .getMany();
  }

  public async create({ type, user, gameId, text }: {
    type: string,
    user: User,
    gameId: string,
    text?: string,
  }): Promise<Log> {
    this.logger.info('create log');

    const log = new Log();

    const newUser = new User();
    newUser.id = user.id;
    newUser.username = user.username;

    log.type = type;
    log.user = newUser;
    log.gameId = gameId;
    log.text = text;

    const newLog = await this.connection.getRepository(Log).save(log);

    return newLog;
  }

}
