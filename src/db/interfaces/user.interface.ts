import { Document } from 'mongoose';

import { IGame } from './game.interface';
import { ILog } from './log.interface';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  isConfirmed: boolean;
  provider: string;
  avatar: string;
  openedGame: any;
  currentGames: IGame[];
  currentWatch: IGame;
  currentMove: IGame[];
  gamesPlayed: number;
  gamesWon: number;
  logs: ILog[];
  createdAt: Date;
  updatedAt: Date;
}
