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
    return this.logRepository.createQueryBuilder('log')
      .select()
      .getMany();
  }

  public findByUser(user: User): Promise<Log[]> {
    this.log.info('Find all logs of the user', user.toString());

    return this.logRepository.createQueryBuilder('log')
      .select()
      .where({ userId: user.id })
      .getMany();
  }

  public async create({ type, user, gameId, text }: { type: string, user: User, gameId: string, text?: string }): Promise<Log> {
    this.log.info('Create a new log => ', type, user, gameId, text);

    const log = new Log();

    const newUser = new User();
    newUser.id = user.id;
    newUser.username = user.username;

    log.type = type;
    log.user = newUser;
    log.gameId = gameId;
    log.text = text;
    log.id = uuid.v1();

    const newLog = await this.logRepository.save(log);

    this.eventDispatcher.dispatch(events.log.created, newLog);

    return newLog;
  }

}
