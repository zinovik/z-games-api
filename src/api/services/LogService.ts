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

  public findOne(id: string): Promise<Log | undefined> {
    this.log.info('Find all logs');
    return this.logRepository.findOne({ id });
  }

  public async create(log: Log): Promise<Log> {
    this.log.info('Create a new log => ', log.toString());
    log.id = uuid.v1();
    const newLog = await this.logRepository.save(log);
    this.eventDispatcher.dispatch(events.log.created, newLog);
    return newLog;
  }

  public update(id: string, log: Log): Promise<Log> {
    this.log.info('Update a log');
    log.id = id;
    return this.logRepository.save(log);
  }

  public async delete(id: string): Promise<void> {
    this.log.info('Delete a log');
    await this.logRepository.delete(id);
    return;
  }

}
