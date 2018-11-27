import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Log } from '../models/Log';
import { User } from '../models/User';
import { LogRepository } from '../repositories/LogRepository';
import { events } from '../subscribers/events';

@Service()
export class LogService {

  constructor(
    @OrmRepository() private logRepository: LogRepository,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
    @Logger(__filename) private log: LoggerInterface
  ) { }

  public find(): Promise<Log[]> {
    this.log.info('Find all logs');
    return this.logRepository.find();
  }

  public findByUser(user: User): Promise<Log[]> {
    this.log.info('Find all logs of the user', user.toString());
    return this.logRepository.find({
      where: {
        userId: user.id,
      },
    });
  }

  public async create({ type, userId, gameId, text }: { type: string, userId: string, gameId: string, text?: string }): Promise<Log> {
    this.log.info('Create a new log => ', type, userId, gameId, text);

    const log = new Log();

    log.type = type;
    log.userId = userId;
    log.gameId = gameId;
    log.text = text;
    log.id = uuid.v1();

    const newLog = await this.logRepository.save(log);

    this.eventDispatcher.dispatch(events.log.created, newLog);

    return newLog;
  }

}
