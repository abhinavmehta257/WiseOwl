import { BufferMemory } from "langchain/memory";
import ChatHistory from "../../../models/ChatHistory";

export class BufferMongoMemory extends BufferMemory {
  constructor(sessionId, botId) {
    super({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "question",
      outputKey: "answer"
    });
    this.sessionId = sessionId;
    this.botId = botId;
  }

  async saveContext(inputValues, outputValues) {
    // First save to buffer memory
    await super.saveContext(inputValues, outputValues);

    // Then save to MongoDB
    await ChatHistory.findOneAndUpdate(
      { sessionId: this.sessionId, botId: this.botId },
      {
        $push: {
          messages: [
            {
              role: 'human',
              content: inputValues.question,
              timestamp: new Date()
            },
            {
              role: 'ai',
              content: outputValues.answer,
              timestamp: new Date()
            }
          ]
        }
      },
      { upsert: true }
    );
  }
}
