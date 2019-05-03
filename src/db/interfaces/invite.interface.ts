import { Document } from 'mongoose';

import { IUser, IGame } from './';

export interface IInvite extends Document {
  id: string;
  game: IGame;
  createdBy: IUser;
  invitee: IUser;
  createdAt: Date;
  updatedAt: Date;
  isClosed: boolean;
  isAccepted: boolean;
  isDeclined: boolean;
}
