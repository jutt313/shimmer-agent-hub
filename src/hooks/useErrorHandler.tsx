
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface ErrorInfo {
  message: string;
  stack?: string;
  fileName?: string;
  userAction?: string;
  additionalContext?: string;
}

export const useErrorHandler = () => {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { toast } = useToast();

  const handleError = useCallback((error: Error | string, context?: {
    fileName?: string;
    userAction?: string;
    additionalContext?: string;
  }) => {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      fileName: context?.fileName,
      userAction: context?.userAction,
      additionalContext: context?.additionalContext,
    };

    console.log('🔴 Error handler called with:', errorInfo);
    setCurrentError(errorInfo);
    
    // Optional: Show a subtle toast notification
    toast({
      title: "Error detected",
      description: "Click the red help icon for AI analysis",
      duration: 3000,
    });
    
  }, [toast]);

  const clearError = useCallback(() => {
    console.log('🟢 Clearing error state');
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
