import connectDB from '../../lib/db';
import { DocumentProcessor } from '../../lib/azure/documentProcessor';
import { LangChainService } from '../../lib/langchain/service';

export default async function handler(req, res) {
  // Add CORS headers for local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { botId, message, stream, context } = req.body;
  console.log('botId', botId);	

  if (!botId || !message) {
    return res.status(400).json({
      error: 'Missing required fields'
    });
  }

  try {
    // For local testing, allow test-bot without database verification
    const db = await connectDB();
    const langchain = new LangChainService();

    // Generate unique session ID if not provided
    const sessionId = req.body.sessionId || `session_${Date.now()}`;

    // Get user context
    const userId = botId;

    if (!userId) {
      return res.status(404).json({ error: 'Bot not found' });
    }

     

    // Create chain with memory
    const chain = await langchain.createChain(sessionId, botId);

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await chain.call(
      { question: message },
      {
        callbacks: [
          {
            handleLLMNewToken(token) {
              res.write(`data: ${token}\n\n`);
            },
          },
        ],
      }
    );

    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message
    });
  }
}
