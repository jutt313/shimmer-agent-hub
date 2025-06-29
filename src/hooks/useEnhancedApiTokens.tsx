
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface EnhancedApiToken {
  id: string;
  token_name: string;
  token_description: string | null;
  connection_purpose: string | null;
  token_type: string;
  permissions: {
    read: boolean;
    write: boolean;
    webhook: boolean;
    notifications: boolean;
    full_control: boolean;
    platform_connections: boolean;
  };
  expires_at: string | null;
  last_used_at: string | null;
  usage_count: number;
  last_usage_details: any;
  is_active: boolean;
  created_at: string;
}

export const useEnhancedApiTokens = () => {
  const [tokens, setTokens] = useState<EnhancedApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTokens();
    }
  }, [user]);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedTokens: EnhancedApiToken[] = (data || []).map(token => ({
        ...token,
        permissions: typeof token.permissions === 'object' && token.permissions !== null 
          ? {
              read: token.permissions.read || false,
              write: token.permissions.write || false,
              webhook: token.permissions.webhook || false,
              notifications: token.permissions.notifications || false,
              full_control: token.permissions.full_control || false,
              platform_connections: token.permissions.platform_connections || false,
            }
          : {
              read: true,
              write: false,
              webhook: false,
              notifications: false,
              full_control: false,
              platform_connections: false,
            },
        usage_count: token.usage_count || 0,
      }));
      
      setTokens(transformedTokens);
    } catch (error) {
      console.error('Error fetching API tokens:', error);
      toast({
        title: "Error",
        description: "Failed to load API tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createToken = async (tokenData: {
    token_name: string;
    token_description: string;
    connection_purpose: string;
    permissions: any;
  }): Promise<string | null> => {
    try {
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_api_token');

      if (tokenError) throw tokenError;

      const token = tokenResult;
      const tokenHash = await hashToken(token);

      const { data, error } = await supabase
        .from('user_api_tokens')
        .insert({
          user_id: user?.id,
          token_name: tokenData.token_name,
          token_description: tokenData.token_description,
          connection_purpose: tokenData.connection_purpose,
          token_hash: tokenHash,
          permissions: tokenData.permissions
        })
        .select()
        .single();

      if (error) throw error;

      const transformedToken: EnhancedApiToken = {
        ...data,
        permissions: typeof data.permissions === 'object' && data.permissions !== null 
          ? data.permissions as any
          : { read: true, write: false, webhook: false, notifications: false, full_control: false, platform_connections: false },
        usage_count: data.usage_count || 0,
      };

      setTokens(prev => [transformedToken, ...prev]);
      
      toast({
        title: "Success",
        description: "API token created successfully",
      });

      return token;
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

  const deleteToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('user_api_tokens')
        .delete()
        .eq('id', tokenId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTokens(prev => prev.filter(token => token.id !== tokenId));
      
      toast({
        title: "Success",
        description: "API token deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting API token:', error);
      toast({
        title: "Error",
        description: "Failed to delete API token",
        variant: "destructive",
      });
    }
  };

  const toggleToken = async (tokenId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_api_tokens')
        .update({ is_active: !isActive })
        .eq('id', tokenId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTokens(prev => 
        prev.map(token => 
          token.id === tokenId ? { ...token, is_active: !isActive } : token
        )
      );
      
      toast({
        title: "Success",
        description: `API token ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error toggling API token:', error);
      toast({
        title: "Error",
        description: "Failed to update API token",
        variant: "destructive",
      });
    }
  };

  const hashToken = async (token: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return {
    tokens,
    loading,
    createToken,
    deleteToken,
    toggleToken,
    refetch: fetchTokens
  };
};
