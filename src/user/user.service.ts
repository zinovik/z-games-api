import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';

import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { CryptService } from '../services/crypt.service';
import { User } from '../db/entities';
import { IUser } from '../db/interfaces';
import {
  USER_FIELDS,
  USER_JOIN_OPENED_GAME,
  USER_JOIN_CURRENT_GAMES,
  USER_JOIN_CURRENT_WATCH,
  ALL_USER_FIELDS,
  ALL_USER_FIELDS_MONGO,
  USER_FIELDS_MONGO,
  USER_POPULATE_OPENED_GAME,
  USER_POPULATE_CURRENT_GAMES,
  USER_POPULATE_CURRENT_WATCH,
} from '../db/scopes/User';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

@Injectable()
export class UserService {

  userModel: Model<IUser>;

  constructor(
    private readonly connection: Connection,
    private readonly logger: LoggerService,
    @InjectConnection() private readonly connectionMongo: ConnectionMongo,
  ) {
    this.userModel = this.connectionMongo.model('User');
  }

  public getAllUsers(): Promise<User[] | IUser[]> {
    if (IS_MONGO_USED) {
      return this.userModel
        .find({}, ALL_USER_FIELDS_MONGO, {
          sort: {
            gamesWon: -1,
            gamesPlayed: 1,
            createdAt: 1,
          },
        })
        .exec();
    }

    // TODO Add sorting
    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(ALL_USER_FIELDS)
      .getMany();
  }

  public findOneByEmail(email: string): Promise<User | IUser> {
    this.logger.info(`Find one user by email: ${email}`);

    if (IS_MONGO_USED) {
      return this.userModel
        .findOne({ email }, USER_FIELDS_MONGO)
        .populate(...USER_POPULATE_OPENED_GAME)
        .populate(...USER_POPULATE_CURRENT_GAMES)
        .populate(...USER_POPULATE_CURRENT_WATCH)
        .exec();
    }

    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .where({ email })
      .getOne();
  }

  public findOneByUserId(userId: string): Promise<User | IUser> {
    this.logger.info(`Find one user by user id: ${userId}`);

    if (IS_MONGO_USED) {
      return this.userModel
        .findOne({ _id: userId }, USER_FIELDS_MONGO)
        .populate(...USER_POPULATE_OPENED_GAME)
        .populate(...USER_POPULATE_CURRENT_GAMES)
        .populate(...USER_POPULATE_CURRENT_WATCH)
        .exec();
    }

    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .where({ id: userId })
      .getOne();
  }

  public findOneByUsername(username: string): Promise<User | IUser> {
    this.logger.info(`Find one user by username: ${username}`);

    if (IS_MONGO_USED) {
      return this.userModel
        .findOne({ username }, USER_FIELDS_MONGO)
        .populate(...USER_POPULATE_OPENED_GAME)
        .populate(...USER_POPULATE_CURRENT_GAMES)
        .populate(...USER_POPULATE_CURRENT_WATCH)
        .exec();
    }

    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .where({ username })
      .getOne();
  }

  public async create({
    username,
    email,
    provider,
    password,
    firstName,
    lastName,
    avatar,
  }: {
    username: string;
    email: string;
    provider?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<User | IUser> {
    this.logger.info(`Create a user: ${username}`);

    const user = new User();
    user.username = username;
    user.email = email;

    if (provider) {
      user.provider = provider;
      user.firstName = firstName;
      user.lastName = lastName;
      user.avatar = avatar;
    } else {
      // TODO: Add email regexp verification
      user.password = password;
    }

    if (IS_MONGO_USED) {
      const userMongo = new this.userModel(user);

      return userMongo.save();
    }

    return this.connection.getRepository(User).save(user);
  }
}
