
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { globalErrorLogger } from '@/utils/errorLogger';

interface ErrorRecoveryState {
  hasError: boolean;
  errorCount: number;
  lastError: string | null;
  recoveryAttempts: number;
}

export const useErrorRecovery = () => {
  const [state, setState] = useState<ErrorRecoveryState>({
    hasError: false,
    errorCount: 0,
    lastError: null,
    recoveryAttempts: 0
  });
  
  const { toast } = useToast();

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Update state safely
    setState(prev => ({
      ...prev,
      hasError: true,
      errorCount: prev.errorCount + 1,
      lastError: errorMessage
    }));

    // Log error
    globalErrorLogger.log('ERROR', `Error recovery triggered: ${errorMessage}`, {
      context,
      timestamp: Date.now()
    });

    // Show toast for non-critical errors
    if (!errorMessage.toLowerCase().includes('critical')) {
      toast({
        title: "Error Detected",
        description: "The system is attempting to recover automatically.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const attemptRecovery = useCallback(() => {
    setState(prev => ({
      ...prev,
      recoveryAttempts: prev.recoveryAttempts + 1,
      hasError: false
    }));

    globalErrorLogger.log('INFO', 'Recovery attempt initiated', {
      timestamp: Date.now()
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      hasError: false,
      errorCount: 0,
      lastError: null,
      recoveryAttempts: 0
    });
  }, []);

  return {
    ...state,
    handleError,
    attemptRecovery,
    reset
  };
};
