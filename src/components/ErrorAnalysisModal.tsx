
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, X, MessageCircle } from "lucide-react";

interface ErrorAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelpChat: (message: string, context: string) => void;
  error: {
    message: string;
    stack?: string;
    fileName?: string;
    userAction?: string;
  };
}

const ErrorAnalysisModal = ({ isOpen, onClose, onOpenHelpChat, error }: ErrorAnalysisModalProps) => {
  const handleGetHelp = () => {
    const helpMessage = `I encountered an error and need help understanding and fixing it: ${error.message}`;
    const context = `Error Details:
- Message: ${error.message}
- File: ${error.fileName || 'Unknown'}
- User Action: ${error.userAction || 'Unknown'}
- Stack Trace: ${error.stack ? 'Available' : 'Not available'}`;
    
    onOpenHelpChat(helpMessage, context);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <DialogTitle className="text-xl">Error Detected</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-800 mb-3">Error Information</h3>
            <div className="space-y-2">
              <p className="text-red-700 text-sm font-medium">{error.message}</p>
              {error.fileName && (
                <Badge variant="outline" className="bg-red-100 text-red-700">
                  File: {error.fileName}
                </Badge>
              )}
              {error.userAction && (
                <p className="text-red-600 text-xs">
                  <strong>Action:</strong> {error.userAction}
                </p>
              )}
            </div>
          </div>

          {/* Get AI Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
            <p className="text-blue-700 text-sm mb-4">
              Our AI assistant can help you understand this error and provide solutions.
            </p>
            <Button 
              onClick={handleGetHelp}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Get AI Help with This Error
            </Button>
          </div>

          {/* Quick Tips */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Quick Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify your platform credentials are valid</li>
              <li>• Try refreshing the page</li>
              <li>• Contact support if the issue persists</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorAnalysisModal;
