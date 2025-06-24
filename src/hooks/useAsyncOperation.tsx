
import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { globalErrorLogger } from '@/utils/errorLogger';

interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showErrorToast?: boolean;
  errorSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

export function useAsyncOperation<T = any>(
  operationName: string,
  options: UseAsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { handleError } = useErrorHandler();

  const execute = useCallback(async (
    operation: () => Promise<T>,
    context?: { userAction?: string; additionalContext?: string }
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      globalErrorLogger.log('INFO', `Starting async operation: ${operationName}`, {
        userAction: context?.userAction,
        additionalContext: context?.additionalContext
      });

      const result = await operation();
      
      setState({ data: result, loading: false, error: null });
      
      globalErrorLogger.log('INFO', `Async operation completed: ${operationName}`, {
        success: true
      });

      options.onSuccess?.(result);
      return result;

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));

      // Log the error
      globalErrorLogger.log('ERROR', `Async operation failed: ${operationName}`, {
        error: errorMessage,
        stack: error.stack,
        userAction: context?.userAction,
        additionalContext: context?.additionalContext
      });

      // Handle the error through the error handler
      handleError(error, {
        fileName: 'useAsyncOperation',
        userAction: context?.userAction || `Executing ${operationName}`,
        additionalContext: context?.additionalContext,
        severity: options.errorSeverity || 'medium',
        showToast: options.showErrorToast !== false
      });

      options.onError?.(error);
      return null;
    }
  }, [operationName, handleError, options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
