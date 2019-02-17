import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Log } from '../db/entities/log.entity';
import { User } from '../db/entities/user.entity';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

@Injectable()
export class LogService {

  constructor(
    private connection: Connection,
    private logger: LoggerService,
    @InjectModel('Log') private readonly logModel: Model<any>,
  ) { }

  public findAll(): Promise<Log[]> {
    this.logger.info('Get all logs');

    return this.connection.getRepository(Log)
      .createQueryBuilder('log')
      .select()
      .getMany();
  }

  public findByUser(user: User): Promise<Log[]> {
    this.logger.info(`Find logs by user: ${user.username}`);

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
    this.logger.info(`Create log type ${type} by ${user.username}`);

    const log = new Log();

    const newUser = new User();
    newUser.id = user.id;
    newUser.username = user.username;

    log.type = type;
    log.user = newUser;
    log.gameId = gameId;
    log.text = text;

    if (IS_MONGO_USED) {
      log.user = (user as any)._id;
      log.game = gameId as any;
      const logMongo = new this.logModel(log);

      try {
        const newLogMongo = await logMongo.save();

        return newLogMongo;
      } catch (error) {
        // TODO
      }
    }

    try {
      const newLog = await this.connection.getRepository(Log).save(log);

      return newLog;
    } catch (error) {
      // TODO
    }
  }

}
