import { Socket } from 'socket.io';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import uuid from 'uuid';

import { EventDispatcher, EventDispatcherInterface } from '../../decorators/EventDispatcher';
import { Logger, LoggerInterface } from '../../decorators/Logger';
import { UserNotFoundError } from '../errors/UserNotFoundError';
import { WrongPasswordError } from '../errors/WrongPasswordError';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { USER_FIELDS, USER_JOIN_OPENED_GAME } from '../scopes';
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

    return this.userRepository.createQueryBuilder('user')
      .select()
      .getMany();
  }

  public findOne(username: string): Promise<User | undefined> {
    this.log.info('Find one user');

    return this.userRepository.createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .where({ username })
      .getOne();
  }

  public update(id: string, user: User): Promise<User> {
    this.log.info('Update a user');
    user.id = id;

    return this.userRepository.save(user);
  }

  public async register({ username, password }: { username: string, password: string }): Promise<string> {
    this.log.info('Create a new user => ', username);

    const user = new User();
    user.username = username;
    user.password = password;
    user.id = uuid.v1();

    try {
      const newUser = await this.userRepository.save(user);
      this.eventDispatcher.dispatch(events.user.created, newUser);
    } catch (error) {
      return 'error'; // TODO Error
    }

    return 'You\'ve successfully registered, you can sign in'; // TODO: Add email verification
  }

  public async authorize({ username, password }: { username: string, password: string }): Promise<{ user: User, token: string }> {
    this.log.info('Authorize a user');

    const user = await this.findOne(username);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!await User.comparePassword(user, password)) {
      throw new WrongPasswordError();
    }

    const token = this.jwtService.generateToken({ username }, '7 days');

    return { user, token };
  }

  public sendError({ socket, message }: { socket: Socket, message: string }): void {
    socket.emit('error-message', message);
    return this.log.error(message);
  }

}
