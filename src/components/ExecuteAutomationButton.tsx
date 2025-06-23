
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createNotification, notificationTemplates } from "@/utils/notificationHelpers";
import { useAuth } from "@/contexts/AuthContext";

interface ExecuteAutomationButtonProps {
  automationId: string;
  automationTitle: string;
  disabled?: boolean;
}

const ExecuteAutomationButton = ({ 
  automationId, 
  automationTitle, 
  disabled = false 
}: ExecuteAutomationButtonProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleExecute = async () => {
    if (!automationId || isExecuting || !user?.id) return;

    setIsExecuting(true);
    
    try {
      console.log('🚀 Executing automation:', automationId);
      
      // Create notification for automation start
      const startTemplate = notificationTemplates.automationRunStarted(automationTitle);
      await createNotification(
        user.id,
        startTemplate.title,
        startTemplate.message,
        startTemplate.type,
        startTemplate.category,
        { automation_id: automationId, automation_title: automationTitle }
      );
      
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          trigger_data: {
            executed_at: new Date().toISOString(),
            trigger_type: 'manual'
          }
        }
      });

      if (error) {
        // Create notification for automation failure
        const failTemplate = notificationTemplates.automationRunFailed(automationTitle, error.message);
        await createNotification(
          user.id,
          failTemplate.title,
          failTemplate.message,
          failTemplate.type,
          failTemplate.category,
          { automation_id: automationId, automation_title: automationTitle, error: error.message }
        );
        throw error;
      }

      // Create notification for automation success
      const successTemplate = notificationTemplates.automationRunCompleted(automationTitle);
      await createNotification(
        user.id,
        successTemplate.title,
        successTemplate.message,
        successTemplate.type,
        successTemplate.category,
        { automation_id: automationId, automation_title: automationTitle, run_id: data.run_id }
      );

      toast({
        title: "Automation Started",
        description: `Automation execution started successfully. Run ID: ${data.run_id}`,
      });

      console.log('✅ Automation execution started:', data);

    } catch (error: any) {
      console.error('❌ Failed to execute automation:', error);
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to start automation execution",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Button
      onClick={handleExecute}
      disabled={disabled || isExecuting}
      className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 border-0"
      style={{
        boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
      }}
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

export default ExecuteAutomationButton;
