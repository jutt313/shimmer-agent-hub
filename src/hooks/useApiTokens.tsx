
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ApiToken {
  id: string;
  token_name: string;
  token_type: string;
  permissions: {
    read: boolean;
    write: boolean;
    webhook: boolean;
  };
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

export const useApiTokens = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
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
      console.log('Fetching API tokens for user:', user?.id);
      const { data, error } = await supabase
        .from('user_api_tokens')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API tokens:', error);
        throw error;
      }
      
      console.log('Fetched API tokens:', data);
      // Transform the data to match our interface
      const transformedTokens: ApiToken[] = (data || []).map(token => ({
        ...token,
        permissions: typeof token.permissions === 'object' && token.permissions !== null 
          ? token.permissions as { read: boolean; write: boolean; webhook: boolean; }
          : { read: true, write: false, webhook: false }
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

  const createToken = async (tokenName: string, permissions: any): Promise<string | null> => {
    try {
      console.log('Creating API token:', tokenName, permissions);
      
      // Generate token
      const { data: tokenResult, error: tokenError } = await supabase
        .rpc('generate_api_token');

      if (tokenError) throw tokenError;

      const token = tokenResult;
      const tokenHash = await hashToken(token);

      // Store token
      const { data, error } = await supabase
        .from('user_api_tokens')
        .insert({
          user_id: user?.id,
          token_name: tokenName,
          token_hash: tokenHash,
          permissions: permissions
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the response to match our interface
      const transformedToken: ApiToken = {
        ...data,
        permissions: typeof data.permissions === 'object' && data.permissions !== null 
          ? data.permissions as { read: boolean; write: boolean; webhook: boolean; }
          : { read: true, write: false, webhook: false }
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
      console.log('Deleting API token:', tokenId);
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
      console.log('Toggling API token:', tokenId, isActive);
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
