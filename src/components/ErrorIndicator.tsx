
import { useState, useEffect } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ErrorAnalysisModal from "./ErrorAnalysisModal";

const ErrorIndicator = () => {
  const { currentError, showErrorModal, setShowErrorModal, clearError, handleError } = useErrorHandler();
  const [hasError, setHasError] = useState(false);

  // Global error listener
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      setHasError(true);
      handleError(event.error, {
        fileName: event.filename || 'Unknown file',
        userAction: 'Page interaction'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      handleError(event.reason, {
        fileName: 'Promise rejection',
        userAction: 'Async operation'
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  const handleClick = () => {
    if (currentError) {
      setShowErrorModal(true);
    } else {
      // For testing - simulate an error
      const testError = {
        message: "Test error: API connection failed",
        stack: "Error: Test error\n    at testFunction (ErrorIndicator.tsx:45:1)",
        fileName: "ErrorIndicator.tsx",
        userAction: "Testing error analysis system"
      };
      handleError(testError.message, {
        fileName: testError.fileName,
        userAction: testError.userAction
      });
      setShowErrorModal(true);
    }
  };

  const isActive = hasError || currentError;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleClick}
          className={`rounded-full w-14 h-14 shadow-xl transition-all duration-300 border-2 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 border-red-300 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 border-blue-300 hover:scale-110'
          }`}
          title={isActive ? "Error detected - Click for AI analysis" : "AI Assistant - Click for help"}
        >
          {isActive ? (
            <AlertTriangle className="w-7 h-7 text-white" />
          ) : (
            <HelpCircle className="w-7 h-7 text-white" />
          )}
        </Button>
        
        {/* Error indicator badge */}
        {isActive && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>

      {showErrorModal && (
        <ErrorAnalysisModal
          isOpen={showErrorModal}
          onClose={() => {
            setShowErrorModal(false);
            setHasError(false);
            clearError();
          }}
          error={currentError || {
            message: "Test error: API connection failed",
            stack: "Error: Test error\n    at testFunction (ErrorIndicator.tsx:45:1)",
            fileName: "ErrorIndicator.tsx",
            userAction: "Testing error analysis system"
          }}
        />
      )}
    </>
  );
};

export default ErrorIndicator;
