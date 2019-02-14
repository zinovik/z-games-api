import { Schema, model } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

export const gameSchema = new Schema({
  id: { type: String, required: true },
  number: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  state: { type: Number, required: true },
  playersMax: { type: Number, required: true },
  playersMin: { type: Number, required: true },
  gameData: { type: String, required: true },
  isPrivate: { type: Boolean, required: true },
  privatePassword: String,
  playersOnline: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  players: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  nextPlayers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  logs: [{ type: Schema.Types.ObjectId, ref: 'Log' }],
});

gameSchema.plugin(uniqueValidator);

export const GameMongo = model('Game', gameSchema);
