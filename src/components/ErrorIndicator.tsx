import { useState, useEffect, useRef } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ErrorAnalysisModal from "./ErrorAnalysisModal";

const ErrorIndicator = () => {
  const { currentError, showErrorModal, setShowErrorModal, clearError, handleError } = useErrorHandler();
  const [hasError, setHasError] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Global error listener
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.log('🚨 Global error caught:', event.error);
      setHasError(true);
      handleError(event.error, {
        fileName: event.filename || 'Unknown file',
        userAction: 'Page interaction'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.log('🚨 Promise rejection caught:', event.reason);
      setHasError(true);
      handleError(event.reason, {
        fileName: 'Promise rejection',
        userAction: 'Async operation'
      });
    };

    // Also capture console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      if (args.length > 0 && typeof args[0] === 'string' && args[0].toLowerCase().includes('error')) {
        setHasError(true);
        handleError(args.join(' '), {
          fileName: 'Console error',
          userAction: 'Application runtime'
        });
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, [handleError]);

  // Update position when window resizes
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 80),
        y: Math.min(prev.y, window.innerHeight - 120)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        const maxX = window.innerWidth - 60;
        const maxY = window.innerHeight - 60;
        
        setPosition({
          x: Math.max(10, Math.min(newX, maxX)),
          y: Math.max(10, Math.min(newY, maxY))
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
        className="fixed z-[9999]"
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
          className={`rounded-full w-14 h-14 shadow-2xl transition-all duration-300 border-2 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 border-red-300 animate-pulse shadow-red-500/50' 
              : 'bg-blue-500 hover:bg-blue-600 border-blue-300 shadow-blue-500/30'
          }`}
          title={isActive ? "Error detected - Click for AI analysis" : "AI Assistant - Click for help"}
        >
          {isActive ? (
            <AlertTriangle className="w-6 h-6 text-white" />
          ) : (
            <HelpCircle className="w-6 h-6 text-white" />
          )}
        </Button>
        
        {/* Error indicator badge */}
        {isActive && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center animate-bounce">
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
