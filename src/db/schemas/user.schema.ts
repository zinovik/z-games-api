import { Schema } from 'mongoose';

export const UserSchema = new Schema({
  id: String,
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  username: String,
  isConfirmed: Boolean,
  provider: String,
  avatar: String,
  openedGame: Object,
  currentGames: Array,
  currentWatch: Object,
  currentMove: Array,
  gamesPlayed: Number,
  gamesWon: Number,
  createdAt: Date,
  updatedAt: Date,
  logs: Array,
});
