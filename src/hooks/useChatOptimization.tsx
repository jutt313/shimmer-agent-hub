
import { useState, useCallback } from 'react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
}

export const useChatOptimization = () => {
  const [messageCache] = useState<Map<number, any>>(new Map());

  const cacheMessage = useCallback((messageId: number, processedData: any) => {
    // Simplified caching without state updates to prevent loops
    messageCache.set(messageId, processedData);
  }, [messageCache]);

  const getCachedMessage = useCallback((messageId: number) => {
    return messageCache.get(messageId);
  }, [messageCache]);

  const optimizeMessages = useCallback((messages: Message[]) => {
    // Simple optimization without complex state management
    if (!Array.isArray(messages)) return [];
    return messages.slice(-50);
  }, []);

  const clearCache = useCallback(() => {
    messageCache.clear();
  }, [messageCache]);

  return {
    optimizeMessages,
    cacheMessage,
    getCachedMessage,
    clearCache,
    cacheSize: messageCache.size
  };
};
