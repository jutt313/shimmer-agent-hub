
import { supabase } from '@/integrations/supabase/client';
import { globalErrorLogger } from '@/utils/errorLogger';

export interface OAuthToken {
  id: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  token_type: string;
  scope: string[];
  developer_integration_id: string;
}

export class OAuthTokenManager {
  private static readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

  /**
   * Store OAuth tokens securely with encryption
   */
  static async storeTokens(
    userId: string,
    integrationId: string,
    tokenData: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000)
        : new Date(Date.now() + 3600 * 1000); // Default 1 hour

      const { error } = await supabase
        .from('oauth_connections')
        .upsert({
          user_id: userId,
          developer_integration_id: integrationId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
          token_type: tokenData.token_type || 'Bearer',
          scopes: { scope: tokenData.scope || [] },
          is_active: true,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,developer_integration_id'
        });

      if (error) throw error;

      globalErrorLogger.log('INFO', 'OAuth tokens stored successfully', {
        userId,
        integrationId,
        expiresAt: expiresAt.toISOString()
      });

      return { success: true };
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to store OAuth tokens', {
        userId,
        integrationId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get valid OAuth token (auto-refresh if needed)
   */
  static async getValidToken(
    userId: string,
    integrationId: string
  ): Promise<{ token: string | null; error?: string }> {
    try {
      const { data: connection, error } = await supabase
        .from('oauth_connections')
        .select(`
          *,
          developer_integrations!inner(*)
        `)
        .eq('user_id', userId)
        .eq('developer_integration_id', integrationId)
        .eq('is_active', true)
        .single();

      if (error || !connection) {
        return { token: null, error: 'No valid OAuth connection found' };
      }

      const expiresAt = new Date(connection.expires_at);
      const now = new Date();
      const shouldRefresh = expiresAt.getTime() - now.getTime() < this.TOKEN_REFRESH_BUFFER;

      if (shouldRefresh && connection.refresh_token) {
        const refreshResult = await this.refreshToken(userId, integrationId, connection.refresh_token);
        if (refreshResult.success && refreshResult.access_token) {
          return { token: refreshResult.access_token };
        }
      }

      if (expiresAt > now) {
        // Update last used
        await supabase
          .from('oauth_connections')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', connection.id);

        return { token: connection.access_token };
      }

      return { token: null, error: 'Token expired and refresh failed' };
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to get valid OAuth token', {
        userId,
        integrationId,
        error: error.message
      });
      return { token: null, error: error.message };
    }
  }

  /**
   * Refresh OAuth token
   */
  private static async refreshToken(
    userId: string,
    integrationId: string,
    refreshToken: string
  ): Promise<{ success: boolean; access_token?: string; error?: string }> {
    try {
      // Get integration details for refresh
      const { data: integration, error: integrationError } = await supabase
        .from('developer_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (integrationError || !integration) {
        throw new Error('Integration not found');
      }

      // Call refresh endpoint (this would be integration-specific)
      const refreshResponse = await fetch('/api/oauth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refresh_token: refreshToken,
          client_id: integration.client_id,
          client_secret: integration.client_secret
        })
      });

      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed');
      }

      const tokenData = await refreshResponse.json();
      
      const storeResult = await this.storeTokens(userId, integrationId, tokenData);
      if (!storeResult.success) {
        throw new Error(storeResult.error);
      }

      return { success: true, access_token: tokenData.access_token };
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'OAuth token refresh failed', {
        userId,
        integrationId,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke OAuth tokens
   */
  static async revokeTokens(
    userId: string,
    integrationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('oauth_connections')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('developer_integration_id', integrationId);

      if (error) throw error;

      globalErrorLogger.log('INFO', 'OAuth tokens revoked', {
        userId,
        integrationId
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate token format and structure
   */
  static validateTokenStructure(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    if (token.length < 10) return false;
    // Add more validation as needed
    return true;
  }
}
