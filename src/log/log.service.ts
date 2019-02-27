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
    private readonly connection: Connection,
    private readonly logger: LoggerService,
    @InjectModel('Log') private readonly logModel: Model<any>,
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Game') private readonly gameModel: Model<any>,
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

    if (IS_MONGO_USED) {
      const logMongo = new this.logModel({
        type,
        text,
        user: user.id,
        game: gameId,
      });

      try {
        const newLogMongo = await logMongo.save();

        await this.gameModel.findOneAndUpdate({ _id: gameId }, {
          $push: {
            logs: newLogMongo.id,
          },
        });

        await this.userModel.findOneAndUpdate({ _id: user.id }, {
          $push: {
            logs: newLogMongo.id,
          },
        });

        newLogMongo.user = user;

        return newLogMongo;
      } catch (error) {
        console.log(error.message);
        // TODO
      }
    }

    const newUser = new User();
    newUser.id = user.id;
    newUser.username = user.username;

    const log = new Log();
    log.type = type;
    log.user = newUser;
    log.gameId = gameId;
    log.text = text;

    try {
      const newLog = await this.connection.getRepository(Log).save(log);

      return newLog;
    } catch (error) {
      console.log(error.message);
      // TODO
    }
  }

}
