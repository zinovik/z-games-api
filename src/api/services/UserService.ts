import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { WrongPasswordError } from '../errors/WrongPasswordError';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { events } from '../subscribers/events';
import { JwtService } from './jwt';

@Service()
export class UserService {

  constructor(
    @OrmRepository() private userRepository: UserRepository,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
    @Logger(__filename) private log: LoggerInterface,
    private jwtService: JwtService
  ) { }

  public find(): Promise<User[]> {
    this.log.info('Find all users');
    return this.userRepository.find({ relations: ['logs'] });
  }

  public findOne(email: string): Promise<User | undefined> {
    this.log.info('Find one user');
    return this.userRepository.findOne({ email });
  }

  public async create(user: User): Promise<User> {
    this.log.info('Create a new user => ', user.toString());
    user.id = uuid.v1();
    const newUser = await this.userRepository.save(user);
    this.eventDispatcher.dispatch(events.user.created, newUser);
    return newUser;
  }

  public update(id: string, user: User): Promise<User> {
    this.log.info('Update a user');
    user.id = id;
    return this.userRepository.save(user);
  }

  public async authorize({ username, password }: { username: string, password: string }): Promise<{ user: User, token: string }> {
    this.log.info('Authorize a user');

    const user = await this.userRepository.findOne({ username });

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!await User.comparePassword(user, password)) {
      throw new WrongPasswordError();
    }

    const token = this.jwtService.generateToken({ username }, '7 days');

    return { user, token };
  }

}
