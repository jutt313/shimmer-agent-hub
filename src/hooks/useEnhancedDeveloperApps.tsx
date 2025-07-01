
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeveloperApp {
  id: string;
  app_name: string;
  app_description: string;
  client_id: string;
  client_secret: string;
  test_client_id: string | null;
  test_client_secret: string | null;
  redirect_uris: string[];
  webhook_url: string | null;
  app_logo_url: string | null;
  homepage_url: string | null;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;
  developer_email: string | null;
  supported_events: any;
  environment: 'test' | 'production';
  is_active: boolean;
  created_at: string;
}

export const useEnhancedDeveloperApps = () => {
  const [apps, setApps] = useState<DeveloperApp[]>([]);
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
      console.error('Error fetching apps:', error);
      toast({
        title: "Error",
        description: "Failed to load developer apps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApp = async (appData: any) => {
    try {
      const { data, error } = await supabase
        .from('developer_integrations')
        .insert({
          user_id: user?.id,
          ...appData,
        })
        .select()
        .single();

      if (error) throw error;

      setApps(prev => [data, ...prev]);
      
      toast({
        title: "Success",
        description: "Developer app created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating app:', error);
      toast({
        title: "Error",
        description: "Failed to create developer app",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateApp = async (appId: string, updates: any) => {
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
        description: "Developer app updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating app:', error);
      toast({
        title: "Error",
        description: "Failed to update developer app",
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
        description: "Developer app deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting app:', error);
      toast({
        title: "Error",
        description: "Failed to delete developer app",
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
        description: `Developer app ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling app status:', error);
      toast({
        title: "Error",
        description: "Failed to update app status",
        variant: "destructive",
      });
    }
  };

  const switchEnvironment = async (appId: string, environment: 'test' | 'production') => {
    try {
      const { error } = await supabase
        .from('developer_integrations')
        .update({ environment })
        .eq('id', appId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setApps(prev => 
        prev.map(app => 
          app.id === appId ? { ...app, environment } : app
        )
      );
      
      toast({
        title: "Success",
        description: `Switched to ${environment} environment`,
      });
    } catch (error) {
      console.error('Error switching environment:', error);
      toast({
        title: "Error",
        description: "Failed to switch environment",
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
    switchEnvironment,
    refetch: fetchApps
  };
};
