
import { useState, useCallback, useMemo } from 'react';
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
    
    setState(prev => {
      const newState = {
        ...prev,
        hasError: true,
        errorCount: prev.errorCount + 1,
        lastError: errorMessage
      };

      globalErrorLogger.log('ERROR', `Error recovery triggered: ${errorMessage}`, {
        context,
        errorCount: newState.errorCount,
        recoveryAttempts: prev.recoveryAttempts
      });

      return newState;
    });

    // Show toast for non-critical errors
    if (!errorMessage.toLowerCase().includes('critical')) {
      toast({
        title: "Error Detected",
        description: "The system is attempting to recover automatically.",
        variant: "destructive",
      });
    }
  }, [toast]); // Remove state dependencies to prevent loops

  const attemptRecovery = useCallback(() => {
    setState(prev => {
      const newState = {
        ...prev,
        recoveryAttempts: prev.recoveryAttempts + 1,
        hasError: false
      };

      globalErrorLogger.log('INFO', 'Recovery attempt initiated', {
        attempt: newState.recoveryAttempts
      });

      return newState;
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

  return useMemo(() => ({
    ...state,
    handleError,
    attemptRecovery,
    reset
  }), [state, handleError, attemptRecovery, reset]);
};
