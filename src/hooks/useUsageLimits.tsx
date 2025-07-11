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
    maxStepRuns: 50000,
    maxAiAgents: 15,
    maxPlatformIntegrations: 60
  },
  professional: {
    maxAutomations: 25,
    maxTotalRuns: 10000,
    maxStepRuns: 100000,
    maxAiAgents: 25,
    maxPlatformIntegrations: 130
  },
  business: {
    maxAutomations: 75,
    maxTotalRuns: 50000,
    maxStepRuns: 300000,
    maxAiAgents: 75,
    maxPlatformIntegrations: 300
  },
  enterprise: {
    maxAutomations: 150,
    maxTotalRuns: 150000,
    maxStepRuns: 1000000,
    maxAiAgents: 150,
    maxPlatformIntegrations: 500
  },
  special: {
    maxAutomations: 25,
    maxTotalRuns: 25000,
    maxStepRuns: 500000,
    maxAiAgents: 25,
    maxPlatformIntegrations: 200
  }
};

export const useUsageLimits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeUserData = async () => {
    if (!user) return;

    try {
      console.log('Initializing user data for:', user.id);

      // Check if subscription exists, if not create it
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingSubscription) {
        console.log('Creating subscription for new user');
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_type: 'professional',
            monthly_price: 0.00,
            max_automations: 15,
            max_total_runs: 10000,
            max_step_runs: 5000,
            max_ai_agents: 15,
            trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          });

        if (subError) {
          console.error('Error creating subscription:', subError);
        }
      }

      // Check if usage tracking exists, if not create it
      const { data: existingUsage } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingUsage) {
        console.log('Creating usage tracking for new user');
        const { error: usageError } = await supabase
          .from('usage_tracking')
          .insert({
            user_id: user.id,
            active_automations_count: 0,
            total_runs_used: 0,
            step_runs_used: 0,
            active_ai_agents_count: 0
          });

        if (usageError) {
          console.error('Error creating usage tracking:', usageError);
        }
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  const fetchLimits = async () => {
    if (!user) return;

    try {
      // First, try to initialize user data
      await initializeUserData();

      // Get user subscription with fallback
      let subscription;
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError || !subData) {
        console.log('Using fallback subscription data');
        subscription = {
          plan_type: 'professional',
          trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      } else {
        subscription = subData;
      }

      // Get current usage with fallback
      let usage;
      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usageError || !usageData) {
        console.log('Using fallback usage data');
        usage = {
          active_automations_count: 0,
          total_runs_used: 0,
          step_runs_used: 0,
          active_ai_agents_count: 0
        };
      } else {
        usage = usageData;
      }

      // Get current platform integrations count
      const { data: platformCredentials, error: platformError } = await supabase
        .from('platform_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (platformError) {
        console.error('Error fetching platform credentials:', platformError);
      }

      // Check if trial is active
      const now = new Date();
      const trialEnd = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
      const isTrialActive = trialEnd ? now < trialEnd : false;

      const planLimits = PLAN_LIMITS[subscription.plan_type as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.professional;

      setLimits({
        maxAutomations: planLimits.maxAutomations,
        maxTotalRuns: planLimits.maxTotalRuns,
        maxStepRuns: planLimits.maxStepRuns,
        maxAiAgents: planLimits.maxAiAgents,
        maxPlatformIntegrations: planLimits.maxPlatformIntegrations,
        currentUsage: {
          automations: usage.active_automations_count || 0,
          totalRuns: usage.total_runs_used || 0,
          stepRuns: usage.step_runs_used || 0,
          aiAgents: usage.active_ai_agents_count || 0,
          platformIntegrations: platformCredentials?.length || 0,
        },
        planType: subscription.plan_type,
        isTrialActive,
        trialEndsAt: subscription.trial_ends_at,
      });

    } catch (error) {
      console.error('Error fetching usage limits:', error);
      
      // Provide fallback data instead of showing error
      const fallbackLimits = PLAN_LIMITS.professional;
      setLimits({
        maxAutomations: fallbackLimits.maxAutomations,
        maxTotalRuns: fallbackLimits.maxTotalRuns,
        maxStepRuns: fallbackLimits.maxStepRuns,
        maxAiAgents: fallbackLimits.maxAiAgents,
        maxPlatformIntegrations: fallbackLimits.maxPlatformIntegrations,
        currentUsage: {
          automations: 0,
          totalRuns: 0,
          stepRuns: 0,
          aiAgents: 0,
          platformIntegrations: 0,
        },
        planType: 'professional',
        isTrialActive: true,
        trialEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      toast({
        title: "Usage Data Initialized",
        description: "Your account has been set up with default limits.",
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
