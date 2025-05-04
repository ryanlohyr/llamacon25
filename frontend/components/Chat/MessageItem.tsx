'use client';

import { Button } from '@/components/ui/button';
import { Message } from '@/hooks/useChat';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from './Markdown';

type MessageItemProps = {
  message: Message;
  isLoading?: boolean;
  isLastMessage?: boolean;
};

export function MessageItem({ message, isLoading, isLastMessage }: MessageItemProps) {
  const isUser = message.role === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);
  
  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    // Here you would typically send the feedback to your backend
    console.log(`Feedback given: ${type} for message`, message);
  };
  
  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
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
      
      {!isUser && isLastMessage && !isLoading && (
        <div className="mt-1 ml-10 flex gap-1">
          {feedbackGiven ? (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {feedbackGiven === 'positive' ? 'Thanks for your feedback!' : 'Thanks for your feedback!'}
            </div>
          ) : (
            <>
              <Button
                onClick={() => handleFeedback('positive')}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400"
              >
                <ThumbsUp size={16} />
              </Button>
              <Button
                onClick={() => handleFeedback('negative')}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <ThumbsDown size={16} />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
} 