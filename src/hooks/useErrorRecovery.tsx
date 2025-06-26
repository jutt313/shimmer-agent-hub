
import { useState, useCallback, useEffect } from 'react';
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
    
    setState(prev => ({
      ...prev,
      hasError: true,
      errorCount: prev.errorCount + 1,
      lastError: errorMessage
    }));

    globalErrorLogger.log('ERROR', `Error recovery triggered: ${errorMessage}`, {
      context,
      errorCount: state.errorCount + 1,
      recoveryAttempts: state.recoveryAttempts
    });

    // Show toast for non-critical errors
    if (!errorMessage.toLowerCase().includes('critical')) {
      toast({
        title: "Error Detected",
        description: "The system is attempting to recover automatically.",
        variant: "destructive",
      });
    }
  }, [state.errorCount, state.recoveryAttempts, toast]);

  const attemptRecovery = useCallback(() => {
    setState(prev => ({
      ...prev,
      recoveryAttempts: prev.recoveryAttempts + 1,
      hasError: false
    }));

    globalErrorLogger.log('INFO', 'Recovery attempt initiated', {
      attempt: state.recoveryAttempts + 1
    });
  }, [state.recoveryAttempts]);

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
