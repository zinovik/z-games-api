import { Document } from 'mongoose';

import { IUser, IGame } from './';

export interface IInvite extends Document {
  game: IGame;
  inviter: IUser;
  invitee: IUser;
  createdAt: Date;
  updatedAt: Date;
  isClosed: boolean;
}
