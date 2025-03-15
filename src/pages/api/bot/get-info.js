import { getAuthenticatedUser } from '@/lib/auth';
import connectDB from '../../../lib/db';
import Bot from '../../../models/Bot';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { botId } = req.query;

  const user = await getAuthenticatedUser(req, res);

  if (!botId && !user) {
    return res.status(400).json({ error: 'Missing required query parameter: botId' });
  }

  try {
    await connectDB();
    let bot;
    
    if(botId){
      bot = await Bot.findOne({ botId });
    }
    if(user){
      bot = await Bot.findOne({ userId: user.id });
    }

    if (!bot) {
      bot = await Bot.create({ userId: user.id });
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.status(200).json({ success: true, bot });
  } catch (error) {
    console.error('Error fetching bot info:', error);
    res.status(500).json({ error: 'Failed to fetch bot info' });
  }
}
