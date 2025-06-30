
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AutomationWebhook {
  id: string;
  automation_id: string;
  webhook_name: string;
  webhook_description?: string;
  webhook_url: string;
  webhook_secret: string;
  expected_events: string[];
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
  delivery_stats?: {
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    success_rate: number;
    avg_response_time: number;
  };
  recent_deliveries?: any[];
}

export const useAutomationWebhooks = (automationId?: string) => {
  const [webhooks, setWebhooks] = useState<AutomationWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && automationId) {
      fetchWebhooks();
    }
  }, [user, automationId]);

  const fetchWebhooks = async () => {
    if (!automationId) return;

    try {
      const { data: webhookData, error } = await supabase
        .from('automation_webhooks')
        .select('*')
        .eq('automation_id', automationId);

      if (error) throw error;

      // Fetch delivery stats for each webhook
      const webhooksWithStats = await Promise.all(
        (webhookData || []).map(async (webhook) => {
          const deliveryStats = await fetchDeliveryStats(webhook.id);
          const recentDeliveries = await fetchRecentDeliveries(webhook.id);
          
          return {
            ...webhook,
            delivery_stats: deliveryStats,
            recent_deliveries: recentDeliveries
          };
        })
      );

      setWebhooks(webhooksWithStats);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load webhook data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryStats = async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('status_code, delivered_at, created_at')
        .eq('automation_webhook_id', webhookId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;

      const totalDeliveries = data?.length || 0;
      const successfulDeliveries = data?.filter(d => d.delivered_at !== null).length || 0;
      const failedDeliveries = totalDeliveries - successfulDeliveries;
      const successRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

      return {
        total_deliveries: totalDeliveries,
        successful_deliveries: successfulDeliveries,
        failed_deliveries: failedDeliveries,
        success_rate: Math.round(successRate),
        avg_response_time: 1200 // Default placeholder
      };
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      return {
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
        success_rate: 0,
        avg_response_time: 0
      };
    }
  };

  const fetchRecentDeliveries = async (webhookId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_delivery_logs')
        .select('*')
        .eq('automation_webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent deliveries:', error);
      return [];
    }
  };

  const toggleWebhookStatus = async (webhookId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('automation_webhooks')
        .update({ is_active: !currentStatus })
        .eq('id', webhookId);

      if (error) throw error;

      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === webhookId 
            ? { ...webhook, is_active: !currentStatus }
            : webhook
        )
      );

      toast({
        title: "Success",
        description: `Webhook ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling webhook status:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      });
    }
  };

  return {
    webhooks,
    loading,
    toggleWebhookStatus,
    refetch: fetchWebhooks
  };
};
