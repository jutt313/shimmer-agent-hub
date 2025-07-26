/**
 * EXECUTION READY BUTTON - Shows when all credentials are tested and agents are handled
 * Connected to headquarters for execution coordination
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle2 } from 'lucide-react';
import { automationDataHub } from '@/utils/automationDataHub';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ExecutionReadyButtonProps {
  automationId: string;
  userId: string;
  blueprintData: any;
  isReady: boolean;
  onExecutionStart?: () => void;
  onExecutionComplete?: (result: any) => void;
}

const ExecutionReadyButton: React.FC<ExecutionReadyButtonProps> = ({
  automationId,
  userId,
  blueprintData,
  isReady,
  onExecutionStart,
  onExecutionComplete
}) => {
  const { toast } = useToast();

  const handleExecution = async () => {
    if (!isReady || !blueprintData) {
      toast({
        title: "Not Ready",
        description: "Please configure all platform credentials first",
        variant: "destructive",
      });
      return;
    }

    try {
      if (onExecutionStart) {
        onExecutionStart();
      }

      console.log('🚀 Executing automation via headquarters...');

      // Use supabase edge function for execution
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          user_id: userId,
          automation_data: blueprintData,
          trigger_data: {
            executed_at: new Date().toISOString(),
            trigger_type: 'manual',
            triggered_by: userId
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "🎉 Automation Executed!",
        description: `Automation completed successfully. Run ID: ${data.run_id}`,
      });

      if (onExecutionComplete) {
        onExecutionComplete(data);
      }

    } catch (error: any) {
      console.error('💥 Execution error:', error);
      toast({
        title: "Execution Error",
        description: error.message || "An unexpected error occurred during execution",
        variant: "destructive",
      });
    }
  };

  if (!isReady) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-2 text-sm text-yellow-700">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span>Configure platform credentials to enable execution</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">🚀 Automation Ready!</h3>
            <p className="text-sm text-green-700">All platforms configured. Ready for execution.</p>
          </div>
        </div>
        <Button
          onClick={handleExecution}
          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3"
          size="lg"
        >
          <Play className="w-4 h-4 mr-2" />
          Execute Automation
          <Badge variant="secondary" className="ml-2 bg-white/20">
            Manual
          </Badge>
        </Button>
      </div>
    </div>
  );
};

export default ExecutionReadyButton;