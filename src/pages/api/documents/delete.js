import { getSession } from 'next-auth/react';
import connectDB from '../../../lib/db';
import { ObjectId } from 'mongodb';
import Document from '@/models/Document';
import { AzureStorageService } from '@/lib/azure/storage';
import { SearchService } from '@/lib/azure/search';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { documentId } = req.query;
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    await connectDB();

    // Verify the document belongs to the user
    const document = await Document.findOne({
      _id: new ObjectId(documentId),
      userId: session.user.id,
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const storageService = new AzureStorageService();
    const searchService = new SearchService();

    // Handle deletion based on document type
    if (document.type === 'file' && document.azure?.documentName){
      try {
        // Delete from Azure Storage
        await storageService.deleteDocument(document.azure.documentName);
      } catch (error) {
        console.error('Failed to delete file from Azure Storage:', error);
        return res.status(500).json({ error: 'Failed to delete file from storage' });
      }
    }

    if (document.type === 'file' || document.type === 'website') {
      try {
        // Delete from Azure Search
        await searchService.deleteDocument(document._id.toString());
      } catch (error) {
        console.error('Failed to delete document from Azure Search:', error);
        return res.status(500).json({ error: 'Failed to delete document from search index' });
      }
    }

    // Delete the document from MongoDB
    await Document.deleteOne({
      _id: new ObjectId(documentId),
      userId: session.user.id,
    });

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}
