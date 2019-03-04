import { Document } from 'mongoose';

import { IUser } from './user.interface';
import { IGame } from './game.interface';

export interface ILog extends Document {
  type: string;
  text: string;
  game: IGame;
  user: IUser;
  createdAt: Date;
  updatedAt: Date;
}
