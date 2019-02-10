import { Schema } from 'mongoose';

export const GameSchema = new Schema({
  id: String,
  number: Number,
  name: String,
  state: Number,
  playersMax: Number,
  playersMin: Number,
  gameData: String,
  isPrivate: Boolean,
  privatePassword: String,
  playersOnline: Array,
  players: Array,
  watchers: Array,
  nextPlayers: Array,
  createdAt: Date,
  updatedAt: Date,
  logs: Array,
  game: Object,
  user: Object,
});
