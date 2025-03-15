import React, { useState } from 'react';
import axios from 'axios';

const Playground = ({ botId, botName }) => {
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatLog(prev => [...prev, userMessage]);
    
    const botMessageId = Date.now();
    setChatLog(prev => [...prev, { sender: 'bot', text: '', id: botMessageId }]);
    setIsTyping(true); // Show typing indicator
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          message,
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const text = line.slice(6);
            accumulatedText += text;
            
            // Add delay between characters
            await new Promise(resolve => setTimeout(resolve, 50));
            
            setChatLog(prev => 
              prev.map(msg => 
                msg.id === botMessageId 
                  ? { ...msg, text: accumulatedText }
                  : msg
              )
            );
          }
        }
      }
    } catch (error) {
      setChatLog(prev => 
        prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: 'Error: Unable to fetch response.' }
            : msg
        )
      );
    } finally {
      setIsTyping(false); // Hide typing indicator when done
    }

    setMessage('');
  };

  return (
    <div className="playground">
      <h1 className="text-2xl font-bold mb-4">Chat Playground</h1>
      <div className="chat-log border p-4 mb-4 h-64 overflow-y-scroll">
        {chatLog.map((entry, index) => (
          <div key={index} className="rounded-lg p-4">
            <div className={`flex space-x-4 ${entry.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
              {/* Bot/User Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium 
                ${entry.sender === 'bot' ? 'bg-blue-500' : 'bg-gray-500'}`}>
                {entry.sender === 'bot' ? (botName ? botName.charAt(0).toUpperCase() : 'B') : 'U'}
              </div>

              {/* Chat Message */}
              <div className="flex-1">
                <div className="font-medium">
                  {entry.sender === 'bot' ? botName || 'Bot' : 'You'}
                </div>
                <div className="mt-1 inline-block bg-gray-200 rounded-lg py-2 px-3" dangerouslySetInnerHTML={{ __html: entry.text }} >
                  {/* </div> */}
                  {/* {entry.text} */}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-message text-left mb-2">
            <div className="typing-indicator flex space-x-1">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input flex">
        <input
          type="text"
          className="flex-grow border p-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={handleSendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Playground;
