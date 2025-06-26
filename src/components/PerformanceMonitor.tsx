
import { useEffect, useState } from 'react';
import { globalErrorLogger } from '@/utils/errorLogger';

interface PerformanceMetrics {
  chatResponseTime: number;
  messageProcessingTime: number;
  errorCount: number;
  cacheHitRate: number;
  memoryUsage: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    chatResponseTime: 0,
    messageProcessingTime: 0,
    errorCount: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name.includes('chat-request')) {
          setMetrics(prev => ({
            ...prev,
            chatResponseTime: entry.duration
          }));
        }
        
        if (entry.name.includes('message-processing')) {
          setMetrics(prev => ({
            ...prev,
            messageProcessingTime: entry.duration
          }));
        }
      });
    });

    performanceObserver.observe({ entryTypes: ['measure'] });

    // Monitor memory usage
    const memoryMonitor = setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit
        }));
      }
    }, 5000);

    // Listen for error events
    const errorHandler = (event: CustomEvent) => {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
    };

    window.addEventListener('app-error', errorHandler as EventListener);

    return () => {
      performanceObserver.disconnect();
      clearInterval(memoryMonitor);
      window.removeEventListener('app-error', errorHandler as EventListener);
    };
  }, []);

  // Log performance metrics periodically
  useEffect(() => {
    const logInterval = setInterval(() => {
      globalErrorLogger.log('INFO', 'Performance metrics', {
        metrics,
        timestamp: Date.now()
      });
    }, 30000); // Log every 30 seconds

    return () => clearInterval(logInterval);
  }, [metrics]);

  // Don't render anything visible - this is a monitoring component
  return null;
};

export default PerformanceMonitor;
