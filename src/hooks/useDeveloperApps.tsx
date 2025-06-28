
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface DeveloperApp {
  id: string;
  app_name: string;
  app_description: string | null;
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  webhook_url: string | null;
  is_active: boolean;
  tier: string;
  rate_limit_per_hour: number;
  created_at: string;
  updated_at: string;
}

export const useDeveloperApps = () => {
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
      console.log('Fetching developer apps for user:', user?.id);
      const { data, error } = await supabase
        .from('developer_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching developer apps:', error);
        throw error;
      }
      
      console.log('Fetched developer apps:', data);
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
  }) => {
    try {
      console.log('Creating developer app:', appData);
      const { data, error } = await supabase
        .from('developer_integrations')
        .insert({
          user_id: user?.id,
          ...appData,
          redirect_uris: appData.redirect_uris.filter(uri => uri.trim()),
          webhook_url: appData.webhook_url || null
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

  const updateApp = async (appId: string, updates: Partial<DeveloperApp>) => {
    try {
      console.log('Updating developer app:', appId, updates);
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
      console.log('Deleting developer app:', appId);
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
      console.log('Toggling app status:', appId, isActive);
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
