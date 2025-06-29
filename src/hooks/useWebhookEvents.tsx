
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface WebhookEvent {
  id: string;
  automation_id: string;
  event_type: string;
  event_description: string | null;
  webhook_url: string;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useWebhookEvents = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchWebhookEvents();
    }
  }, [user]);

  const fetchWebhookEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select(`
          *,
          automations!inner(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhookEvents(data || []);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      toast({
        title: "Error",
        description: "Failed to load webhook events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWebhookEvent = async (webhookData: {
    automation_id: string;
    event_type: string;
    event_description: string;
  }) => {
    try {
      const webhookUrl = `https://yusrai.com/api/webhooks/${crypto.randomUUID()}`;
      
      const { data, error } = await supabase
        .from('webhook_events')
        .insert({
          ...webhookData,
          webhook_url: webhookUrl,
        })
        .select()
        .single();

      if (error) throw error;

      setWebhookEvents(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Webhook created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleWebhookStatus = async (webhookId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('webhook_events')
        .update({ is_active: !isActive })
        .eq('id', webhookId);

      if (error) throw error;

      setWebhookEvents(prev => 
        prev.map(webhook => 
          webhook.id === webhookId ? { ...webhook, is_active: !isActive } : webhook
        )
      );
      
      toast({
        title: "Success",
        description: `Webhook ${!isActive ? 'activated' : 'deactivated'}`,
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

  const deleteWebhookEvent = async (webhookId: string) => {
    try {
      const { error } = await supabase
        .from('webhook_events')
        .delete()
        .eq('id', webhookId);

      if (error) throw error;

      setWebhookEvents(prev => prev.filter(webhook => webhook.id !== webhookId));
      
      toast({
        title: "Success",
        description: "Webhook deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    }
  };

  return {
    webhookEvents,
    loading,
    createWebhookEvent,
    toggleWebhookStatus,
    deleteWebhookEvent,
    refetch: fetchWebhookEvents
  };
};
