// Azure Configuration
const API_VERSIONS = {
  blob: '2022-11-02',
  documentIntelligence: '2023-10-31',
  search: '2023-11-01',
  openai: '2023-12-01-preview'
};

const AZURE_CONFIG = {
  // Region Configuration
  region: process.env.AZURE_REGION || 'eastus',

  // Storage Service
  storage: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    accessKey: process.env.AZURE_STORAGE_ACCESS_KEY,
    containerName: 'documents',
    version: API_VERSIONS.blob,
    options: {
      retryOptions: { maxTries: 3 },
      keepAliveOptions: { enable: true }
    }
  },

  // Document Intelligence Service
  documentIntelligence: {
    endpoint: process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,
    key: process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,
    version: API_VERSIONS.documentIntelligence,
    modelId: 'prebuilt-document'
  },

  // Cognitive Search Service
  search: {
    endpoint: process.env.AZURE_SEARCH_ENDPOINT,
    adminKey: process.env.AZURE_SEARCH_ADMIN_KEY,
    indexName: 'documents',
    version: API_VERSIONS.search,
    semanticRanker: {
      enabled: true,
      modelName: 'default'
    },
    vectorSearch: {
      algorithm: 'hnsw',
      dimensions: 1536,
      profile: 'default'
    }
  },

  // Azure OpenAI Service
  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    embeddingsDeploymentName: 'text-embedding-ada-002',
    embeddingsVersion:process.env.AZURE_OPENAI_EMBEDDINGS_VERSION,
    version: API_VERSIONS.openai,
    defaults: {
      temperature: 0.7,
      maxTokens: 800,
      topP: 0.95,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  }
};

function validateAzureConfig() {
  const validations = {
    storage: ['accountName', 'accessKey'],
    documentIntelligence: ['endpoint', 'key'],
    search: ['endpoint', 'adminKey'],
    openai: ['endpoint', 'key', 'deploymentName', 'embeddingsDeploymentName']
  };

  const missing = [];
  
  for (const [service, requiredFields] of Object.entries(validations)) {
    for (const field of requiredFields) {
      if (!AZURE_CONFIG[service]?.[field]) {
        missing.push(`${service}.${field}`);
      }
    }
  }

  if (missing.length > 0) {
    const errorDetails = missing.map(field => {
      const [service, key] = field.split('.');
      return `${field} (${getEnvVarName(service, key)})`;
    });

    throw new Error(
      'Missing required Azure configuration:\n' +
      errorDetails.map(detail => `- ${detail}`).join('\n')
    );
  }

  console.log('Azure configuration validated successfully');
  return true;
}

// Helper to get environment variable name
function getEnvVarName(service, key) {
  const mappings = {
    storage: {
      accountName: 'AZURE_STORAGE_ACCOUNT_NAME',
      accessKey: 'AZURE_STORAGE_ACCESS_KEY'
    },
    documentIntelligence: {
      endpoint: 'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT',
      key: 'AZURE_DOCUMENT_INTELLIGENCE_KEY'
    },
    search: {
      endpoint: 'AZURE_SEARCH_ENDPOINT',
      adminKey: 'AZURE_SEARCH_ADMIN_KEY'
    },
    openai: {
      endpoint: 'AZURE_OPENAI_ENDPOINT',
      key: 'AZURE_OPENAI_KEY',
      deploymentName: 'AZURE_OPENAI_DEPLOYMENT_NAME',
      embeddingsDeploymentName: 'AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME'
    }
  };

  return mappings[service]?.[key] || 'UNKNOWN_ENV_VAR';
}

module.exports = { AZURE_CONFIG, validateAzureConfig };
