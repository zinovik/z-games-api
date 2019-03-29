import { Document } from 'mongoose';

import { IUser, IGame } from './';

export interface ILog extends Document {
  type: string;
  text: string;
  game: IGame;
  user: IUser;
  createdAt: Date;
  updatedAt: Date;
}
