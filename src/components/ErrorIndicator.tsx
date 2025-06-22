import { useState, useEffect, useRef } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ErrorAnalysisModal from "./ErrorAnalysisModal";

const ErrorIndicator = () => {
  const { currentError, showErrorModal, setShowErrorModal, clearError, handleError } = useErrorHandler();
  const [hasError, setHasError] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 70, y: window.innerHeight - 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep within screen bounds
        const maxX = window.innerWidth - 40;
        const maxY = window.innerHeight - 40;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if we were dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }

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
      <div 
        className="fixed z-50"
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <Button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          className={`rounded-full w-10 h-10 shadow-lg transition-all duration-300 border-2 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 border-red-300 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 border-blue-300'
          }`}
          title={isActive ? "Error detected - Click for AI analysis" : "AI Assistant - Click for help"}
        >
          {isActive ? (
            <AlertTriangle className="w-4 h-4 text-white" />
          ) : (
            <HelpCircle className="w-4 h-4 text-white" />
          )}
        </Button>
        
        {/* Error indicator badge */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full flex items-center justify-center">
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
