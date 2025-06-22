
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface ErrorInfo {
  message: string;
  stack?: string;
  fileName?: string;
  userAction?: string;
}

export const useErrorHandler = () => {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { toast } = useToast();

  const handleError = useCallback((error: Error | string, context?: {
    fileName?: string;
    userAction?: string;
  }) => {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      fileName: context?.fileName,
      userAction: context?.userAction,
    };

    console.log('🔴 Error handler called:', errorInfo);
    setCurrentError(errorInfo);
    
    // Don't show toast for every error, just set the indicator to red
    // The user can click the indicator to see the error
    
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
    setShowErrorModal(false);
  }, []);

  return {
    currentError,
    showErrorModal,
    setShowErrorModal,
    handleError,
    clearError,
  };
};
