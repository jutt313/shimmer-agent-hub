
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useApiStats } from './useApiStats';
import { useApiLogs } from './useApiLogs';
import { useApiUsage } from './useApiUsage';
import { useApiTesting } from './useApiTesting';
import { hashToken, parsePermissions } from '@/services/personalApiService';
import { ApiToken } from '@/types/personalApi';

export const usePersonalApiDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [realtimeWebhookUrl, setRealtimeWebhookUrl] = useState('');

  // Use the smaller hooks
  const { stats, fetchStats } = useApiStats(user?.id);
  const { apiLogs, apiErrors, fetchApiLogs, fetchApiErrors } = useApiLogs(user?.id);
  const { usageData, fetchUsageData } = useApiUsage(user?.id);
  const apiTesting = useApiTesting();

  const fetchTokens = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedTokens: ApiToken[] = (data || []).map(token => ({
        ...token,
        permissions: parsePermissions(token.permissions),
        usage_count: token.usage_count || 0,
      }));
      
      setTokens(transformedTokens);

      if (user.id) {
        setRealtimeWebhookUrl(`https://usr.com/api/realtime-webhook/${user.id}?events=automation_created,automation_executed,account_updated,notification_sent,user_login,api_call_made,automation_error,automation_updated,webhook_received`);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  }, [user?.id]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchTokens(),
        fetchStats(),
        fetchUsageData(),
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
  }, [user, toast, fetchTokens, fetchStats, fetchUsageData, fetchApiLogs, fetchApiErrors]);

  const createToken = async (tokenForm: {
    name: string;
    description: string;
    purpose: string;
    permissions: any;
  }) => {
    try {
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_api_token');

      if (tokenError) throw tokenError;

      const yusrToken = `YUSR_${tokenResult}`;
      const tokenHash = await hashToken(yusrToken);

      const { data, error } = await supabase
        .from('user_api_tokens')
        .insert({
          user_id: user?.id,
          token_name: tokenForm.name,
          token_description: tokenForm.description,
          connection_purpose: tokenForm.purpose,
          token_hash: tokenHash,
          token_type: 'user',
          permissions: tokenForm.permissions
        })
        .select()
        .single();

      if (error) throw error;

      const transformedToken: ApiToken = {
        ...data,
        permissions: tokenForm.permissions,
        usage_count: data.usage_count || 0,
      };

      setTokens(prev => [transformedToken, ...prev]);
      
      toast({
        title: "Success",
        description: `API token created successfully. Token: ${yusrToken}`,
      });

      return yusrToken;
    } catch (error) {
      console.error('Error creating API token:', error);
      toast({
        title: "Error",
        description: "Failed to create API token",
        variant: "destructive",
      });
      return null;
    }
  };

  const setupRealTimeSubscriptions = useCallback(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscriptions for API dashboard');
    
    const channel = supabase
      .channel('personal-api-dashboard')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'api_usage_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('New API usage log:', payload);
        fetchStats();
        fetchApiLogs();
        fetchUsageData();
        
        toast({
          title: "New API Call",
          description: `${payload.new.method} ${payload.new.endpoint} - ${payload.new.status_code}`,
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'error_logs',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('New error log:', payload);
        fetchStats();
        fetchApiErrors();
        
        toast({
          title: "API Error Detected",
          description: payload.new.error_message,
          variant: "destructive",
        });
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchStats, fetchApiLogs, fetchUsageData, fetchApiErrors, toast]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      setupRealTimeSubscriptions();
    }
  }, [user, fetchDashboardData, setupRealTimeSubscriptions]);

  return {
    // Data
    stats,
    usageData,
    apiLogs,
    apiErrors,
    tokens,
    realtimeWebhookUrl,
    loading,
    
    // Functions
    fetchDashboardData,
    createToken,
    
    // API Testing
    ...apiTesting
  };
};
