
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface DashboardStats {
  totalCalls: number;
  successRate: number;
  activeWebhooks: number;
  totalErrors: number;
}

export interface ApiUsageData {
  date: string;
  calls: number;
  success: number;
  errors: number;
}

export interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
  user_id: string;
}

export interface ApiError {
  id: string;
  error_type: string;
  error_message: string;
  endpoint?: string;
  created_at: string;
  stack_trace?: string;
  context?: any;
  severity: string;
}

export const usePersonalApiDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    successRate: 0,
    activeWebhooks: 0,
    totalErrors: 0
  });
  
  const [usageData, setUsageData] = useState<ApiUsageData[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [apiErrors, setApiErrors] = useState<ApiError[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      setupRealTimeSubscriptions();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUsageData('24h'),
        fetchApiLogs(),
        fetchApiErrors()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total API calls
      const { count: totalCalls } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get successful calls
      const { count: successfulCalls } = await supabase
        .from('api_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('status_code', 200)
        .lt('status_code', 300);

      // Get active webhooks
      const { count: activeWebhooks } = await supabase
        .from('webhook_events')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get total errors
      const { count: totalErrors } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const successRate = totalCalls && totalCalls > 0 
        ? Math.round((successfulCalls || 0) / totalCalls * 100) 
        : 0;

      setStats({
        totalCalls: totalCalls || 0,
        successRate,
        activeWebhooks: activeWebhooks || 0,
        totalErrors: totalErrors || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsageData = async (period: '24h' | '7d' | '30d') => {
    try {
      const periodHours = period === '24h' ? 24 : period === '7d' ? 168 : 720;
      const startDate = new Date(Date.now() - periodHours * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group data by time periods
      const groupedData: { [key: string]: { calls: number; success: number; errors: number } } = {};
      
      (data || []).forEach(log => {
        const date = new Date(log.created_at);
        const key = period === '24h' 
          ? `${date.getHours()}:00`
          : date.toISOString().split('T')[0];
        
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
  };

  const fetchApiLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setApiLogs(data || []);
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  };

  const fetchApiErrors = async () => {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setApiErrors(data || []);
    } catch (error) {
      console.error('Error fetching API errors:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    console.log('Setting up real-time subscriptions for API dashboard');
    
    const channel = supabase
      .channel('personal-api-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'api_usage_logs',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        console.log('New API usage log:', payload);
        fetchStats();
        fetchApiLogs();
        fetchUsageData('24h');
        
        // Show real-time notification
        toast({
          title: "New API Call",
          description: `${payload.new.method} ${payload.new.endpoint} - ${payload.new.status_code}`,
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'error_logs',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        console.log('New error log:', payload);
        fetchStats();
        fetchApiErrors();
        
        // Show error notification
        toast({
          title: "API Error Detected",
          description: payload.new.error_message,
          variant: "destructive",
        });
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'webhook_events'
      }, () => {
        console.log('Webhook events updated');
        fetchStats();
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  };

  const testApiCall = async (endpoint: string, method: string, payload?: any, apiToken?: string) => {
    try {
      const baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/yusrai-api';
      const url = `${baseUrl}${endpoint}`;
      
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        }
      };

      if (method !== 'GET' && payload) {
        options.body = JSON.stringify(payload);
      }

      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = await response.json();
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: result,
        responseTime
      };

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  const createAutomationViaAPI = async (automationData: any, apiToken: string) => {
    return await testApiCall('/automations', 'POST', automationData, apiToken);
  };

  return {
    stats,
    usageData,
    apiLogs,
    apiErrors,
    loading,
    fetchDashboardData,
    fetchUsageData,
    fetchApiLogs,
    fetchApiErrors,
    testApiCall,
    createAutomationViaAPI,
    setupRealTimeSubscriptions
  };
};
