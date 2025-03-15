import { getAuthenticatedUser } from '../../../lib/auth';
import Document from '../../../models/Document';
import connectDB from '../../../lib/db';
import Bot from '@/models/Bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req, res);
    
    // Connect to database
    await connectDB();
    
    const { url, linkUrl, linkText, documentId } = req.body;

    // Handle saving a new URL
    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Find bot
      const bot = await Bot.findOne({ userId: user.id });
      if (!bot) {
        return res.status(404).json({ error: 'Bot not found for user' });
      }

      // Create document record
      const document = new Document({
        botId: bot._id,
        userId: user.id,
        type: 'website',
        title: url,
        originalUrl: url,
        status: 'pending',
        content: '', // Will be populated during processing
        internalLinks: []
      });

      await document.save();

      return res.status(200).json({
        success: true,
        document: {
          id: document._id,
          title: document.title,
          type: document.type,
          status: document.status,
          createdAt: document.createdAt,
          internalLinks: document.internalLinks
        }
      });
    }

    // Handle saving an internal link
    if (documentId && linkUrl) {
      // Find parent document
      const document = await Document.findOne({
        _id: documentId,
        userId: user.id
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Find link index
      const linkIndex = document.internalLinks.findIndex(link => link.url === linkUrl);
      
      // Create new pending document for the internal link
      const linkDocument = new Document({
        userId: user.id,
        type: 'website',
        title: linkUrl,
        originalUrl: linkUrl,
        status: 'pending',
        content: '',
        internalLinks: []
      });

      await linkDocument.save();

      if (linkIndex === -1) {
        // Add new link
        document.internalLinks.push({
          url: linkUrl,
          text: linkText,
          isSaved: true,
          documentId: linkDocument._id // Reference to the new document
        });
      } else {
        // Update existing link
        document.internalLinks[linkIndex] = {
          ...document.internalLinks[linkIndex],
          isSaved: true,
          text: linkText || document.internalLinks[linkIndex].text,
          documentId: linkDocument._id // Reference to the new document
        };
      }

      await document.save();

      return res.status(200).json({
        success: true,
        document: {
          id: document._id,
          internalLinks: document.internalLinks
        }
      });
    }

    return res.status(400).json({ error: 'Either URL or Document ID and Link URL are required' });

  } catch (error) {
    console.error('Save URL error:', error);
    res.status(500).json({
      error: 'Failed to save URL',
      details: error.message
    });
  }
}
