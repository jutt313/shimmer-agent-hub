
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AutomationBlueprint } from '@/types/automation';
import { AutomationExecutionValidator, ExecutionValidationResult } from '@/utils/automationExecutionValidator';
import { toast } from 'sonner';

interface AutomationExecutionPanelProps {
  automationId: string;
  blueprint: AutomationBlueprint;
  title: string;
}

const AutomationExecutionPanel = ({ 
  automationId, 
  blueprint, 
  title 
}: AutomationExecutionPanelProps) => {
  const { user } = useAuth();
  const [validationResult, setValidationResult] = useState<ExecutionValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!user || !blueprint) return;
    validateAutomation();
  }, [user, blueprint, automationId]);

  const validateAutomation = async () => {
    if (!user) return;
    
    setIsValidating(true);
    try {
      const result = await AutomationExecutionValidator.validateAutomation(
        automationId,
        blueprint,
        user.id
      );
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResult({
        canExecute: false,
        issues: { missingCredentials: [], untestedCredentials: [], pendingAgents: [] },
        message: 'Validation failed'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecute = async () => {
    if (!validationResult?.canExecute || isExecuting) return;

    setIsExecuting(true);
    toast.info('🚀 Starting automation execution...');

    try {
      // Call the execution function
      const response = await fetch('/api/execute-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_id: automationId,
          trigger_data: {
            trigger_type: 'manual',
            triggered_by: 'user',
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`✅ Automation executed successfully!`);
      } else {
        toast.error(`❌ Automation execution failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Execution failed:', error);
      toast.error(`💥 Execution failed: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          className="h-8 px-4 bg-gray-400 text-white rounded-xl font-medium text-sm"
          disabled
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Validating...
        </Button>
      </div>
    );
  }

  if (!validationResult) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end gap-2">
        {/* Validation Issues Display */}
        {!validationResult.canExecute && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border p-3 max-w-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 mb-1">Cannot Execute</p>
                
                {validationResult.issues.missingCredentials.length > 0 && (
                  <div className="mb-2">
                    <p className="text-red-600 font-medium text-xs">Missing Credentials:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {validationResult.issues.missingCredentials.map(platform => (
                        <li key={platform}>{platform}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.issues.untestedCredentials.length > 0 && (
                  <div className="mb-2">
                    <p className="text-orange-600 font-medium text-xs">Untested Credentials:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {validationResult.issues.untestedCredentials.map(platform => (
                        <li key={platform}>{platform}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.issues.pendingAgents.length > 0 && (
                  <div className="mb-2">
                    <p className="text-purple-600 font-medium text-xs">Pending Agent Decisions:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {validationResult.issues.pendingAgents.map(agent => (
                        <li key={agent}>{agent}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Configure all credentials and make agent decisions before executing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={!validationResult.canExecute || isExecuting}
          className={`h-8 px-4 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
            validationResult.canExecute
              ? isExecuting
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Executing...
            </>
          ) : validationResult.canExecute ? (
            <>
              <Play className="h-3 w-3 mr-1" />
              Execute Automation
            </>
          ) : (
            <>
              <X className="h-3 w-3 mr-1" />
              Cannot Execute
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AutomationExecutionPanel;
