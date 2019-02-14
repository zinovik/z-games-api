import { Schema, model } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

export const userSchema = new Schema({
  id: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  username: { type: String, unique: true },
  isConfirmed: Boolean,
  provider: String,
  avatar: String,
  openedGame: { type: Schema.Types.ObjectId, ref: 'Game' },
  currentGames: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
  currentWatch: { type: Schema.Types.ObjectId, ref: 'Game' },
  currentMove: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
  gamesPlayed: { type: Number, required: true },
  gamesWon: { type: Number, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
});

userSchema.plugin(uniqueValidator);

export const UserMongo = model('User', userSchema);
