import { Document } from 'mongoose';

import { IUser, ILog, IInvite } from './';

export interface IGame extends Document {
  number: number;
  name: string;
  state: number;
  playersMax: number;
  playersMin: number;
  gameData: string;
  isPrivate: boolean;
  isRemoved: boolean;
  privatePassword: string;
  playersOnline: IUser[];
  players: IUser[];
  watchers: IUser[];
  nextPlayers: IUser[];
  logs: ILog[];
  invites: IInvite[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: IUser;
}
