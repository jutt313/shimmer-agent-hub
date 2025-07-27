
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SimpleExecuteButtonProps {
  automationId: string;
  isReady: boolean;
  onExecutionStart?: () => void;
  onExecutionComplete?: (success: boolean) => void;
}

const SimpleExecuteButton: React.FC<SimpleExecuteButtonProps> = ({
  automationId,
  isReady,
  onExecutionStart,
  onExecutionComplete
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecutionSuccess, setLastExecutionSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleExecute = async () => {
    if (!isReady) {
      toast({
        title: "Not Ready",
        description: "Please configure all required credentials first.",
        variant: "destructive",
      });
      return; // CRITICAL FIX: Added missing return statement
    }

    setIsExecuting(true);
    setLastExecutionSuccess(null);
    onExecutionStart?.();

    try {
      console.log('🚀 Executing automation:', automationId);
      
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: { automationId }
      });

      if (error) throw error;

      const success = data?.success || false;
      setLastExecutionSuccess(success);
      
      toast({
        title: success ? "✅ Execution Successful" : "❌ Execution Failed",
        description: data?.message || `Automation ${success ? 'completed' : 'failed'}`,
        variant: success ? "default" : "destructive",
      });

      onExecutionComplete?.(success);
    } catch (error: any) {
      console.error('❌ Execution error:', error);
      setLastExecutionSuccess(false);
      
      toast({
        title: "Execution Error",
        description: error.message || "Failed to execute automation",
        variant: "destructive",
      });

      onExecutionComplete?.(false);
    } finally {
      setIsExecuting(false);
    }
  };

  const getButtonStyle = () => {
    if (lastExecutionSuccess === true) {
      return "bg-green-500 hover:bg-green-600 text-white";
    } else if (lastExecutionSuccess === false) {
      return "bg-red-500 hover:bg-red-600 text-white";
    } else if (isReady) {
      return "bg-blue-500 hover:bg-blue-600 text-white";
    } else {
      return "bg-gray-400 cursor-not-allowed text-white";
    }
  };

  const getButtonIcon = () => {
    if (isExecuting) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    } else if (lastExecutionSuccess === true) {
      return <CheckCircle2 className="w-4 h-4" />;
    } else {
      return <Play className="w-4 h-4" />;
    }
  };

  const getButtonText = () => {
    if (isExecuting) {
      return "Executing...";
    } else if (lastExecutionSuccess === true) {
      return "Executed Successfully";
    } else if (lastExecutionSuccess === false) {
      return "Execution Failed - Retry";
    } else if (isReady) {
      return "Execute Automation";
    } else {
      return "Setup Required";
    }
  };

  return (
    <Button
      onClick={handleExecute}
      disabled={isExecuting || (!isReady && lastExecutionSuccess !== false)}
      className={`${getButtonStyle()} transition-all duration-200 flex items-center gap-2`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
};

export default SimpleExecuteButton;
