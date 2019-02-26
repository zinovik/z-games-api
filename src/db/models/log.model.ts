import { Schema, model } from 'mongoose';

const transform = (doc, ret, options) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
};

export const logSchema = new Schema({
  type: { type: String, required: true },
  text: String,
  createdAt: { type: Date, required: true, default: new Date() },
  game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    toJSON: { transform },
    toObject: { transform },
  });

export const LogMongo = model('Log', logSchema);
