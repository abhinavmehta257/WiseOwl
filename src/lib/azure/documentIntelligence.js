const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { AZURE_CONFIG } = require('./config');

class DocumentIntelligenceService {
  constructor() {
    try {
      if (!AZURE_CONFIG.documentIntelligence?.endpoint || !AZURE_CONFIG.documentIntelligence?.key) {
        throw new Error('Missing required Document Intelligence configuration');
      }

      this.client = new DocumentAnalysisClient(
        AZURE_CONFIG.documentIntelligence.endpoint,
        new AzureKeyCredential(AZURE_CONFIG.documentIntelligence.key),
        {
          apiVersion: AZURE_CONFIG.documentIntelligence.version
        }
      );

      console.log('Document Intelligence service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Document Intelligence service:', error);
      throw new Error(`Document Intelligence initialization failed: ${error.message}`);
    }
  }

  async processDocument(documentUrl) {
    try {
      console.log('Starting document analysis:', documentUrl);

      // Start the document analysis
      const poller = await this.client.beginAnalyzeDocument('prebuilt-document', documentUrl);
      console.log('Analysis started, waiting for completion...');

      const result = await poller.pollUntilDone();
      console.log('Document analysis completed');

      // Extract content from the analyzed document
      const extractedContent = {
        text: '',
        tables: [],
        keyValuePairs: []
      };

      // Process paragraphs and text
      if (result.paragraphs) {
        extractedContent.text = result.paragraphs
          .map(paragraph => paragraph.content)
          .join('\n\n');
        console.log(`Extracted ${result.paragraphs.length} paragraphs`);
      }

      // Process tables if present
      if (result.tables) {
        extractedContent.tables = result.tables.map(table => {
          const rows = [];
          for (const cell of table.cells) {
            const rowIndex = cell.rowIndex;
            if (!rows[rowIndex]) {
              rows[rowIndex] = [];
            }
            rows[rowIndex][cell.columnIndex] = cell.content;
          }
          return rows;
        });
        console.log(`Extracted ${result.tables.length} tables`);
      }

      // Process key-value pairs if present
      if (result.keyValuePairs) {
        extractedContent.keyValuePairs = result.keyValuePairs.map(pair => ({
          key: pair.key?.content || '',
          value: pair.value?.content || ''
        }));
        console.log(`Extracted ${result.keyValuePairs.length} key-value pairs`);
      }

      return {
        success: true,
        content: extractedContent
      };

    } catch (error) {
      console.error('Document processing error:', {
        error: error.message,
        documentUrl
      });
      return {
        success: false,
        error: error.message || 'Failed to process document'
      };
    }
  }

  getCleanTextContent(extractedContent) {
    try {
      let text = extractedContent.text;
      const sections = [];

      // Add main text content
      if (text) {
        sections.push(text);
      }

      // Add table content
      if (extractedContent.tables.length > 0) {
        const tableContent = extractedContent.tables.map((table, index) => {
          const formattedTable = table
            .map(row => row.join(' | '))
            .join('\n');
          return `Table ${index + 1}:\n${formattedTable}`;
        }).join('\n\n');
        sections.push(tableContent);
      }

      // Add key-value pairs
      if (extractedContent.keyValuePairs.length > 0) {
        const kvContent = extractedContent.keyValuePairs
          .map(pair => `${pair.key}: ${pair.value}`)
          .join('\n');
        sections.push(kvContent);
      }

      const finalContent = sections.join('\n\n').trim();
      console.log('Content cleaning completed', {
        originalLength: text?.length || 0,
        finalLength: finalContent.length
      });

      return finalContent;
    } catch (error) {
      console.error('Content cleaning error:', error);
      throw new Error(`Failed to clean content: ${error.message}`);
    }
  }
}

module.exports = { DocumentIntelligenceService };
