import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AutomationErrorRecoveryProps {
  error: string;
  onRetry?: () => void;
  onReset?: () => void;
}

const AutomationErrorRecovery: React.FC<AutomationErrorRecoveryProps> = ({
  error,
  onRetry,
  onReset
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-red-200 bg-red-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-800">
            Automation Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-red-700 mb-4">
              {error || "Something went wrong with your automation"}
            </p>
            <p className="text-sm text-red-600">
              Don't worry! We can help you recover from this error.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            
            {onReset && (
              <Button
                onClick={onReset}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Reset Automation
              </Button>
            )}
          </div>
          
          <div className="pt-4 border-t border-red-200">
            <p className="text-xs text-red-600 text-center">
              If this problem persists, please contact our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationErrorRecovery;