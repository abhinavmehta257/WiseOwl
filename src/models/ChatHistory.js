import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  botId: { type: String, required: true },
  messages: [{
    role: { type: String, enum: ['human', 'ai'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.models.ChatHistory || mongoose.model('ChatHistory', chatHistorySchema);
