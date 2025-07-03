
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { automationRunner } from '@/utils/automationRunner';
import { AutomationBlueprint } from '@/types/automation';

interface AutomationExecuteButtonProps {
  automationId: string;
  blueprint: AutomationBlueprint;
  disabled?: boolean;
  onExecutionComplete?: (result: any) => void;
}

const AutomationExecuteButton = ({ 
  automationId, 
  blueprint, 
  disabled = false,
  onExecutionComplete 
}: AutomationExecuteButtonProps) => {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (isExecuting) return;

    setIsExecuting(true);
    toast.info('🚀 Starting automation execution...');

    try {
      const result = await automationRunner.executeAutomation(
        automationId,
        blueprint,
        { trigger_type: 'manual', triggered_by: 'user', timestamp: new Date().toISOString() }
      );

      if (result.success) {
        toast.success(
          `✅ Automation completed successfully in ${result.duration}ms`,
          {
            description: `Executed ${result.results.length} steps`
          }
        );
      } else {
        toast.error(
          `❌ Automation failed after ${result.duration}ms`,
          {
            description: result.errors.join(', ')
          }
        );
      }

      onExecutionComplete?.(result);
    } catch (error: any) {
      console.error('Automation execution error:', error);
      toast.error('💥 Automation execution failed', {
        description: error.message
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Button
      onClick={handleExecute}
      disabled={disabled || isExecuting}
      className={`${
        isExecuting
          ? 'bg-orange-500 hover:bg-orange-600'
          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
      } text-white rounded-xl`}
    >
      {isExecuting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Executing...
        </>
      ) : (
        <>
          <Play className="w-4 h-4 mr-2" />
          Execute Automation
        </>
      )}
    </Button>
  );
};

export default AutomationExecuteButton;
