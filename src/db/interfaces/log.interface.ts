import { Document } from 'mongoose';

export interface ILog extends Document {
  type: string;
  text: string;
  game: any;
  user: any;
  createdAt: Date;
  updatedAt: Date;
}
