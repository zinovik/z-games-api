import DataLoader from 'dataloader';
import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { Service } from 'typedi';

import { DLoader } from '../../decorators/DLoader';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { Context } from '../Context';
import { Log as LogModel } from '../models/Log';
import { User as UserModel } from '../models/User';
import { LogService } from '../services/LogService';
import { LogInput } from '../types/input/LogInput';
import { Log } from '../types/Log';

@Service()
@Resolver(of => Log)
export class LogResolver {

  constructor(
    private logService: LogService,
    @Logger(__filename) private log: LoggerInterface,
    @DLoader(UserModel) private userLoader: DataLoader<string, UserModel>
  ) { }

  @Query(returns => [Log])
  public logs(@Ctx() { requestId }: Context): Promise<LogModel[]> {
    this.log.info(`{${requestId}} Find all users`);
    return this.logService.find();
  }

  @Mutation(returns => Log)
  public async addLog(@Arg('log') log: LogInput): Promise<LogModel> {
    const newLog = new LogModel();
    newLog.text = log.text;
    return this.logService.create(newLog);
  }

  @FieldResolver()
  public async owner(@Root() log: LogModel): Promise<any> {
    if (log.userId) {
      return this.userLoader.load(log.userId);
    }
    // return this.userService.findOne(`${log.userId}`);
  }

  // user: createDataLoader(UserRepository),

  //     logsByUserIds: createDataLoader(LogRepository, {
  //         method: 'findByUserIds',
  //         key: 'userId',
  //         multiple: true,
  //     }),

}
