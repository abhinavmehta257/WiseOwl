# WiseOwl - AI-Powered Document Q&A

An intelligent document Q&A system built with Next.js and Azure AI services. Upload documents and ask questions to get accurate, context-aware responses.

## Features

- 📄 Document Upload & Processing
- 🔍 Vector Search Capabilities
- 💬 AI-Powered Q&A
- 🔐 User Authentication
- ⚡ Real-time Chat Interface
- 🎨 Customizable Chat Widget
- 📱 Responsive Design

## Prerequisites

1. Node.js 18+ and npm
2. MongoDB Database
3. Azure Account with the following services:
   - Azure Storage Account
   - Azure Document Intelligence
   - Azure Cognitive Search
   - Azure OpenAI

## Azure Services Setup

### Azure Storage
1. Create a new Storage Account
2. Get the connection string from Access Keys section
3. Note: Container will be created automatically by the application

### Azure Document Intelligence
1. Create a Document Intelligence resource
2. Get the endpoint URL and key from Keys and Endpoint section

### Azure Cognitive Search
1. Create a Cognitive Search service
2. Enable semantic search if available
3. Get the endpoint URL and admin key
4. Note: Search index will be created automatically by the application

### Azure OpenAI
1. Create an Azure OpenAI resource
2. Deploy one of these models:
   - GPT-4 (Recommended)
   - GPT-3.5 Turbo
3. Note the deployment name
4. Get the endpoint URL and key

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/wiseowl.git
   cd wiseowl
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file:
   ```bash
   cp example.env.local .env.local
   ```

4. Configure environment variables in `.env.local`:
   ```env
   # See example.env.local for detailed descriptions of each variable
   MONGODB_URI=your-mongodb-uri
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   
   # Azure Configuration
   AZURE_REGION=your-region
   AZURE_STORAGE_CONNECTION_STRING=your-connection-string
   AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=your-endpoint
   AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key
   AZURE_SEARCH_ENDPOINT=your-endpoint
   AZURE_SEARCH_ADMIN_KEY=your-key
   AZURE_OPENAI_ENDPOINT=your-endpoint
   AZURE_OPENAI_KEY=your-key
   AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
   ```

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

## Testing

1. Create a test account or log in
2. Navigate to the documents section
3. Upload a test document (PDF, DOCX, or TXT)
4. Wait for processing to complete
5. Try asking questions about the document content

## Architecture

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **AI/ML**: Azure OpenAI, Document Intelligence
- **Search**: Azure Cognitive Search
- **Storage**: Azure Blob Storage

## Azure Service Integration Flow

1. Document Upload
   - File uploaded to Azure Blob Storage
   - SAS URL generated for secure access

2. Document Processing
   - Document Intelligence extracts text and structure
   - OpenAI generates embeddings for vector search
   - Content indexed in Cognitive Search

3. Question Answering
   - Question embeddings generated
   - Vector search finds relevant content
   - OpenAI generates contextual response

## Customization

### Chat Widget
- Customize appearance in `src/components/bot/ThemeCustomizer.js`
- Configure behavior in `src/lib/azure/openai.js`

### Document Processing
- Adjust chunk size in `src/lib/azure/documentProcessor.js`
- Modify extraction rules in `src/lib/azure/documentIntelligence.js`

### Search Configuration
- Update vector search settings in `src/lib/azure/search.js`
- Modify index schema in `src/lib/azure/search.js`

## Troubleshooting

### Common Issues

1. Document Upload Fails
   - Check Azure Storage connection string
   - Verify file size limits
   - Check container permissions

2. Document Processing Fails
   - Verify Document Intelligence endpoint and key
   - Check supported file formats
   - Review processing logs

3. Search Issues
   - Verify Cognitive Search endpoint and key
   - Check index configuration
   - Review vector search settings

4. Authentication Issues
   - Verify MongoDB connection
   - Check NextAuth.js configuration
   - Review user permissions

### Debugging

Enable detailed logging by setting:
```env
DEBUG=wiseowl:*
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
