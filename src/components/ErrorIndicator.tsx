import { useState, useEffect, useRef } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ErrorAnalysisModal from "./ErrorAnalysisModal";
import { useProductionErrorHandler } from '@/utils/productionErrorHandler';
import { OAuthTokenManager } from '@/utils/oauthTokenManager';
import { WebhookDeliverySystem } from '@/utils/webhookDeliverySystem';

const ErrorIndicator = () => {
  const { currentError, showErrorModal, setShowErrorModal, clearError } = useErrorHandler();
  const { handleError: handleProductionError } = useProductionErrorHandler();
  const [hasError, setHasError] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Listen for React Error Boundary errors
  useEffect(() => {
    const handleReactError = async (event: CustomEvent) => {
      console.log('🚨 React error caught by ErrorIndicator:', event.detail);
      setHasError(true);
      
      // Handle with production error handler
      await handleProductionError(event.detail.error, {
        type: 'system',
        fileName: event.detail.fileName || 'React Component',
        additionalContext: {
          componentStack: event.detail.errorInfo?.componentStack,
          userAction: event.detail.userAction || 'Component Rendering'
        },
        showToast: false // We'll handle the toast manually
      });
    };

    const handleGlobalError = async (event: ErrorEvent) => {
      console.log('🚨 Global error caught:', event.error);
      setHasError(true);
      
      await handleProductionError(event.error, {
        type: 'system',
        fileName: event.filename || 'Unknown file',
        additionalContext: {
          lineno: event.lineno,
          colno: event.colno,
          userAction: 'Page interaction'
        },
        showToast: false
      });
    };

    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      console.log('🚨 Promise rejection caught:', event.reason);
      setHasError(true);
      
      await handleProductionError(event.reason, {
        type: 'api',
        additionalContext: {
          userAction: 'Async operation',
          promiseRejection: true
        },
        showToast: false
      });
    };

    // Enhanced console error listener
    const originalConsoleError = console.error;
    console.error = async (...args) => {
      originalConsoleError.apply(console, args);
      
      const errorMessage = args.join(' ');
      if (errorMessage.toLowerCase().includes('error') && 
          !errorMessage.includes('Warning') && 
          !errorMessage.includes('DevTools')) {
        
        console.log('🚨 Console error detected:', errorMessage);
        setHasError(true);
        
        // Classify error type based on message
        let errorType: 'oauth' | 'webhook' | 'api' | 'system' | 'validation' = 'system';
        if (errorMessage.toLowerCase().includes('oauth') || errorMessage.toLowerCase().includes('token')) {
          errorType = 'oauth';
        } else if (errorMessage.toLowerCase().includes('webhook')) {
          errorType = 'webhook';
        } else if (errorMessage.toLowerCase().includes('api') || errorMessage.toLowerCase().includes('fetch')) {
          errorType = 'api';
        } else if (errorMessage.toLowerCase().includes('validation')) {
          errorType = 'validation';
        }
        
        await handleProductionError(errorMessage, {
          type: errorType,
          additionalContext: {
            source: 'console',
            userAction: 'Application runtime'
          },
          showToast: false
        });
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('react-error', handleReactError as EventListener);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('react-error', handleReactError as EventListener);
      console.error = originalConsoleError;
    };
  }, [handleProductionError]);

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
      e.preventDefault();
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

  const handleClick = async (e: React.MouseEvent) => {
    // Prevent click if we were dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }

    if (currentError || hasError) {
      setShowErrorModal(true);
    } else {
      // Enhanced testing - test all production systems
      console.log('🧪 Testing production error systems...');
      setHasError(true);
      
      // Test different error types
      await handleProductionError("Test OAuth error: Token validation failed", {
        type: 'oauth',
        additionalContext: { test: true },
        showToast: false
      });
      
      setShowErrorModal(true);
    }
  };

  const handleOpenHelpChat = (message: string, context: string) => {
    // Dispatch a global event for opening help chat
    window.dispatchEvent(new CustomEvent('open-help-chat', {
      detail: { message, context }
    }));
  };

  const isActive = hasError || currentError;

  // Always render the component
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
          className={`rounded-full w-12 h-12 shadow-lg transition-all duration-300 border-2 hover:scale-110 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 border-red-300 animate-pulse shadow-red-500/50' 
              : 'bg-blue-500 hover:bg-blue-600 border-blue-300 shadow-blue-500/30'
          }`}
          title={isActive ? "Error detected - Click for AI analysis" : "AI Assistant - Click for help"}
        >
          {isActive ? (
            <AlertTriangle className="w-5 h-5 text-white" />
          ) : (
            <HelpCircle className="w-5 h-5 text-white" />
          )}
        </Button>
        
        {/* Error indicator badge */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center animate-bounce">
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
          onOpenHelpChat={handleOpenHelpChat}
          error={currentError || {
            message: "Test error: System check initiated",
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
