import { Schema, set } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

set('useFindAndModify', false);

const transform = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
};

export const gameSchema = new Schema({
  number: { type: Number, required: true, unique: true, default: 0 },
  name: { type: String, required: true },
  state: { type: Number, required: true, default: 0 },
  playersMax: { type: Number, required: true },
  playersMin: { type: Number, required: true },
  gameData: { type: String, required: true },
  isPrivate: { type: Boolean, required: true },
  privatePassword: String,
  playersOnline: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  nextPlayers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
}, {
    toJSON: { transform },
    toObject: { transform },
    timestamps: true,
  });

gameSchema.plugin(uniqueValidator);
