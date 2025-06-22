
import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ErrorAnalysisModal from "./ErrorAnalysisModal";

const ErrorIndicator = () => {
  const { currentError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();
  const [hasError, setHasError] = useState(false);

  // Global error listener
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      console.error('Global error caught:', event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      console.error('Unhandled promise rejection:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleClick = () => {
    if (currentError) {
      setShowErrorModal(true);
    } else {
      // Simulate an error for testing
      const testError = {
        message: "Test error: Unable to connect to API",
        stack: "Error: Test error\n    at testFunction (test.js:1:1)",
        fileName: "test.js",
        userAction: "Testing error system"
      };
      setShowErrorModal(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleClick}
          className={`rounded-full w-12 h-12 shadow-lg transition-all duration-300 ${
            hasError || currentError 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          <AlertTriangle className="w-6 h-6 text-white" />
        </Button>
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
            message: "Test error: Unable to connect to API",
            stack: "Error: Test error\n    at testFunction (test.js:1:1)",
            fileName: "test.js",
            userAction: "Testing error system"
          }}
        />
      )}
    </>
  );
};

export default ErrorIndicator;
