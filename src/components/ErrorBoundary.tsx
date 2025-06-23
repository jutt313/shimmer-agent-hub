
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorAnalysisModal from './ErrorAnalysisModal';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showAnalysis: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, showAnalysis: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.log('🚨 Error Boundary caught error:', error);
    return { hasError: true, error, showAnalysis: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error caught by ErrorBoundary:', error, errorInfo);
    
    // Dispatch a custom event that the ErrorIndicator can listen to
    console.log('🚨 Dispatching react-error event...');
    window.dispatchEvent(new CustomEvent('react-error', {
      detail: {
        error,
        errorInfo,
        fileName: 'React Component',
        userAction: 'Component Rendering'
      }
    }));
  }

  handleOpenHelpChat = (message: string, context: string) => {
    // Since this is the error boundary, we'll just log this for now
    // In a real implementation, this would open the global help chat
    console.log('🆘 Help requested from ErrorBoundary:', message, context);
    
    // Try to dispatch a global event for help chat
    window.dispatchEvent(new CustomEvent('open-help-chat', {
      detail: { message, context }
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              An unexpected error occurred. Our AI can help analyze and fix this issue.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => this.setState({ showAnalysis: true })}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Get AI Analysis & Solution
              </Button>
              
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full"
              >
                Try Again
              </Button>
            </div>

            {this.state.showAnalysis && this.state.error && (
              <ErrorAnalysisModal
                isOpen={this.state.showAnalysis}
                onClose={() => this.setState({ showAnalysis: false })}
                onOpenHelpChat={this.handleOpenHelpChat}
                error={{
                  message: this.state.error.message,
                  stack: this.state.error.stack,
                  fileName: 'React Component',
                  userAction: 'Page Rendering'
                }}
              />
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
