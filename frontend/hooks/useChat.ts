"use client";

import { useCallback, useState } from "react";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type UseChatProps = {
  apiEndpoint?: string;
  sessionId?: string;
  initialMessages?: Message[];
  memory: boolean;
  onResponse?: (message: Message) => void;
  onError?: (error: Error) => void;
};

export function useChat({
  apiEndpoint = "http://localhost:8000/api/chat",
  initialMessages = [],
  sessionId = "",
  memory = false,
  onResponse,
  onError,
}: UseChatProps = { memory: false }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) return;

      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: Message = { role: "user", content: userInput };
      setMessages((prev) => [...prev, userMessage]);

      // Clear input
      setInput("");

      try {
        // Get current messages including the new user message
        const currentMessages = await new Promise<Message[]>((resolve) => {
          setMessages((prev) => {
            resolve([...prev]); // Resolve with the current state including the user message
            return prev;
          });
        });

        // Add initial assistant message for streaming
        const assistantMessageIndex = currentMessages.length;
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        console.log("memory that is being sent", memory);

        // Make API request to backend
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: currentMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            session_id: sessionId,
            model: "gpt-4o-mini",
            memory: memory,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Failed to get response reader");
        }

        let assistantResponse = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode and append the new chunk
          const chunk = decoder.decode(value, { stream: true });

          console.log("chunk received", chunk);

          assistantResponse += chunk;

          // Update the assistant message content
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > assistantMessageIndex) {
              updated[assistantMessageIndex] = {
                role: "assistant",
                content: assistantResponse,
              };
            }
            return updated;
          });
        }

        // Final completed message
        const completedMessage: Message = {
          role: "assistant",
          content: assistantResponse,
        };

        // Call onResponse callback if provided
        if (onResponse) {
          onResponse(completedMessage);
        }
      } catch (err) {
        console.error("Error sending message:", err);

        // Set error state
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Update the assistant message with error
        setMessages((prev) => {
          const updated = [...prev];
          // Only update if the message exists
          if (updated.length > prev.length - 1) {
            updated[prev.length - 1] = {
              role: "assistant",
              content: "Sorry, there was an error processing your request.",
            };
          }
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
    [apiEndpoint, onResponse, onError, memory]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

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
