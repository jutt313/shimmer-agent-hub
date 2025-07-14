
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RealAutomationExecuteButtonProps {
  automationId: string;
  automationName: string;
  disabled?: boolean;
  className?: string;
}

const RealAutomationExecuteButton = ({ 
  automationId, 
  automationName, 
  disabled = false,
  className = ""
}: RealAutomationExecuteButtonProps) => {
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const handleExecute = async () => {
    if (!user || disabled) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      console.log(`🚀 Starting REAL automation execution: ${automationId}`);
      
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          user_id: user.id,
          trigger_data: {
            execution_timestamp: new Date().toISOString(),
            execution_type: 'manual_trigger'
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Execution request failed');
      }

      console.log(`📊 Execution result:`, data);
      setExecutionResult(data);

      if (data.success) {
        toast.success(`✅ ${automationName} executed successfully!`);
        setShowResults(true);
      } else {
        toast.error(`❌ Execution failed: ${data.message}`);
        setShowResults(true);
      }

    } catch (error: any) {
      console.error('❌ Execution error:', error);
      
      const errorResult = {
        success: false,
        message: error.message || 'Execution failed',
        error: error.message
      };
      
      setExecutionResult(errorResult);
      setShowResults(true);
      
      toast.error(`💥 Execution error: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const formatDuration = (durationMs: number) => {
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  return (
    <>
      <Button
        onClick={handleExecute}
        disabled={disabled || isExecuting}
        className={`${className} ${
          isExecuting ? 'bg-gradient-to-r from-orange-500 to-red-500' : 
          'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
        } text-white shadow-lg hover:shadow-xl transition-all duration-200`}
      >
        {isExecuting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Execute Now
          </>
        )}
      </Button>

      {/* Execution Results Modal */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {executionResult?.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Execution Results - {automationName}
            </DialogTitle>
          </DialogHeader>
          
          {executionResult && (
            <div className="space-y-4">
              {/* Status Overview */}
              <div className={`p-4 rounded-lg border ${
                executionResult.success 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {executionResult.success ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-semibold">
                    {executionResult.success ? 'Execution Successful' : 'Execution Failed'}
                  </span>
                </div>
                <p>{executionResult.message}</p>
                
                {executionResult.duration_ms && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Duration: {formatDuration(executionResult.duration_ms)}</span>
                  </div>
                )}
              </div>

              {/* Execution Details */}
              {executionResult.details && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Execution Details</h4>
                  
                  {executionResult.details.steps && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-700">Steps Executed:</h5>
                      {executionResult.details.steps.map((step: any, index: number) => (
                        <div key={index} className={`p-3 rounded border ${
                          step.status === 'success' 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              Step {step.step_number}: {step.step_name}
                            </span>
                            <div className="flex items-center gap-2">
                              {step.real_api_call && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  <Zap className="h-3 w-3 inline mr-1" />
                                  Real API
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                step.status === 'success' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {step.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p><strong>Platform:</strong> {step.platform}</p>
                            {step.api_endpoint && (
                              <p><strong>API Endpoint:</strong> {step.api_endpoint}</p>
                            )}
                            {step.response_status && (
                              <p><strong>Response Status:</strong> {step.response_status}</p>
                            )}
                            {step.error && (
                              <p className="text-red-600"><strong>Error:</strong> {step.error}</p>
                            )}
                          </div>
                          
                          {step.result && typeof step.result === 'object' && (
                            <div className="mt-2">
                              <details className="text-xs">
                                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                  View API Response
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                                  {JSON.stringify(step.result, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Execution Metadata */}
                  <div className="bg-gray-50 p-3 rounded border">
                    <h5 className="font-medium text-gray-700 mb-2">Execution Metadata</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      {executionResult.run_id && (
                        <p><strong>Run ID:</strong> {executionResult.run_id}</p>
                      )}
                      {executionResult.details.started_at && (
                        <p><strong>Started:</strong> {new Date(executionResult.details.started_at).toLocaleString()}</p>
                      )}
                      {executionResult.details.real_execution && (
                        <p className="text-green-600">
                          <Zap className="h-4 w-4 inline mr-1" />
                          <strong>Real API Execution Confirmed</strong>
                        </p>
                      )}
                      {executionResult.details.validated_credentials && (
                        <p className="text-blue-600">
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          <strong>Using Validated Credentials</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RealAutomationExecuteButton;
