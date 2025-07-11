
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/utils/notificationHelpers';

interface ErrorInfo {
  message: string;
  stack?: string;
  fileName?: string;
  userAction?: string;
  additionalContext?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const useErrorHandler = () => {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleError = useCallback((error: Error | string, context?: {
    fileName?: string;
    userAction?: string;
    additionalContext?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    showToast?: boolean;
  }) => {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      fileName: context?.fileName,
      userAction: context?.userAction,
      additionalContext: context?.additionalContext,
      severity: context?.severity || 'medium',
    };

    // Log to centralized error logger
    window.dispatchEvent(new CustomEvent('app-error', {
      detail: errorInfo
    }));

    setCurrentError(errorInfo);

    // Create notification for errors (will automatically happen via toast conversion)
    if (context?.showToast !== false && errorInfo.severity !== 'low') {
      const toastVariant = errorInfo.severity === 'critical' ? 'destructive' : 'default';
      toast({
        title: errorInfo.severity === 'critical' ? "Critical Error" : "Error",
        description: errorInfo.message,
        variant: toastVariant,
        duration: errorInfo.severity === 'critical' ? 10000 : 5000,
      });
    }

    // Create direct notification for critical errors that need special handling
    if (errorInfo.severity === 'critical' && user?.id) {
      createNotification(
        user.id,
        'Critical System Error',
        `Critical error occurred: ${errorInfo.message}`,
        'error',
        'critical_error',
        {
          stack: errorInfo.stack,
          file_name: errorInfo.fileName,
          user_action: errorInfo.userAction,
          additional_context: errorInfo.additionalContext,
          severity: errorInfo.severity
        }
      ).catch(notificationError => {
        console.error('Failed to create critical error notification:', notificationError);
      });
    }

    // Auto-show modal for critical errors
    if (errorInfo.severity === 'critical') {
      setShowErrorModal(true);
    }
    
  }, [toast, user?.id]);

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
