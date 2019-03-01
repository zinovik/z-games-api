import { Document } from 'mongoose';

export interface IGame extends Document {
  number: number;
  name: string;
  state: number;
  playersMax: number;
  playersMin: number;
  gameData: string;
  isPrivate: boolean;
  privatePassword: string;
  playersOnline: Array<any>;
  players: Array<any>;
  watchers: Array<any>;
  nextPlayers: Array<any>;
  logs: Array<any>;
  createdAt: Date;
  updatedAt: Date;
}
