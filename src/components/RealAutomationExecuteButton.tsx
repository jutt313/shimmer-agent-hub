
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealAutomationExecuteButtonProps {
  automationId: string;
  automationTitle: string;
  triggerData?: any;
  onExecutionComplete?: (result: any) => void;
}

const RealAutomationExecuteButton = ({
  automationId,
  automationTitle,
  triggerData,
  onExecutionComplete
}: RealAutomationExecuteButtonProps) => {
  const { user } = useAuth();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const handleExecute = async () => {
    if (!user) {
      toast.error('Please log in to execute automations');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      console.log(`🚀 REAL EXECUTION: Starting ${automationTitle}`);
      
      // Call the real execution function
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          user_id: user.id,
          trigger_data: triggerData || {}
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`📊 REAL EXECUTION RESULT:`, data);
      setExecutionResult(data);

      if (data.success) {
        toast.success(`✅ ${automationTitle} executed successfully with real API calls!`);
      } else {
        toast.error(`❌ Execution failed: ${data.message}`);
      }

      onExecutionComplete?.(data);

    } catch (error: any) {
      console.error('💥 Real execution error:', error);
      const errorResult = {
        success: false,
        message: `Execution failed: ${error.message}`,
        error: error.message
      };
      setExecutionResult(errorResult);
      toast.error(`💥 Execution error: ${error.message}`);
      onExecutionComplete?.(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleExecute}
        disabled={isExecuting}
        className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
      >
        {isExecuting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Executing with Real APIs...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            <Zap className="w-3 h-3 mr-1" />
            Execute with Real API Calls
          </>
        )}
      </Button>

      {executionResult && (
        <div className={`p-3 rounded-xl border ${
          executionResult.success 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {executionResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{executionResult.message}</span>
          </div>
          
          {executionResult.run_id && (
            <p className="text-xs">Run ID: {executionResult.run_id}</p>
          )}
          
          {executionResult.duration_ms && (
            <p className="text-xs">Duration: {executionResult.duration_ms}ms</p>
          )}
          
          {executionResult.details?.real_execution && (
            <div className="mt-2 text-xs">
              🌟 Real automation execution with tested credentials completed
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealAutomationExecuteButton;
