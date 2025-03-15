const { AzureStorageService } = require('./storage');
const { DocumentIntelligenceService } = require('./documentIntelligence');
const { SearchService } = require('./search');
const { OpenAIService } = require('./openai');

class DocumentProcessor {
  constructor() {
    this.storage = new AzureStorageService();
    this.documentIntelligence = new DocumentIntelligenceService();
    this.search = new SearchService();
    this.openai = new OpenAIService("embeddings");
  }

  async initialize() {
    try {
      console.log('Initializing Azure services...');
      
      // Initialize storage
      console.log('Initializing Azure Storage...');
      await this.storage.initialize();
      
      // Initialize search
      console.log('Initializing Azure Cognitive Search...');
      await this.search.initializeIndex();

      console.log('Azure services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure services:', error);
      throw error;
    }
  }

  async processDocument(file, userId, botId) {
    try {
      // Step 1: Validate input
      if (!file || !userId) {
        throw new Error('Missing required parameters: file or userId');
      }

      console.log(`Processing document for user ${userId}:`, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      // Step 2: Upload to blob storage
      console.log('Uploading document to blob storage...');
      const uploadResult = await this.storage.uploadDocument(file, userId);
      console.log('Upload successful');

      // Step 3: Generate SAS URL for Document Intelligence
      console.log('Generating SAS URL...');
      const sasUrl = await this.storage.generateSasUrl(uploadResult.blobName);
      console.log('SAS URL generated');

      // Step 4: Process document with Document Intelligence
      console.log('Extracting content using Document Intelligence...');
      const extractionResult = await this.documentIntelligence.processDocument(sasUrl);
      
      if (!extractionResult.success) {
        console.log('Processing failed, cleaning up uploaded file...');
        await this.storage.deleteDocument(uploadResult.blobName);
        throw new Error(`Document extraction failed: ${extractionResult.error}`);
      }
      console.log('Content extraction successful');

      // Step 5: Get clean text content
      const textContent = this.documentIntelligence.getCleanTextContent(extractionResult.content);
      console.log('Text content extracted:', textContent.substring(0, 100) + '...');

      // Step 6: Generate embeddings
      console.log('Generating embeddings...');
      const embedding = await this.openai.getEmbeddings(textContent);
      console.log('Embeddings generated');

      // Step 7: Index document in Cognitive Search
      console.log('Indexing document in Cognitive Search...');
      const documentId = uploadResult.blobName.split('.')[0].replace('/','_');
      await this.search.indexDocument({
        id: `${userId}-${documentId}`,
        content: textContent,
        metadata: {
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          url: uploadResult.url,
          blobName: uploadResult.blobName
        },
        userId,
        botId,
        documentId,
        vectorContent: embedding
      });
      console.log('Document indexed successfully');

      return {
        success: true,
        documentId,
        blobName: uploadResult.blobName,
        url: uploadResult.url,
        metadata: {
          fileName: file.name,
          contentType: file.type,
          size: file.size
        }
      };

    } catch (error) {
      console.error('Document processing failed:', {
        error: error.message,
        stack: error.stack,
        fileName: file?.name,
        userId
      });
      throw error;
    }
  }

  async searchDocuments(query, botId) {
    try {
      console.log(`Searching documents for user ${botId}:`, query);

      // Generate embeddings for the query
      console.log('Generating query embeddings...');
      const queryEmbedding = await this.openai.getEmbeddings(query);
      console.log('Query embeddings generated');

      // Perform vector search
      console.log('Performing vector search...');
      const searchResults = await this.search.vectorSearch(queryEmbedding, botId);
      console.log(`Found ${searchResults} results`);
      
      return searchResults;
    } catch (error) {
      console.error('Search failed:', {
        error: error.message,
        query,
        botId
      });
      throw error;
    }
  }

  async deleteDocument(documentId, userId) {
    try {
      console.log(`Deleting document ${documentId} for user ${userId}...`);

      // Get document metadata from search index
      console.log('Retrieving document metadata...');
      const searchResults = await this.search.searchDocuments(
        '*',
        userId,
        {
          filter: `documentId eq '${documentId}'`,
          top: 1
        }
      );

      const document = searchResults.next().value;
      if (!document) {
        throw new Error('Document not found');
      }

      const metadata = JSON.parse(document.metadata);
      console.log('Found document metadata:', metadata);

      // Delete from blob storage
      console.log('Deleting from blob storage...');
      await this.storage.deleteDocument(metadata.blobName);
      console.log('Blob deleted');

      // Delete from search index
      console.log('Deleting from search index...');
      await this.search.deleteDocument(document.id);
      console.log('Search index entry deleted');

      console.log('Document deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete failed:', {
        error: error.message,
        documentId,
        userId
      });
      throw error;
    }
  }

  async generateResponse(query, userId, options = {}) {
    try {
      console.log(`Generating response for user ${userId}:`, query);

      // Search for relevant documents
      console.log('Searching relevant documents...');
      const searchResults = await this.searchDocuments(query, userId);
      
      // Extract and prepare context from search results
      console.log('Preparing context from search results...');
      const contextChunks = [];
      for (const result of searchResults) {
        const metadata = JSON.parse(result.metadata);
        contextChunks.push(`Source: ${metadata.fileName}\n${result.content}`);
      }

      // Prepare context with smart truncation
      const context = this.openai.prepareContext(contextChunks);
      console.log('Context prepared:', context.substring(0, 100) + '...');

      // Generate response using chat completion
      console.log('Generating chat completion...');
      if (options.stream) {
        const events = await this.openai.streamChatCompletion(
          [{ role: 'user', content: query }],
          context,
          options
        );
        console.log('Streaming response initialized');
        return events;
      } else {
        const response = await this.openai.getChatCompletion(
          [{ role: 'user', content: query }],
          context,
          options
        );
        console.log('Response generated');
        return response;
      }
    } catch (error) {
      console.error('Response generation failed:', {
        error: error.message,
        query,
        userId
      });
      throw error;
    }
  }
}

module.exports = { DocumentProcessor };
