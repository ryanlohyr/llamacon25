'use client';

import { useCallback, useState } from 'react';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type UseChatProps = {
  apiEndpoint?: string;
  initialMessages?: Message[];
  onResponse?: (message: Message) => void;
  onError?: (error: Error) => void;
};

export function useChat({
  apiEndpoint = 'http://localhost:8000/api/chat',
  initialMessages = [],
  onResponse,
  onError,
}: UseChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: Message = { role: 'user', content: userInput };
      setMessages((prev) => [...prev, userMessage]);
      
      // Clear input
      setInput('');
      
      // Add initial assistant message for streaming
      const assistantMessageIndex = messages.length;
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      
      try {
        // Make API request to backend
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(msg => ({ 
              role: msg.role, 
              content: msg.content 
            })),
            model: 'gpt-3.5-turbo',
          }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Failed to get response reader');
        }
        
        let assistantResponse = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode and append the new chunk
          const chunk = decoder.decode(value, { stream: true });

          console.log('chunk received', chunk);

          assistantResponse += chunk;
          
          // Update the assistant message content
          setMessages((prev) => {
            const updated = [...prev];
            updated[assistantMessageIndex] = {
              role: 'assistant',
              content: assistantResponse,
            };
            return updated;
          });
        }
        
        // Final completed message
        const completedMessage: Message = { role: 'assistant', content: assistantResponse };
        
        // Call onResponse callback if provided
        if (onResponse) {
          onResponse(completedMessage);
        }
        
      } catch (err) {
        console.error('Error sending message:', err);
        
        // Set error state
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        
        // Update the assistant message with error
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantMessageIndex] = {
            role: 'assistant',
            content: 'Sorry, there was an error processing your request.',
          };
          return updated;
        });
        
        // Call onError callback if provided
        if (onError) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, messages, onResponse, onError]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage]
  );

  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    sendMessage,
  };
} 