
import { useState, useCallback, useMemo } from 'react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  structuredData?: any;
}

export const useChatOptimization = () => {
  const [messageCache, setMessageCache] = useState<Map<number, any>>(new Map());

  const cacheMessage = useCallback((messageId: number, processedData: any) => {
    setMessageCache(prev => {
      const newCache = new Map(prev);
      newCache.set(messageId, processedData);
      return newCache;
    });
  }, []);

  const getCachedMessage = useCallback((messageId: number) => {
    return messageCache.get(messageId);
  }, [messageCache]);

  const optimizeMessages = useCallback((messages: Message[]) => {
    // Keep only the last 50 messages for performance
    const optimizedMessages = messages.slice(-50);
    
    // Cache processed messages without causing re-renders
    optimizedMessages.forEach(message => {
      if (!messageCache.has(message.id)) {
        // Use setTimeout to defer cache updates and prevent render loops
        setTimeout(() => {
          cacheMessage(message.id, {
            processed: true,
            timestamp: Date.now()
          });
        }, 0);
      }
    });

    return optimizedMessages;
  }, []); // Remove messageCache dependency to prevent loops

  const clearCache = useCallback(() => {
    setMessageCache(new Map());
  }, []);

  return useMemo(() => ({
    optimizeMessages,
    cacheMessage,
    getCachedMessage,
    clearCache,
    cacheSize: messageCache.size
  }), [optimizeMessages, cacheMessage, getCachedMessage, clearCache, messageCache.size]);
};
