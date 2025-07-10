
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UsageLimits {
  maxAutomations: number;
  maxTotalRuns: number;
  maxStepRuns: number;
  maxAiAgents: number;
  maxPlatformIntegrations: number;
  currentUsage: {
    automations: number;
    totalRuns: number;
    stepRuns: number;
    aiAgents: number;
    platformIntegrations: number;
  };
  planType: string;
  isTrialActive: boolean;
  trialEndsAt: string | null;
}

const PLAN_LIMITS = {
  starter: {
    maxAutomations: 15,
    maxTotalRuns: 2500,
    maxStepRuns: 50000, // 50K step runs
    maxAiAgents: 15,
    maxPlatformIntegrations: 60
  },
  professional: {
    maxAutomations: 25,
    maxTotalRuns: 10000,
    maxStepRuns: 100000, // 100K step runs
    maxAiAgents: 25,
    maxPlatformIntegrations: 130
  },
  business: {
    maxAutomations: 75,
    maxTotalRuns: 50000,
    maxStepRuns: 300000, // 300K step runs
    maxAiAgents: 75,
    maxPlatformIntegrations: 300
  },
  enterprise: {
    maxAutomations: 150,
    maxTotalRuns: 150000,
    maxStepRuns: 1000000, // 1M step runs
    maxAiAgents: 150,
    maxPlatformIntegrations: 500
  },
  special: {
    maxAutomations: 25,
    maxTotalRuns: 25000,
    maxStepRuns: 500000, // 500K step runs
    maxAiAgents: 25,
    maxPlatformIntegrations: 200
  }
};

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

      // Get current platform integrations count
      const { data: platformCredentials, error: platformError } = await supabase
        .from('platform_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (platformError) throw platformError;

      // Check if trial is active
      const now = new Date();
      const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
      const isTrialActive = trialEnd ? now < trialEnd : false;

      const planLimits = PLAN_LIMITS[subscription.plan_type as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;

      setLimits({
        maxAutomations: planLimits.maxAutomations,
        maxTotalRuns: planLimits.maxTotalRuns,
        maxStepRuns: planLimits.maxStepRuns,
        maxAiAgents: planLimits.maxAiAgents,
        maxPlatformIntegrations: planLimits.maxPlatformIntegrations,
        currentUsage: {
          automations: usage.active_automations_count,
          totalRuns: usage.total_runs_used,
          stepRuns: usage.step_runs_used,
          aiAgents: usage.active_ai_agents_count,
          platformIntegrations: platformCredentials?.length || 0,
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

  const checkLimit = (type: 'automations' | 'aiAgents' | 'platformIntegrations') => {
    if (!limits) return false;

    const current = limits.currentUsage[type];
    let max: number;
    
    switch (type) {
      case 'automations':
        max = limits.maxAutomations;
        break;
      case 'aiAgents':
        max = limits.maxAiAgents;
        break;
      case 'platformIntegrations':
        max = limits.maxPlatformIntegrations;
        break;
      default:
        return false;
    }

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
