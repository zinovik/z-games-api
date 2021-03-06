import { Injectable } from '@nestjs/common';
import { Connection, Like } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { DocumentQuery, Model, Connection as ConnectionMongo } from 'mongoose';

import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import { User } from '../db/entities';
import { IUser } from '../db/interfaces';
import {
  USER_FIELDS,
  USER_JOIN_OPENED_GAME,
  USER_JOIN_CURRENT_GAMES,
  USER_JOIN_CURRENT_WATCH,
  ALL_USER_FIELDS,
  ALL_USER_FIELDS_MONGO,
  USER_JOIN_INVITES_INVITER,
  USER_JOIN_INVITES_INVITEE,
  USER_FIELDS_MONGO,
  USER_POPULATE_OPENED_GAME,
  USER_POPULATE_CURRENT_GAMES,
  USER_POPULATE_CURRENT_WATCH,
  USER_POPULATE_INVITES_INVITER,
  USER_POPULATE_INVITES_INVITEE,
  USER_POPULATE_INVITES_GAME,
  USER_POPULATE_INVITES_INVITEE_USER,
  USER_POPULATE_INVITES_CREATED_BY,
  INVITES_FIELD_ORDER_BY_MONGO,
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

    // TODO: SQL Sorting
    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(ALL_USER_FIELDS)
      .getMany();
  }

  public findOneByEmail(email: string): Promise<User | IUser> {
    this.logger.info(`Find one user by email: ${email}`);

    if (IS_MONGO_USED) {
      return this.populateQuery(this.userModel.findOne({ email }, USER_FIELDS_MONGO)).exec();
    }

    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .leftJoin(...USER_JOIN_INVITES_INVITER)
      .leftJoin(...USER_JOIN_INVITES_INVITEE)
      .where({ email })
      .getOne();
  }

  public findOneById(userId: string): Promise<User | IUser> {
    this.logger.info(`Find one user by user id: ${userId}`);

    if (IS_MONGO_USED) {
      return this.populateQuery(this.userModel.findOne({ _id: userId }, USER_FIELDS_MONGO)).exec();
    }

    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .leftJoin(...USER_JOIN_INVITES_INVITER)
      .leftJoin(...USER_JOIN_INVITES_INVITEE)
      .where({ id: userId })
      .getOne();
  }

  public findOneByUsername(username: string): Promise<User | IUser> {
    this.logger.info(`Find one user by username: ${username}`);

    if (IS_MONGO_USED) {
      return this.populateQuery(this.userModel.findOne({ username }, USER_FIELDS_MONGO)).exec();
    }

    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .leftJoin(...USER_JOIN_INVITES_INVITER)
      .leftJoin(...USER_JOIN_INVITES_INVITEE)
      .where({ username })
      .getOne();
  }

  public findManyByUsername(username: string): Promise<User[] | IUser[]> {
    this.logger.info(`Find users by username: ${username}`);

    if (IS_MONGO_USED) {
      // return this.populateQuery(
      //   this.userModel.find({ username: new RegExp(`.*${username}.*`, 'i') }, USER_FIELDS_MONGO),
      // )
      //   .limit(5)
      //   .exec();
      return this.userModel
        .find({ username: new RegExp(`.*${username}.*`, 'i') }, USER_FIELDS_MONGO)
        .populate(...USER_POPULATE_OPENED_GAME)
        .populate(...USER_POPULATE_CURRENT_GAMES)
        .populate(...USER_POPULATE_CURRENT_WATCH)
        .populate({
          path: USER_POPULATE_INVITES_INVITER[0],
          select: USER_POPULATE_INVITES_INVITER[1],
          populate: [
            {
              path: USER_POPULATE_INVITES_GAME[0],
              select: USER_POPULATE_INVITES_GAME[1],
            },
            {
              path: USER_POPULATE_INVITES_INVITEE_USER[0],
              select: USER_POPULATE_INVITES_INVITEE_USER[1],
            },
          ],
          options: { sort: { [INVITES_FIELD_ORDER_BY_MONGO]: -1 } },
        })
        .populate({
          path: USER_POPULATE_INVITES_INVITEE[0],
          select: USER_POPULATE_INVITES_INVITEE[1],
          populate: [
            {
              path: USER_POPULATE_INVITES_GAME[0],
              select: USER_POPULATE_INVITES_GAME[1],
            },
            {
              path: USER_POPULATE_INVITES_CREATED_BY[0],
              select: USER_POPULATE_INVITES_CREATED_BY[1],
            },
          ],
          options: { sort: { [INVITES_FIELD_ORDER_BY_MONGO]: -1 } },
        })
        .limit(5)
        .exec();
    }

    return this.connection
      .getRepository(User)
      .createQueryBuilder('user')
      .select(USER_FIELDS)
      .leftJoin(...USER_JOIN_OPENED_GAME)
      .leftJoin(...USER_JOIN_CURRENT_GAMES)
      .leftJoin(...USER_JOIN_CURRENT_WATCH)
      .leftJoin(...USER_JOIN_INVITES_INVITER)
      .leftJoin(...USER_JOIN_INVITES_INVITEE)
      .where({ username: Like(`%${username}%`) })
      .getMany();
  }

  public async create({
    username,
    email,
    provider,
    password,
    firstName,
    lastName,
    avatar,
    country,
  }: {
    username: string;
    email: string;
    provider?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    country?: string;
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
      user.password = password;
    }

    user.country = country;

    if (IS_MONGO_USED) {
      const userMongo = new this.userModel(user);

      return userMongo.save();
    }

    return this.connection.getRepository(User).save(user);
  }

  public async addCreatedGame({ userId, gameId }: { userId: string; gameId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            createdGames: gameId,
          },
        },
      );
    }
  }

  public async update({
    userId,
    username,
    notificationsToken,
    avatar,
    country,
    password,
  }: {
    userId: string;
    username?: string;
    notificationsToken?: string;
    avatar?: string;
    country?: string;
    password?: string;
  }): Promise<void> {
    const updateFields = {} as IUser;

    if (username) {
      updateFields.username = username;
    }

    if (notificationsToken) {
      updateFields.notificationsToken = notificationsToken;
    }

    if (avatar) {
      updateFields.avatar = avatar;
    }

    if (country) {
      updateFields.country = country;
    }

    if (password) {
      updateFields.country = password;
    }

    if (IS_MONGO_USED) {
      await this.userModel.updateOne(
        { _id: userId },
        {
          ...updateFields,
          previousVisitAt: new Date(),
        },
      );
    }

    // TODO: SQL update
  }

  public async updateOpenGame({ usersIds, gameId }: { usersIds: string[]; gameId: string | null }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.updateMany(
        { _id: { $in: usersIds } },
        {
          openedGame: gameId,
        },
      );
    }
  }

  public async updateOpenGameWatcher({
    usersIds,
    gameId,
  }: {
    usersIds: string[];
    gameId: string | null;
  }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.findOneAndUpdate(
        { _id: { $in: usersIds } },
        {
          openedGameWatcher: gameId,
        },
      );
    }
  }

  public async updateOpenAndAddCurrentGame({ userId, gameId }: { userId: string; gameId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.findOneAndUpdate(
        { _id: userId },
        {
          openedGame: gameId,
          $push: {
            currentGames: gameId,
          },
        },
      );
    }
  }

  public async updateOpenAndRemoveCurrentGame({ userId, gameId }: { userId: string; gameId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.findOneAndUpdate(
        { _id: userId },
        {
          openedGame: null,
          $pull: {
            currentGames: gameId,
          },
        },
      );
    }
  }

  public async addLog({ userId, logId }: { userId: string; logId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            createdLogs: logId,
          },
        },
      );
    }
  }

  public async updateGamesPlayed({ playersIds }: { playersIds: string[] }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.updateMany(
        { _id: { $in: playersIds } },
        {
          $inc: {
            gamesPlayed: 1,
          },
        },
      );
    }
  }

  public async updateGamesWon({ playerWonId }: { playerWonId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.findOneAndUpdate(
        { _id: playerWonId },
        {
          $inc: {
            gamesWon: 1,
          },
        },
      );
    }
  }

  public async updateCurrentMoves({ usersIds, gameId }: { usersIds: string[]; gameId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      // Clear the game current moves for all the users
      await this.userModel.updateMany(
        {},
        {
          $pull: {
            currentMoves: gameId,
          },
        },
      );

      // Add current move for the users with usersIds
      if (usersIds.length) {
        await this.userModel.updateMany(
          { _id: { $in: usersIds } },
          {
            $push: {
              currentMoves: gameId,
            },
          },
        );
      }
    }
  }

  public async addCurrentMoves({ usersIds, gameId }: { usersIds: string[]; gameId: string }): Promise<void> {
    if (IS_MONGO_USED) {
      await this.userModel.updateMany(
        { _id: { $in: usersIds } },
        {
          $push: {
            currentMoves: gameId,
          },
        },
      );
    }
  }

  private populateQuery(query: DocumentQuery<IUser, IUser, {}>): DocumentQuery<IUser, IUser, {}> {
    return query
      .populate(...USER_POPULATE_OPENED_GAME)
      .populate(...USER_POPULATE_CURRENT_GAMES)
      .populate(...USER_POPULATE_CURRENT_WATCH)
      .populate({
        path: USER_POPULATE_INVITES_INVITER[0],
        select: USER_POPULATE_INVITES_INVITER[1],
        populate: [
          {
            path: USER_POPULATE_INVITES_GAME[0],
            select: USER_POPULATE_INVITES_GAME[1],
          },
          {
            path: USER_POPULATE_INVITES_INVITEE_USER[0],
            select: USER_POPULATE_INVITES_INVITEE_USER[1],
          },
        ],
        options: { sort: { [INVITES_FIELD_ORDER_BY_MONGO]: -1 } },
      })
      .populate({
        path: USER_POPULATE_INVITES_INVITEE[0],
        select: USER_POPULATE_INVITES_INVITEE[1],
        populate: [
          {
            path: USER_POPULATE_INVITES_GAME[0],
            select: USER_POPULATE_INVITES_GAME[1],
          },
          {
            path: USER_POPULATE_INVITES_CREATED_BY[0],
            select: USER_POPULATE_INVITES_CREATED_BY[1],
          },
        ],
        options: { sort: { [INVITES_FIELD_ORDER_BY_MONGO]: -1 } },
      });
  }
}
