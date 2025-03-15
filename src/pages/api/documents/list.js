import { getAuthenticatedUser } from '../../../lib/auth';
import Document from '../../../models/Document';
import connectDB from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req, res);
    
    // Connect to database
    await connectDB();
    
    // Get query parameters
    const { type, status, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {
      userId: user.id
    };

    // Add optional filters
    if (type) query.type = type;
    if (status) query.status = status;

    // Get total count
    const total = await Document.countDocuments(query);

    // Get paginated documents
    const documents = await Document.find(query)
      .select('-content') // Exclude content field
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      documents,
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({
      error: 'Failed to list documents',
      details: error.message
    });
  }
}
