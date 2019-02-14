import { Schema, model } from 'mongoose';

export const logSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  text: String,
  gameId: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, required: true },
  game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export const LogMongo = model('Log', logSchema);
