import { Document } from 'mongoose';

import { IGame, ILog } from './';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
  isConfirmed: boolean;
  provider: string;
  avatar: string;
  openedGame: IGame;
  currentGames: IGame[];
  currentWatch: IGame;
  currentMove: IGame[];
  gamesPlayed: number;
  gamesWon: number;
  logs: ILog[];
  createdAt: Date;
  updatedAt: Date;
}
