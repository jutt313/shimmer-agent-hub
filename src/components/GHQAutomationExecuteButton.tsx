/**
 * GHQ-INTEGRATED AUTOMATION EXECUTE BUTTON
 * Uses GHQ readiness validation and execution coordination
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { GHQ } from '@/utils/GHQ';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface GHQAutomationExecuteButtonProps {
  automationId: string;
  onExecutionComplete?: (result: any) => void;
  className?: string;
}

const GHQAutomationExecuteButton = ({ 
  automationId,
  onExecutionComplete,
  className = ""
}: GHQAutomationExecuteButtonProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [readinessStatus, setReadinessStatus] = useState<{
    isReady: boolean;
    credentialStatus: string;
    agentStatus: string;
    missingCredentials: string[];
    pendingAgents: string[];
  } | null>(null);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkReadiness();
  }, [automationId, user?.id]);

  const checkReadiness = async () => {
    if (!user?.id) return;

    setIsCheckingReadiness(true);
    try {
      const readiness = await GHQ.getExecutionReadiness(automationId, user.id);
      setReadinessStatus(readiness);
      console.log('🔍 GHQ Readiness Check:', readiness);
    } catch (error) {
      console.error('❌ Readiness check failed:', error);
    } finally {
      setIsCheckingReadiness(false);
    }
  };

  const handleExecute = async () => {
    if (!user?.id || isExecuting || !readinessStatus?.isReady) return;

    setIsExecuting(true);
    toast.info('🚀 Starting GHQ-validated automation execution...');

    try {
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: {
          automation_id: automationId,
          trigger_data: {
            trigger_type: 'manual',
            triggered_by: user.id,
            timestamp: new Date().toISOString(),
            gqh_validated: true
          }
        }
      });

      if (error) throw error;

      toast.success('🎉 Automation executed successfully!', {
        description: `Run ID: ${data.run_id}`
      });

      onExecutionComplete?.(data);

    } catch (error: any) {
      console.error('💥 GHQ execution error:', error);
      toast.error('❌ Execution failed', {
        description: error.message
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getButtonText = () => {
    if (isCheckingReadiness) return 'Checking...';
    if (isExecuting) return 'Executing...';
    if (!readinessStatus) return 'Check Readiness';
    if (readinessStatus.isReady) return 'Execute Automation';
    return 'Setup Required';
  };

  const getButtonIcon = () => {
    if (isCheckingReadiness || isExecuting) return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
    if (!readinessStatus) return <Clock className="w-4 h-4 mr-2" />;
    if (readinessStatus.isReady) return <Play className="w-4 h-4 mr-2" />;
    return <AlertCircle className="w-4 h-4 mr-2" />;
  };

  const getButtonVariant = () => {
    if (!readinessStatus) return 'outline';
    if (readinessStatus.isReady) return 'default';
    return 'destructive';
  };

  const getStatusMessage = () => {
    if (!readinessStatus) return '';
    
    const issues = [];
    if (readinessStatus.missingCredentials.length > 0) {
      issues.push(`Missing credentials: ${readinessStatus.missingCredentials.join(', ')}`);
    }
    if (readinessStatus.pendingAgents.length > 0) {
      issues.push(`Pending agent decisions: ${readinessStatus.pendingAgents.join(', ')}`);
    }
    
    return issues.join(' • ');
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={readinessStatus?.isReady ? handleExecute : checkReadiness}
        disabled={isExecuting || isCheckingReadiness}
        variant={getButtonVariant()}
        className={`w-full ${className}`}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
      
      {readinessStatus && !readinessStatus.isReady && (
        <div className="text-xs text-muted-foreground text-center">
          {getStatusMessage()}
        </div>
      )}
      
      {readinessStatus && (
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            {readinessStatus.credentialStatus === 'complete' ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
            <span>Credentials</span>
          </div>
          <div className="flex items-center gap-1">
            {readinessStatus.agentStatus === 'complete' ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : (
              <AlertCircle className="w-3 h-3 text-red-500" />
            )}
            <span>Agents</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GHQAutomationExecuteButton;