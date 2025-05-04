'use client';

import { Message } from '@/hooks/useChat';
import { Markdown } from './Markdown';
type MessageItemProps = {
  message: Message;
  isLoading?: boolean;
  isLastMessage?: boolean;
};

export function MessageItem({ message, isLoading, isLastMessage }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div className="flex items-start gap-2">
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-xs">AI</span>
          </div>
        )}
        
        <div
          className={`inline-block rounded-lg p-3 max-w-[80%] ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
          }`}
        >
          <Markdown>{message.content}</Markdown>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-300 dark:bg-blue-600 flex items-center justify-center">
            <span className="text-xs">You</span>
          </div>
        )}
      </div>
    </div>
  );
} 