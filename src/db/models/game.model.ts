import { Schema, model } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

export const gameSchema = new Schema({
  id: String, // unique, required
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
  createdAt: { type: Date, required: true, default: new Date() },
  updatedAt: { type: Date, required: true, default: new Date() },
  logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
});

gameSchema.plugin(uniqueValidator);

gameSchema.pre('update', next => {
  this.update({}, {
    $set: {
      updatedAt: new Date(),
    },
  });
  next();
});

export const GameMongo = model('Game', gameSchema);
