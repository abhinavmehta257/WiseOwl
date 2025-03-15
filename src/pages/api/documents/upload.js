import { IncomingForm } from 'formidable';
import { getAuthenticatedUser } from '../../../lib/auth';
import { DocumentProcessor } from '../../../lib/azure/documentProcessor';
import Document from '../../../models/Document';
import connectDB from '../../../lib/db';
import Bot from '@/models/Bot';

// Disable body parsing, we'll handle the multipart form data ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(req, res);
    
    // Connect to database
    await connectDB();
    const bot = await Bot.findOne({ userId: user.id });
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found for user' });
    }
    const botId = bot._id.toString(); // Convert MongoDB ObjectId to string
    // Parse the multipart form data
    const form = new IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Get the uploaded file
    const file = files.file[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Initialize Azure document processor
    const processor = new DocumentProcessor();
    await processor.initialize();

    // Create File object from the uploaded file
    const fileObject = {
      name: file.originalFilename,
      type: file.mimetype,
      size: file.size,
      arrayBuffer: async () => {
        return await require('fs').promises.readFile(file.filepath);
      }
    };

    // Process document using Azure services
    const processingResult = await processor.processDocument(fileObject, user.id, botId);

    // Only save document if processing is successful
    if (processingResult.success) {
      const document = new Document({
        userId: user.id,
        botId: botId, // Add botId here
        type: 'file',
        title: file.originalFilename,
        fileType: file.mimetype,
        status: 'completed',
        azure: {
          documentId: processingResult.documentId,
          documentName: processingResult.blobName,
          url: processingResult.url,
          metadata: processingResult.metadata
        }
      });

      await document.save();

      res.status(200).json({
        success: true,
        document: {
          id: document._id,
          title: document.title,
          type: document.type,
          status: document.status,
          createdAt: document.createdAt
        }
      });
    } else {
      throw new Error('Document processing failed');
    }
  } catch (error) {
    console.error('Document upload error:', error);

    // Update status if document was created but processing failed
    if (error.documentId) {
      await Document.findOneAndUpdate(
        { 'azure.documentId': error.documentId },
        { 
          status: 'error',
          error: error.message
        }
      );
    }

    res.status(500).json({
      error: 'Failed to process document',
      details: error.message
    });
  }
}
