import mongoose from 'mongoose';

const botSchema = new mongoose.Schema({
  botId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Bot || mongoose.model('Bot', botSchema);
