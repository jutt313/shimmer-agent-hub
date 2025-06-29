
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface EnhancedDeveloperApp {
  id: string;
  app_name: string;
  app_description: string | null;
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  webhook_url: string | null;
  app_logo_url: string | null;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;
  homepage_url: string | null;
  developer_email: string | null;
  tool_description: string | null;
  use_cases: string[];
  supported_events: any;
  event_descriptions: any;
  is_active: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  rate_limit_per_hour: number;
  created_at: string;
  updated_at: string;
}

export const useEnhancedDeveloperApps = () => {
  const [apps, setApps] = useState<EnhancedDeveloperApp[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchApps();
    }
  }, [user]);

  const fetchApps = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setApps(data || []);
    } catch (error) {
      console.error('Error fetching developer apps:', error);
      toast({
        title: "Error",
        description: "Failed to load developer applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApp = async (appData: {
    app_name: string;
    app_description: string;
    redirect_uris: string[];
    webhook_url?: string;
    app_logo_url?: string;
    privacy_policy_url?: string;
    terms_of_service_url?: string;
    homepage_url?: string;
    developer_email?: string;
    tool_description?: string;
    use_cases?: string[];
    supported_events?: any;
    event_descriptions?: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('developer_integrations')
        .insert({
          user_id: user?.id,
          ...appData,
          redirect_uris: appData.redirect_uris.filter(uri => uri.trim()),
          use_cases: appData.use_cases || [],
          supported_events: appData.supported_events || [],
          event_descriptions: appData.event_descriptions || {},
        })
        .select()
        .single();

      if (error) throw error;

      setApps(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Developer application created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating developer app:', error);
      toast({
        title: "Error",
        description: "Failed to create developer application",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateApp = async (appId: string, updates: Partial<EnhancedDeveloperApp>) => {
    try {
      const { data, error } = await supabase
        .from('developer_integrations')
        .update(updates)
        .eq('id', appId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setApps(prev => 
        prev.map(app => 
          app.id === appId ? { ...app, ...data } : app
        )
      );
      
      toast({
        title: "Success",
        description: "Developer application updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating developer app:', error);
      toast({
        title: "Error",
        description: "Failed to update developer application",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteApp = async (appId: string) => {
    try {
      const { error } = await supabase
        .from('developer_integrations')
        .delete()
        .eq('id', appId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setApps(prev => prev.filter(app => app.id !== appId));
      
      toast({
        title: "Success",
        description: "Developer application deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting developer app:', error);
      toast({
        title: "Error",
        description: "Failed to delete developer application",
        variant: "destructive",
      });
    }
  };

  const toggleAppStatus = async (appId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('developer_integrations')
        .update({ is_active: !isActive })
        .eq('id', appId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setApps(prev => 
        prev.map(app => 
          app.id === appId ? { ...app, is_active: !isActive } : app
        )
      );
      
      toast({
        title: "Success",
        description: `Application ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling app status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  return {
    apps,
    loading,
    createApp,
    updateApp,
    deleteApp,
    toggleAppStatus,
    refetch: fetchApps
  };
};
