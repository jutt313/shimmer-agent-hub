
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AutomationErrorRecoveryProps {
  error: string;
  onRetry: () => void;
  automationId?: string;
}

const AutomationErrorRecovery: React.FC<AutomationErrorRecoveryProps> = ({ 
  error, 
  onRetry, 
  automationId 
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/automations');
  };

  const handleViewDetails = () => {
    if (automationId) {
      console.log('Attempting to reload automation:', automationId);
      onRetry();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Automation Load Error
          </h2>
          <p className="text-gray-600 mb-4">
            We encountered an issue loading your automation details.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700 font-mono">
              {error}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleViewDetails} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Loading
          </Button>
          
          <Button 
            onClick={handleGoHome} 
            variant="outline" 
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Automations
          </Button>
        </div>

        {automationId && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Automation ID: {automationId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationErrorRecovery;
