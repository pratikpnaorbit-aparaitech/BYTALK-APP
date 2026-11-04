import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    text: { type: String, default: '', maxlength: 1500 },
    attachmentType: { type: String, default: null },
    attachmentUrl: { type: String, default: null },
    attachmentName: { type: String, default: null },
    attachmentSize: { type: String, default: null },
    createdAt: { type: Date, required: true, default: Date.now },
    at: { type: Date, required: true, default: Date.now, index: true },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { versionKey: false }
);

messageSchema.index({ from: 1, to: 1, at: -1 });
messageSchema.index({ to: 1, readAt: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export function publicMessage(message) {
  return {
    id: message.id,
    from: message.from,
    to: message.to,
    text: message.text || '',
    attachmentType: message.attachmentType || null,
    attachmentUrl: message.attachmentUrl || null,
    attachmentName: message.attachmentName || null,
    attachmentSize: message.attachmentSize || null,
    at: new Date(message.at || message.createdAt).toISOString(),
    deliveredAt: message.deliveredAt ? new Date(message.deliveredAt).toISOString() : null,
    readAt: message.readAt ? new Date(message.readAt).toISOString() : null,
  };
}
