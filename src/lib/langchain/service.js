import { BufferMongoMemory } from "./memory/buffer-mongo";
import { OpenAIService } from "../azure/openai";
import { DocumentProcessor } from "../azure/documentProcessor";

export class LangChainService {
  constructor() {
    this.openAIService = new OpenAIService();
  }

  async createChain(sessionId, botId) {
    const memory = new BufferMongoMemory(sessionId, botId);
    const documentProcessor = new DocumentProcessor();

    return {
      call: async ({ question }, { callbacks }) => {
        // Determine if the question requires document search
        const isDocumentRelated =
          question.toLowerCase().includes("document") ||
          question.toLowerCase().includes("file");

        let context = "";

        // Search for relevant documents
        const searchResults = await documentProcessor.searchDocuments(question, botId);
        console.log("Search Results:", searchResults);


        // Prepare context from search results
        const contextChunks = searchResults.map((result) => {
          try {
            const metadata = JSON.parse(result.metadata);
            return `Source: ${metadata.title}\n${metadata.type}\n${result.content}`;
          } catch (error) {
            console.error("Error parsing metadata:", error);
            return `Source: Unknown\n${result.content}`;
          }
        });

        context = this.openAIService.prepareContext(contextChunks);

        // Get chat history and stream completion with context
        const { chat_history = [] } = await memory.loadMemoryVariables();
        const stream = await this.openAIService.streamChatCompletion(
          [...chat_history, { role: "user", content: question }],
          context
        );

        let fullResponse = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content && callbacks?.[0]?.handleLLMNewToken) {
            callbacks[0].handleLLMNewToken(content);
          }
          fullResponse += content;
        }

        await memory.saveContext({ question }, { answer: fullResponse });
        return fullResponse;
      },
    };
  }
}
