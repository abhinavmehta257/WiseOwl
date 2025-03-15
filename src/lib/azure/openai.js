const { AzureOpenAI } = require("openai");
const { AzureKeyCredential } = require("@azure/core-auth");
const { AZURE_CONFIG } = require("./config");
const pino = require("pino");

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

class OpenAIService {
  constructor(type = 'chat') {
    try {
      if (!AZURE_CONFIG.openai?.endpoint || !AZURE_CONFIG.openai?.key) {
        throw new Error("Missing required OpenAI configuration");
      }

      if (type === 'chat') {
        this.initializeChatClient();
      } else if (type === 'embeddings') {
        this.initializeEmbeddingsClient();
      } else {
        throw new Error("Invalid client type. Must be 'chat' or 'embeddings'");
      }
    } catch (error) {
      logger.error("Failed to initialize OpenAI service:", error);
      throw new Error("OpenAI initialization failed: " + error.message);
    }
  }

  initializeChatClient() {
    if (!AZURE_CONFIG.openai.deploymentName) {
      throw new Error("Missing chat deployment configuration");
    }

    this.client = new AzureOpenAI({
      endpoint: AZURE_CONFIG.openai.endpoint,
      credential: new AzureKeyCredential(AZURE_CONFIG.openai.key),
      deployment: AZURE_CONFIG.openai.deploymentName,
      apiVersion: AZURE_CONFIG.openai.version
    });

    logger.info("OpenAI chat client initialized successfully");
  }

  initializeEmbeddingsClient() {
    if (!AZURE_CONFIG.openai.embeddingsDeploymentName) {
      throw new Error("Missing embeddings deployment configuration");
    }

    this.client = new AzureOpenAI({
      endpoint: AZURE_CONFIG.openai.endpoint,
      credential: new AzureKeyCredential(AZURE_CONFIG.openai.key),
      deployment: AZURE_CONFIG.openai.embeddingsDeploymentName,
      apiVersion: AZURE_CONFIG.openai.embeddingsVersion
    });

    this.embeddingsDeploymentName = AZURE_CONFIG.openai.embeddingsDeploymentName;
    logger.info("OpenAI embeddings client initialized successfully");
  }

  async getEmbeddings(text) {
    try {
      logger.info("Generating embeddings...");
      const response = await this.client.embeddings.create({
        model: this.embeddingsDeploymentName,
        input: [text],
      });
      
      if (
        !response.data ||
        !Array.isArray(response.data) ||
        !response.data[0] ||
        !response.data[0].embedding
      ) {
        throw new Error("No embedding generated");
      }
      
      logger.info("Embeddings generated successfully");
      return response.data[0].embedding;
    } catch (error) {
      logger.error("Failed to generate embeddings:", error);
      throw new Error("Embedding generation failed: " + error.message);
    }
  }

  async getChatCompletion(messages, context = "", options = {}) {
    try {
      const defaultSystemMessage = this._getSystemMessage(context);
      logger.info("Generating chat completion...");

      const response = await this.client.chat.completions.create({
        deployment: this.client.deployment,
        messages: [
          { role: "system", content: defaultSystemMessage },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 800,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        ...options,
      });

      if (
        !response.choices ||
        !response.choices[0] ||
        !response.choices[0].message ||
        !response.choices[0].message.content
      ) {
        throw new Error("No completion generated");
      }

      logger.info("Chat completion generated successfully");
      return {
        response: response.choices[0].message.content,
        usage: response.usage,
      };
    } catch (error) {
      logger.error("Chat completion error:", error);
      throw new Error("Chat completion failed: " + error.message);
    }
  }

  async streamChatCompletion(messages, context = "", options = {}) {
    try {
      const defaultSystemMessage = this._getSystemMessage(context);
      logger.info("Initializing streaming chat completion...");
      console.log(defaultSystemMessage);
      

      const events = await this.client.chat.completions.create({
        deployment: this.client.deployment,
        stream: true,	
        messages: [
          { role: "system", content: defaultSystemMessage },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        ...options,
      });

      logger.info("Stream initialized successfully");
      return events;
    } catch (error) {
      logger.error("Streaming chat completion error:", error);
      throw new Error("Streaming chat completion failed: " + error.message);
    }
  }

  prepareContext(chunks, maxTokens = 3000) {
    try {
      logger.info(`Preparing context from ${chunks.length} chunks...`);
      const estimateTokens = (text) => Math.ceil(text.length / 4);

      let context = "";
      let tokenCount = 0;

      for (const chunk of chunks) {
        const chunkTokens = estimateTokens(chunk);
        if (tokenCount + chunkTokens > maxTokens) {
          break;
        }
        context += (context ? "\n\n" : "") + chunk;
        tokenCount += chunkTokens;
      }

      logger.info(`Context prepared (estimated ${tokenCount} tokens)`);
      return context;
    } catch (error) {
      logger.error("Context preparation error:", error);
      throw new Error("Context preparation failed: " + error.message);
    }
  }

  _getSystemMessage(context) {
    return `You are a helpful AI assistant. Use the following context to help answer the user's question.

    Context:
    ${context}

    Remember:
    - Reply in a helpful and informative manner.
    - Use Collective first-person language.
    - Only use the provided context to answer questions.
    - If you're not sure or the context doesn't contain the answer, say so.
    - Keep responses concise and focused.
    - Cite specific parts of the context when possible.
    - Use HTML for the reply.`;
      }
  }

module.exports = { OpenAIService };
