
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UsageLimits {
  maxAutomations: number;
  maxTotalRuns: number;
  maxStepRuns: number;
  maxAiAgents: number;
  currentUsage: {
    automations: number;
    totalRuns: number;
    stepRuns: number;
    aiAgents: number;
  };
  planType: string;
  isTrialActive: boolean;
  trialEndsAt: string | null;
}

export const useUsageLimits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLimits = async () => {
    if (!user) return;

    try {
      // Get user subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) throw subError;

      // Get current usage
      const { data: usage, error: usageError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError) throw usageError;

      // Check if trial is active
      const now = new Date();
      const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
      const isTrialActive = trialEnd ? now < trialEnd : false;

      setLimits({
        maxAutomations: subscription.max_automations,
        maxTotalRuns: subscription.max_total_runs,
        maxStepRuns: subscription.max_step_runs,
        maxAiAgents: subscription.max_ai_agents,
        currentUsage: {
          automations: usage.active_automations_count,
          totalRuns: usage.total_runs_used,
          stepRuns: usage.step_runs_used,
          aiAgents: usage.active_ai_agents_count,
        },
        planType: subscription.plan_type,
        isTrialActive,
        trialEndsAt: subscription.trial_ends_at,
      });

    } catch (error) {
      console.error('Error fetching usage limits:', error);
      toast({
        title: "Error",
        description: "Failed to load usage limits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLimits();
    }
  }, [user]);

  const checkLimit = (type: 'automations' | 'aiAgents') => {
    if (!limits) return false;

    const current = limits.currentUsage[type];
    const max = type === 'automations' ? limits.maxAutomations : limits.maxAiAgents;

    if (current >= max) {
      toast({
        title: "Limit Reached",
        description: `You've reached your ${type} limit (${max}). Upgrade your plan to continue.`,
        variant: "destructive",
      });
      return false;
    }

    // Warn at 80%
    if (current >= max * 0.8) {
      toast({
        title: "Approaching Limit",
        description: `You're at ${current}/${max} ${type}. Consider upgrading soon.`,
      });
    }

    return true;
  };

  const updateUsage = async (type: 'automations' | 'totalRuns' | 'stepRuns' | 'aiAgents', increment: number = 1) => {
    if (!user) return;

    try {
      const fieldMap = {
        automations: 'active_automations_count',
        totalRuns: 'total_runs_used',
        stepRuns: 'step_runs_used',
        aiAgents: 'active_ai_agents_count'
      };

      const { error } = await supabase
        .from('usage_tracking')
        .update({
          [fieldMap[type]]: (limits?.currentUsage[type] || 0) + increment
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh limits
      await fetchLimits();
    } catch (error) {
      console.error('Error updating usage:', error);
    }
  };

  return {
    limits,
    loading,
    checkLimit,
    updateUsage,
    refreshLimits: fetchLimits,
  };
};
