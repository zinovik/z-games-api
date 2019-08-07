import { Schema } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

const transform = (doc: object, ret: { id: string; _id: string; __v: string }, options: object) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
};

export const gameSchema = new Schema(
  {
    number: { type: Number, required: true, unique: true, default: 1 },
    name: { type: String, required: true },
    state: { type: Number, required: true, default: 0 },
    playersMax: { type: Number, required: true },
    playersMin: { type: Number, required: true },
    gameData: { type: String, required: true },
    isPrivate: { type: Boolean, required: true },
    isMoveTimeout: { type: Boolean },
    isRemoved: { type: Boolean },
    playersOnline: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    watchersOnline: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    anonymousWatchersOnline: String,
    nextPlayers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
    invites: [{ type: Schema.Types.ObjectId, ref: 'Invite' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    previousMoveAt: { type: Date },
  },
  {
    toJSON: { transform },
    toObject: { transform },
    timestamps: true,
  },
);

gameSchema.plugin(uniqueValidator);
