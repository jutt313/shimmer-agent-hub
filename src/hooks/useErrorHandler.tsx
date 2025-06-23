
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
  const [onHelpChatCallback, setOnHelpChatCallback] = useState<((message: string, context: string) => void) | null>(null);
  const { toast } = useToast();

  const handleError = useCallback((error: Error | string, context?: {
    fileName?: string;
    userAction?: string;
    additionalContext?: string;
    onHelpChat?: (message: string, context: string) => void;
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
    setOnHelpChatCallback(() => context?.onHelpChat || null);
    
    // Show error modal
    setShowErrorModal(true);
    
    // Show toast with help option
    toast({
      title: "Error detected",
      description: "Click to get AI help with this error",
      duration: 5000,
    });
    
  }, [toast]);

  const clearError = useCallback(() => {
    console.log('🟢 Clearing error state');
    setCurrentError(null);
    setShowErrorModal(false);
    setOnHelpChatCallback(null);
  }, []);

  return {
    currentError,
    showErrorModal,
    setShowErrorModal,
    handleError,
    clearError,
    onHelpChatCallback,
  };
};
