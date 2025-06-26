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
    setMessageCache(prev => new Map(prev).set(messageId, processedData));
  }, []);

  const getCachedMessage = useCallback((messageId: number) => {
    return messageCache.get(messageId);
  }, [messageCache]);

  const optimizeMessages = useCallback((messages: Message[]) => {
    // Keep only the last 50 messages for performance
    const optimizedMessages = messages.slice(-50);
    
    // Cache processed messages
    optimizedMessages.forEach(message => {
      if (!messageCache.has(message.id)) {
        cacheMessage(message.id, {
          processed: true,
          timestamp: Date.now()
        });
      }
    });

    return optimizedMessages;
  }, [messageCache, cacheMessage]);

  const clearCache = useCallback(() => {
    setMessageCache(new Map());
  }, []);

  return {
    optimizeMessages,
    cacheMessage,
    getCachedMessage,
    clearCache,
    cacheSize: messageCache.size
  };
};
