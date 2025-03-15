import connectDB from '../../../lib/db';
import Bot from '../../../models/Bot';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  try {
    await connectDB();

    const bot = await Bot.findOne({ userId });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.status(200).json({ success: true, bot });
  } catch (error) {
    console.error('Error fetching bot theme:', error);
    res.status(500).json({ error: 'Failed to fetch bot theme' });
  }
}
