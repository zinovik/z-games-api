import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import { Model, Connection as ConnectionMongo } from 'mongoose';

import { User, Invite } from '../db/entities';
import { IUser, IInvite, IGame } from '../db/interfaces';
import { LoggerService } from '../logger/logger.service';
import { ConfigService } from '../config/config.service';

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

  public async create({
    gameId,
    inviter,
    invitee,
  }: {
    gameId: string;
    inviter: User;
    invitee: string;
  }): Promise<Invite> {
    this.logger.info(`Create an invite by ${inviter.username}`);

    if (IS_MONGO_USED) {
      const inviteMongo = new this.inviteModel({
        game: gameId,
        inviter: inviter.id,
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
        { _id: inviter.id },
        {
          $push: {
            invitesInviter: inviter.id,
          },
        },
      );

      await this.userModel.findOneAndUpdate(
        { _id: invitee },
        {
          $push: {
            invitesInvitee: invitee,
          },
        },
      );

      return newInviteMongo as any;
    }

    // TODO: Invites SQL
    // const newUser = new User();
    // newUser.id = inviter.id;
    // newUser.username = user.username;

    const invite = new Invite();
    // invite.gameId = gameId;
    // invite.type = type;
    // invite.user = newUser;
    // invite.text = text;

    return await this.connection.getRepository(Invite).save(invite);
  }
}
