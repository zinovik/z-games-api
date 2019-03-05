import { Schema } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

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
    currentMove: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
    gamesPlayed: { type: Number, required: true, default: 0 },
    gamesWon: { type: Number, required: true, default: 0 },
    logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
  },
  {
    toJSON: { transform },
    toObject: { transform },
    timestamps: true,
  },
);

userSchema.plugin(uniqueValidator);
