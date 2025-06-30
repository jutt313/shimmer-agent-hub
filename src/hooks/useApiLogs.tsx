
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ApiLog, ApiError } from '@/types/personalApi';

export const useApiLogs = (userId?: string) => {
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiErrors, setApiErrors] = useState<ApiError[]>([]);

  const fetchApiLogs = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setApiLogs(data || []);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  }, [userId]);

  const fetchApiErrors = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setApiErrors(data || []);
    } catch (error) {
      console.error('Error fetching API errors:', error);
    }
  }, [userId]);

  return {
    apiLogs,
    apiErrors,
    fetchApiLogs,
    fetchApiErrors
  };
};
