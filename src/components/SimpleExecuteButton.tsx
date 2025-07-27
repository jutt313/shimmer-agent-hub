import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
interface SimpleExecuteButtonProps {
  automationId: string;
  className?: string;
}
const SimpleExecuteButton = ({
  automationId,
  className = ""
}: SimpleExecuteButtonProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const {
    user
  } = useAuth();
  useEffect(() => {
    checkCredentialStatus();
  }, [automationId, user?.id]);
  const checkCredentialStatus = async () => {
    if (!user?.id || !automationId) return;
    try {
      const {
        data,
        error
      } = await supabase.from('automation_platform_credentials').select('platform_name').eq('automation_id', automationId).eq('user_id', user.id).eq('is_active', true);
      if (error) throw error;
      setHasCredentials(data && data.length > 0);
    } catch (error) {
      console.error('Failed to check credentials:', error);
      setHasCredentials(false);
    }
  };
  const handleExecute = async () => {
    if (!user?.id || isExecuting) return;
    setIsExecuting(true);
    toast.info('🚀 Starting automation execution...');
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          trigger_data: {
            trigger_type: 'manual',
            triggered_by: user.id,
            timestamp: new Date().toISOString()
          }
        }
      });
      if (error) throw error;
      toast.success('🎉 Automation executed successfully!', {
        description: `Run ID: ${data.run_id}`
      });
    } catch (error: any) {
      console.error('Execution error:', error);
      toast.error('❌ Execution failed', {
        description: error.message
      });
    } finally {
      setIsExecuting(false);
    }
  };
  const getButtonText = () => {
    if (isExecuting) return 'Executing...';
    if (!hasCredentials) return 'Setup Credentials First';
    return 'Execute Automation';
  };
  const getButtonIcon = () => {
    if (isExecuting) return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    if (!hasCredentials) return <AlertCircle className="w-4 h-4 mr-2" />;
    return <Play className="w-4 h-4 mr-2" />;
  };
  return;
};
export default SimpleExecuteButton;