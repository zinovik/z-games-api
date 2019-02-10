import { Schema } from 'mongoose';

export const LogSchema = new Schema({
  id: String,
  type: String,
  text: String,
  gameId: String,
  userId: String,
  createdAt: Date,
  game: Object,
  user: Object,
});
