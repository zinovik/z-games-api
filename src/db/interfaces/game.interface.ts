import { Document } from 'mongoose';

import { IUser, ILog, IInvite } from './';

export interface IGame extends Document {
  id: string;
  number: number;
  name: string;
  state: number;
  playersMax: number;
  playersMin: number;
  gameData: string;
  isPrivate: boolean;
  isMoveTimeout: boolean;
  isRemoved: boolean;
  privatePassword: string;
  playersOnline: IUser[];
  players: IUser[];
  nextPlayers: IUser[];
  logs: ILog[];
  invites: IInvite[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: IUser;
  previousMoveAt: Date;
}
