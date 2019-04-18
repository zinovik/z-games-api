import { Schema } from 'mongoose';

const transform = (
  doc: object,
  ret: { id: string; _id: string; __v: string },
  options: object,
) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
};

export const inviteSchema = new Schema(
  {
    game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    inviter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invitee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isClosed: Boolean,
  }, {
    toJSON: { transform },
    toObject: { transform },
    timestamps: true,
  },
);
