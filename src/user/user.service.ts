import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { LoggerService } from '../logger/logger.service';
import { User } from '../db/entities/user.entity';
import {
  USER_FIELDS,
  USER_JOIN_OPENED_GAME,
  USER_JOIN_CURRENT_GAMES,
  USER_JOIN_CURRENT_WATCH,
} from '../db/scopes/User';
import { ConfigService } from '../config/config.service';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

@Injectable()
export class UserService {

  constructor(
    private connection: Connection,
    private logger: LoggerService,
    @InjectModel('User') private readonly userModel: Model<any>,
  ) { }

  public findOne(email: string): Promise<User | undefined> {
    this.logger.info(`Find one user by email: ${email}`);

    if (IS_MONGO_USED) {
      return this.userModel.findOne({ email }).exec();
    }

    return this.connection.getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .where({ email })
      .getOne();
  }

  public findOneByUsername(username: string): Promise<User | undefined> {
    this.logger.info(`Find one user by email: ${username}`);

    if (IS_MONGO_USED) {
      return this.userModel.findOne({ username }).exec();
    }

    return this.connection.getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .where({ username })
      .getOne();
  }

  public async register({
    username,
    email,
    provider,
    password,
    firstName,
    lastName,
    avatar,
  }: {
    username: string,
    email: string,
    provider?: string,
    password?: string,
    firstName?: string,
    lastName?: string,
    avatar?: string,
  }): Promise<User> {
    this.logger.info(`Create a new user: ${username}`);

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

      try {
        const newUserMongo = await userMongo.save();

        this.logger.info(JSON.stringify(newUserMongo));

        return newUserMongo;
      } catch (error) {
        this.logger.error(error.message, error.trace);
        throw new Error('error'); // TODO Error
      }
    }

    try {
      const newUser = await this.connection.getRepository(User).save(user);

      this.logger.info(JSON.stringify(newUser));

      return newUser;
    } catch (error) {
      this.logger.error(error.message, error.trace);
      throw new Error('error'); // TODO Error
    }
  }

}
