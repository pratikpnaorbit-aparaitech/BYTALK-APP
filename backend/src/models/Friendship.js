import mongoose from 'mongoose';

const friendshipSchema = new mongoose.Schema(
  {
    user1: { type: String, required: true, index: true },
    user2: { type: String, required: true, index: true },
    requesterId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

friendshipSchema.index({ user1: 1, user2: 1 });

export const Friendship =
  mongoose.models.Friendship || mongoose.model('Friendship', friendshipSchema);
