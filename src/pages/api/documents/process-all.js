import { getAuthenticatedUser } from '../../../lib/auth';
import Document from '../../../models/Document';
import connectDB from '../../../lib/db';
import { scrapeWebsite, normalizeContent } from '../../../lib/documentProcessing';
import { DocumentIntelligenceService } from '../../../lib/azure/documentIntelligence';
import { OpenAIService } from '../../../lib/azure/openai';
import { SearchService } from '../../../lib/azure/search';
import { AzureStorageService } from '../../../lib/azure/storage';
import Bot from '@/models/Bot';

// Function to chunk text into smaller segments
function chunkText(text, maxChunkSize = 1000) {
  const sentences = text.split(/[.!?]+/g);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

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
    // Initialize Azure services
    const documentIntelligence = new DocumentIntelligenceService();
    const openai = new OpenAIService('embeddings');
    const search = new SearchService();
    const storage = new AzureStorageService();

    // Ensure search index exists
    await search.initializeIndex();

    // Find all pending documents for the user
    const pendingDocuments = await Document.find({
      userId: user.id,
      status: { $in: ['pending', 'error'] }
    });

    const results = [];
    const errors = [];

    // Process each document
    for (const document of pendingDocuments) {
      try {
        document.status = 'processing';
        await document.save();

        let content = '';
        let metadata = {};

        // Process based on document type
        if (document.type === 'website') {
          // Scrape website and get content + internal links
          const { text, internalLinks } = await scrapeWebsite(document.originalUrl);
          content = normalizeContent(text);
          document.internalLinks = internalLinks.map(link => ({
            url: link.url,
            text: link.text,
            isSaved: false
          }));
          metadata = {
            type: 'website',
            url: document.originalUrl,
            title: document.title
          };
        } else if (document.type === 'file') {
          // Get file URL from Azure Storage
          const fileUrl = await storage.generateSasUrl(document.azure.documentId);
          
          // Process document using Document Intelligence
          const result = await documentIntelligence.processDocument(fileUrl);
          if (!result.success) {
            throw new Error(result.error || 'Document processing failed');
          }

          content = documentIntelligence.getCleanTextContent(result.content);
          metadata = {
            type: 'file',
            fileName: document.title,
            fileType: document.fileType,
            ...document.azure.metadata
          };
        }

        // Split content into chunks
        const chunks = chunkText(content);
        console.log(`Split content into ${chunks.length} chunks`);

        // Process each chunk
        for (const [index, chunk] of chunks.entries()) {
          // Generate embeddings
          const embedding = await openai.getEmbeddings(chunk);

          console.log(user);
          

          // Index in Azure Search
          await search.indexDocument({
            id: `${document._id}-${index}`,
            content: chunk,
            metadata: JSON.stringify({
              ...metadata,
              chunkIndex: index,
              totalChunks: chunks.length
            }),
            userId: user.id,
            botId: bot.botId,
            documentId: document._id.toString(),
            vectorContent: embedding
          });
        }

        // Update document status
        document.content = content;
        document.status = 'completed';
        await document.save();

        results.push({
          id: document._id,
          title: document.title,
          type: document.type,
          status: 'completed'
        });

      } catch (error) {
        console.error(`Error processing document ${document._id}:`, error);
        
        // Update document with error status
        document.status = 'error';
        document.error = error.message;
        await document.save();

        errors.push({
          id: document._id,
          title: document.title,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      processed: results.length,
      errors: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Process all error:', error);
    res.status(500).json({
      error: 'Failed to process documents',
      details: error.message
    });
  }
}
