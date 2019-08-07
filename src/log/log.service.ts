import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';

import { User, Log } from '../db/entities';
import { IUser, ILog } from '../db/interfaces';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

@Injectable()
export class LogService {
  logModel: Model<ILog>;

  constructor(
    private readonly connection: Connection,
    private readonly logger: LoggerService,
    @InjectConnection() private readonly connectionMongo: ConnectionMongo,
  ) {
    this.logModel = this.connectionMongo.model('Log');
  }

  // public async findOne(logId: string): Promise<Log | ILog> {
  //   this.logger.info(`Find one log id ${logId}`);

  //   if (IS_MONGO_USED) {
  //     return this.logModel
  //       .findOne({ _id: logId }, LOG_FIELDS_MONGO)
  //       .populate(...LOG_POPULATE_GAME)
  //       .populate(...LOG_POPULATE_CREATED_BY)
  //       .exec();
  //   }

  //   // TODO: SQL Find One Log
  // }

  public async create({
    type,
    user,
    gameId,
    text,
  }: {
    type: string;
    user?: User | IUser;
    gameId: string;
    text?: string;
  }): Promise<Log> {
    this.logger.info(`Create a log type ${type} by ${user && user.username}`);

    if (IS_MONGO_USED) {
      const logMongo = new this.logModel({
        type,
        text,
        createdBy: user && user.id,
        game: gameId,
      });

      const newLogMongo = await logMongo.save();

      if (user) {
        (newLogMongo as ILog).createdBy = user as IUser;
      }

      return newLogMongo as any;
    }

    const log = new Log();
    log.type = type;
    log.gameId = gameId;
    log.text = text;

    if (user) {
      const newUser = new User();
      newUser.id = user.id;
      newUser.username = user.username;

      log.createdBy = newUser;
    }

    return await this.connection.getRepository(Log).save(log);
  }
}
