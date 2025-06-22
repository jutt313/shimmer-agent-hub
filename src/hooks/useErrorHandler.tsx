
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

    setCurrentError(errorInfo);
    
    // Show toast notification
    toast({
      title: "Error Detected",
      description: "Click to analyze this error with AI assistance",
      variant: "destructive",
      action: (
        <button 
          onClick={() => setShowErrorModal(true)}
          className="text-sm bg-white text-red-600 px-3 py-1 rounded hover:bg-red-50"
        >
          Analyze
        </button>
      ),
    });
  }, [toast]);

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
