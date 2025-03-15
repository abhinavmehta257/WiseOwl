const { SearchClient, SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');
const { AZURE_CONFIG } = require('./config');

class SearchService {
  constructor() {
    const credential = new AzureKeyCredential(AZURE_CONFIG.search.adminKey);
    
    this.searchClient = new SearchClient(
      AZURE_CONFIG.search.endpoint,
      AZURE_CONFIG.search.indexName,
      credential
    );

    this.adminClient = new SearchIndexClient(
      AZURE_CONFIG.search.endpoint,
      credential
    );
  }

  async checkIndexExists() {
    try {
      const index = await this.adminClient.getIndex(AZURE_CONFIG.search.indexName);
      console.log('Found existing index:', index.name);
      return true;
    } catch (error) {
      if (error.statusCode === 404) {
        console.log('Index does not exist');
        return false;
      }
      console.error('Error checking index:', error);
      throw new Error(`Failed to check index: ${error.message}`);
    }
  }

  async getIndexStats() {
    try {
      console.log('Retrieving index statistics...');
      const index = await this.adminClient.getIndex(AZURE_CONFIG.search.indexName);
      const stats = await this.adminClient.getIndexStatistics(AZURE_CONFIG.search.indexName);
      
      return {
        name: index.name,
        fields: index.fields.map(f => ({
          name: f.name,
          type: f.type,
          searchable: f.searchable,
          vectorSearchProfile: f.vectorSearchProfile,
          dimensions: f.dimensions
        })),
        documentCount: stats.documentCount,
        storageSize: stats.storageSize,
        vectorSearch: {
          algorithms: index.vectorSearch?.algorithms?.map(a => ({
            name: a.name,
            kind: a.kind,
            parameters: a.hnswParameters
          })),
          profiles: index.vectorSearch?.profiles
        }
      };
    } catch (error) {
      console.error('Failed to get index statistics:', error);
      throw new Error(`Failed to get index statistics: ${error.message}`);
    }
  }

  async initializeIndex() {
    return true;
  }

  async indexDocument(document) {
    try {
      console.log(`Indexing document ${document.id}...`);
      
      if (!document.vectorContent || document.vectorContent.length !== 1536) {
        throw new Error('Invalid vector embedding dimensions');
      }

      const result = await this.searchClient.uploadDocuments([
        {
          id: document.id,
          content: document.content,
          metadata: JSON.stringify(document.metadata),
          userId: document.userId,
          botId: document.botId, // Updated to use botId
          documentId: document.documentId,
          timestamp: new Date(),
          vectorContent: document.vectorContent
        }
      ]);

      console.log(`Document indexed successfully:`, result.results[0].key);

      return result.results[0].succeeded;
    } catch (error) {
      console.error('Failed to index document:', error);
      throw error;
    }
  }

  async searchDocuments(query, botId, options = {}) {
    try {
      console.log(`Performing text search for bot ${botId}:`, query);
      const searchOptions = {
        filter: `botId eq '${botId}'`, // Updated to filter by botId
        select: ['id', 'content', 'metadata', 'documentId', 'timestamp'],
        orderBy: ['timestamp desc'],
        ...options
      };

      const results = await this.searchClient.search(query, searchOptions);
      console.log("result",results.results);
            
      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async vectorSearch(vectorQuery, botId, options = {}) {
    try {
      console.log(`Performing vector search for bot ${botId}`);
  
      if (!Array.isArray(vectorQuery) || vectorQuery.length !== 1536) {
        throw new Error('Invalid vector query dimensions');
      }
  
      const searchOptions = {
        filter: `botId eq '${botId}'`, // Corrected filter syntax
        select: ['id', 'content', 'metadata', 'documentId', 'timestamp'],
        vectorSearchOptions: {
          queries: [
            {
              kind: "vector",
              vector: vectorQuery,
              fields: ["vectorContent"],
              kNearestNeighborsCount: 3,
            },
          ],
        },
        ...options
      };
  
      const results = await this.searchClient.search('*', searchOptions); // Using '*' instead of empty string
  
      const resultsArray = [];

      for await (const result of results.results) {
        // These results are the nearest neighbors to the query vector
        console.log("result:",result);
        resultsArray.push(result.document);
      }
  
      return resultsArray;
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }
  

  async deleteDocument(documentId) {
    try {
      console.log(`Deleting document ${documentId} from search index...`);

      const result = await this.searchClient.deleteDocuments([{id: documentId+"-1"}]);

      if (result && result[0]) {
        console.log('Delete operation result:', {
          key: result[0].key,
          status: result[0].status,
          errorMessage: result[0].errorMessage
        });

        if (!result[0].succeeded) {
          throw new Error(result[0].errorMessage || 'Failed to delete document');
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to delete document from index:', {
        documentId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }
}

module.exports = { SearchService };
