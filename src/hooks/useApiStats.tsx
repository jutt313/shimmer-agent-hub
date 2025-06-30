
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/types/personalApi';

export const useApiStats = (userId?: string) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    successRate: 0,
    activeWebhooks: 0,
    totalErrors: 0
  });

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      // Get total API calls
      const { count: totalCalls } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get successful calls
      const { count: successfulCalls } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('status_code', 200)
        .lt('status_code', 300);

      // Get total errors
      const { count: totalErrors } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const successRate = totalCalls && totalCalls > 0 
        ? Math.round((successfulCalls || 0) / totalCalls * 100) 
        : 0;

      setStats({
        totalCalls: totalCalls || 0,
        successRate,
        activeWebhooks: 1, // Always 1 real-time webhook
        totalErrors: totalErrors || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [userId]);

  return { stats, fetchStats };
};
