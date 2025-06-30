
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApiUsageData } from '@/types/personalApi';

export const useApiUsage = (userId?: string) => {
  const [usageData, setUsageData] = useState<ApiUsageData[]>([]);

  const fetchUsageData = useCallback(async () => {
    if (!userId) return;

    try {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group data by hour
      const groupedData: { [key: string]: { calls: number; success: number; errors: number } } = {};
      
      (data || []).forEach(log => {
        const date = new Date(log.created_at);
        const key = `${date.getHours()}:00`;
        
        if (!groupedData[key]) {
          groupedData[key] = { calls: 0, success: 0, errors: 0 };
        }
        
        groupedData[key].calls++;
        if (log.status_code >= 200 && log.status_code < 300) {
          groupedData[key].success++;
        } else {
          groupedData[key].errors++;
        }
      });

      const chartData = Object.entries(groupedData).map(([date, stats]) => ({
        date,
        ...stats
      }));

      setUsageData(chartData);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  }, [userId]);

  return { usageData, fetchUsageData };
};
