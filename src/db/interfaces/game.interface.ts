import { Document } from 'mongoose';

import { IUser } from './user.interface';
import { ILog } from './log.interface';

export interface IGame extends Document {
  number: number;
  name: string;
  state: number;
  playersMax: number;
  playersMin: number;
  gameData: string;
  isPrivate: boolean;
  privatePassword: string;
  playersOnline: IUser[];
  players: IUser[];
  watchers: IUser[];
  nextPlayers: IUser[];
  logs: ILog[];
  createdAt: Date;
  updatedAt: Date;
}
