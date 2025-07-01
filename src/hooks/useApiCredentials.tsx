
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ApiCredential {
  id: string;
  credential_name: string;
  credential_description: string | null;
  credential_type: 'personal' | 'developer' | 'service';
  api_key: string;
  api_secret: string | null;
  permissions: {
    read: boolean;
    write: boolean;
    webhook: boolean;
    notifications: boolean;
    automations: boolean;
    platform_connections: boolean;
  };
  rate_limit_per_hour: number;
  allowed_origins: string[];
  webhook_url: string | null;
  is_active: boolean;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export const useApiCredentials = () => {
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCredentials();
    }
  }, [user]);

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials((data || []).map(item => ({
        ...item,
        credential_type: item.credential_type as 'personal' | 'developer' | 'service'
      })));
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast({
        title: "Error",
        description: "Failed to load API credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCredential = async (credentialData: {
    credential_name: string;
    credential_description: string;
    credential_type: 'personal' | 'developer' | 'service';
    permissions: any;
    rate_limit_per_hour?: number;
    allowed_origins?: string[];
    webhook_url?: string;
  }) => {
    try {
      const { data: apiKey, error: keyError } = await supabase
        .rpc('generate_unified_api_key', { key_type: credentialData.credential_type });

      if (keyError) throw keyError;

      const { data, error } = await supabase
        .from('api_credentials')
        .insert({
          user_id: user?.id,
          credential_name: credentialData.credential_name,
          credential_description: credentialData.credential_description,
          credential_type: credentialData.credential_type,
          api_key: apiKey,
          permissions: credentialData.permissions,
          rate_limit_per_hour: credentialData.rate_limit_per_hour || 1000,
          allowed_origins: credentialData.allowed_origins || [],
          webhook_url: credentialData.webhook_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newCredential = {
        ...data,
        credential_type: data.credential_type as 'personal' | 'developer' | 'service'
      };

      setCredentials(prev => [newCredential, ...prev]);
      
      toast({
        title: "Success",
        description: `API credential created successfully`,
      });

      return { credential: newCredential, apiKey };
    } catch (error) {
      console.error('Error creating credential:', error);
      toast({
        title: "Error",
        description: "Failed to create API credential",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCredential = async (credentialId: string, updates: Partial<ApiCredential>) => {
    try {
      const { data, error } = await supabase
        .from('api_credentials')
        .update(updates)
        .eq('id', credentialId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      const updatedCredential = {
        ...data,
        credential_type: data.credential_type as 'personal' | 'developer' | 'service'
      };

      setCredentials(prev => 
        prev.map(cred => 
          cred.id === credentialId ? { ...cred, ...updatedCredential } : cred
        )
      );
      
      toast({
        title: "Success",
        description: "API credential updated successfully",
      });

      return updatedCredential;
    } catch (error) {
      console.error('Error updating credential:', error);
      toast({
        title: "Error",
        description: "Failed to update API credential",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCredential = async (credentialId: string) => {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCredentials(prev => prev.filter(cred => cred.id !== credentialId));
      
      toast({
        title: "Success",
        description: "API credential deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting credential:', error);
      toast({
        title: "Error",
        description: "Failed to delete API credential",
        variant: "destructive",
      });
    }
  };

  const toggleCredential = async (credentialId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('api_credentials')
        .update({ is_active: !isActive })
        .eq('id', credentialId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCredentials(prev => 
        prev.map(cred => 
          cred.id === credentialId ? { ...cred, is_active: !isActive } : cred
        )
      );
      
      toast({
        title: "Success",
        description: `API credential ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling credential:', error);
      toast({
        title: "Error",
        description: "Failed to update credential status",
        variant: "destructive",
      });
    }
  };

  return {
    credentials,
    loading,
    createCredential,
    updateCredential,
    deleteCredential,
    toggleCredential,
    refetch: fetchCredentials
  };
};
