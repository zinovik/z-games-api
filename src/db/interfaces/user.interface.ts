import { Document } from 'mongoose';

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
  currentGames: Array<any>;
  currentWatch: any;
  currentMove: Array<any>;
  gamesPlayed: number;
  gamesWon: number;
  logs: Array<any>;
  createdAt: Date;
  updatedAt: Date;
}
