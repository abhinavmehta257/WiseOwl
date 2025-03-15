import mongoose from 'mongoose';

const botSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true, default: 'My Bot' },
  color: { type: String, required: true, default: '#264653' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Bot || mongoose.model('Bot', botSchema);
