'use client';

import { MessageItem } from '@/components/Chat/MessageItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { Send } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function Chat() {
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading 
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[80vh] border rounded-lg shadow-md overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="p-4 border-b bg-white dark:bg-gray-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Chat with AI</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-lg">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageItem 
              key={index} 
              message={message} 
              isLoading={isLoading}
              isLastMessage={index === messages.length - 1}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t bg-white dark:bg-gray-800 shadow-inner">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus-visible:ring-blue-500"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 