import { getAuthenticatedUser } from '../../../lib/auth';
import Document from '../../../models/Document';
import connectDB from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req, res);
    
    // Connect to database
    await connectDB();
    
    const { documentId, links } = req.body;
    
    if (!documentId || !links) {
      return res.status(400).json({ error: 'Document ID and links are required' });
    }

    // Find and update document
    const document = await Document.findOne({
      _id: documentId,
      userId: user.id
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    document.internalLinks = links;
    await document.save();

    res.status(200).json({
      success: true,
      document: {
        id: document._id,
        internalLinks: document.internalLinks
      }
    });
  } catch (error) {
    console.error('Update links error:', error);
    res.status(500).json({
      error: 'Failed to update links',
      details: error.message
    });
  }
}
