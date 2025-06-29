
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
  automation?: {
    title: string;
    status: string;
  };
}

export interface Automation {
  id: string;
  title: string;
  status: string;
}

export const useWebhookEvents = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Predefined event types for dropdown
  const eventTypes = [
    'payment_completed',
    'user_registered',
    'order_created',
    'subscription_cancelled',
    'form_submitted',
    'email_opened',
    'link_clicked',
    'file_uploaded',
    'task_completed',
    'notification_sent'
  ];

  useEffect(() => {
    if (user) {
      fetchWebhookEvents();
      fetchAutomations();
    }
  }, [user]);

  const fetchAutomations = async () => {
    try {
      const { data, error } = await supabase
        .from('automations')
        .select('id, title, status')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setAutomations(data || []);
    } catch (error) {
      console.error('Error fetching automations:', error);
      toast({
        title: "Error",
        description: "Failed to load automations",
        variant: "destructive",
      });
    }
  };

  const fetchWebhookEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_events')
        .select(`
          *,
          automations!inner(title, status)
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
        .select(`
          *,
          automations!inner(title, status)
        `)
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
    automations,
    eventTypes,
    loading,
    createWebhookEvent,
    toggleWebhookStatus,
    deleteWebhookEvent,
    refetch: fetchWebhookEvents
  };
};
