import { Document } from 'mongoose';

import { IUser, IGame } from './';

export interface ILog extends Document {
  id: string;
  type: string;
  text: string;
  game: IGame;
  createdBy?: IUser;
  createdAt: Date;
  updatedAt: Date;
}
