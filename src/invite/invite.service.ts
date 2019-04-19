import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';

import { User, Invite } from '../db/entities';
import { IUser, IInvite, IGame } from '../db/interfaces';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';
import {
  INVITE_FIELDS_MONGO,
  INVITE_POPULATE_GAME,
  INVITE_POPULATE_INVITEE,
  INVITE_POPULATE_CREATED_BY,
} from '../db/scopes';

const IS_MONGO_USED = ConfigService.get().IS_MONGO_USED === 'true';

@Injectable()
export class InviteService {
  inviteModel: Model<IInvite>;
  gameModel: Model<IGame>;
  userModel: Model<IUser>;

  constructor(
    private readonly connection: Connection,
    private readonly logger: LoggerService,
    @InjectConnection() private readonly connectionMongo: ConnectionMongo,
  ) {
    this.inviteModel = this.connectionMongo.model('Invite');
    this.gameModel = this.connectionMongo.model('Game');
    this.userModel = this.connectionMongo.model('User');
  }

  public async findOne(inviteId: string): Promise<Invite | IInvite> {
    this.logger.info(`Find one invite id ${inviteId}`);

    if (IS_MONGO_USED) {
      return this.inviteModel
        .findOne({ _id: inviteId }, INVITE_FIELDS_MONGO)
        .populate(...INVITE_POPULATE_GAME)
        .populate(...INVITE_POPULATE_INVITEE)
        .populate(...INVITE_POPULATE_CREATED_BY)
        .exec();
    }

    // TODO: SQL
  }

  public async create({
    gameId,
    createdBy,
    invitee,
  }: {
    gameId: string;
    createdBy: User;
    invitee: string;
  }): Promise<Invite> {
    this.logger.info(`Create an invite by ${createdBy.username}`);

    if (IS_MONGO_USED) {
      const inviteMongo = new this.inviteModel({
        game: gameId,
        createdBy: createdBy.id,
        invitee,
      });

      const newInviteMongo = await inviteMongo.save();

      await this.gameModel.findOneAndUpdate(
        { _id: gameId },
        {
          $push: {
            invites: newInviteMongo.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: createdBy.id },
        {
          $push: {
            invitesInviter: newInviteMongo.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: invitee },
        {
          $push: {
            invitesInvitee: newInviteMongo.id,
          },
        },
      );

      return JSON.parse(JSON.stringify(await this.findOne(newInviteMongo.id)));
    }

    // TODO: Invites SQL
    // const newUser = new User();
    // newUser.id = createdBy.id;
    // newUser.username = user.username;

    const invite = new Invite();
    // invite.gameId = gameId;
    // invite.type = type;
    // invite.user = newUser;
    // invite.text = text;

    return await this.connection.getRepository(Invite).save(invite);
  }
}
