import connectDB from '../../../lib/db';
import Bot from '../../../models/Bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { botId, userId, name, color } = req.body;

  if (!name || !color) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await connectDB();

    botId = botId || `bot_${Date.now()}`;
    userId = userId || 'default-user';

    const bot = await Bot.findOneAndUpdate(
      {userId },
      { name, color, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, bot });
  } catch (error) {
    console.error('Error saving bot theme:', error);
    res.status(500).json({ error: 'Failed to save bot theme' });
  }
}
