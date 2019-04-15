import { Schema } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

import { CryptService } from './../../services/crypt.service';
import { IUser } from '../interfaces/user.interface';

const transform = (
  doc: object,
  ret: { id: string; _id: string; __v: string },
  options: object,
) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
};

export const userSchema = new Schema(
  {
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
    currentMoves: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
    gamesPlayed: { type: Number, required: true, default: 0 },
    gamesWon: { type: Number, required: true, default: 0 },
    logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
    createdGames: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
  },
  {
    toJSON: { transform },
    toObject: { transform },
    timestamps: true,
  },
);

userSchema.pre('save', async function(next: () => void) {
  const user = this as IUser;

  if (!user.isModified('password')) {
    return next();
  }

  const hash = await CryptService.hashPassword(user.password);
  user.password = hash;
  next();
});

userSchema.plugin(uniqueValidator);
