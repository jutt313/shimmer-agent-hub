
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Loader2, Play, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AutomationBlueprint } from '@/types/automation';
import { AutomationExecutionValidator, ExecutionValidationResult } from '@/utils/automationExecutionValidator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AICodeGeneratorButton from './AICodeGeneratorButton';

interface ReadyForExecutionButtonProps {
  automationId: string;
  blueprint: AutomationBlueprint;
  title: string;
}

const ReadyForExecutionButton = ({ 
  automationId, 
  blueprint, 
  title 
}: ReadyForExecutionButtonProps) => {
  const { user } = useAuth();
  const [validationResult, setValidationResult] = useState<ExecutionValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

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

      // Show AI generator if ready for execution
      if (result.canExecute) {
        setShowAIGenerator(true);
      }
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
    if (!validationResult?.canExecute || isExecuting || !generatedCode) return;

    setIsExecuting(true);
    toast.info('🚀 Executing automation with AI-generated code...');

    try {
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          user_id: user.id,
          generated_code: generatedCode,
          trigger_data: {
            trigger_type: 'manual',
            triggered_by: 'user',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`✅ Automation "${title}" executed successfully!`);
      } else {
        toast.error(`❌ Automation execution failed: ${data.error}`);
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
          Validating Configuration...
        </Button>
      </div>
    );
  }

  if (!validationResult || !validationResult.canExecute) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex flex-col items-end gap-2">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border p-3 max-w-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 mb-1">Configuration Required</p>
                <p className="text-xs text-gray-600 mb-2">Complete setup before execution:</p>
                
                {validationResult?.issues.missingCredentials.length > 0 && (
                  <div className="mb-2">
                    <p className="text-red-600 font-medium text-xs">Missing Credentials:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {validationResult.issues.missingCredentials.map(platform => (
                        <li key={platform}>{platform}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult?.issues.pendingAgents.length > 0 && (
                  <div className="mb-2">
                    <p className="text-purple-600 font-medium text-xs">Configure Agents:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {validationResult.issues.pendingAgents.map(agent => (
                        <li key={agent}>{agent}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            className="h-8 px-4 bg-gray-400 text-gray-200 rounded-xl font-medium text-sm cursor-not-allowed"
            disabled
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Configuration Required
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end gap-2">
        {/* AI Code Generator */}
        {showAIGenerator && !generatedCode && (
          <AICodeGeneratorButton
            automationId={automationId}
            onCodeGenerated={(code) => setGeneratedCode(code)}
          />
        )}

        {/* Ready for Execution Button */}
        {generatedCode && (
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className={`h-8 px-4 rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-300 ${
              isExecuting
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Ready for Execution
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReadyForExecutionButton;
