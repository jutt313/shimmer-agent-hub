
// Secure credential management utilities
import { supabase } from '@/integrations/supabase/client';

export interface SecureCredential {
  id: string;
  platform_name: string;
  credential_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SecureCredentialManager {
  /**
   * Get user's credentials (without exposing actual credential values)
   */
  static async getUserCredentials(userId: string): Promise<SecureCredential[]> {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('id, platform_name, credential_type, is_active, created_at, updated_at')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user credentials:', error);
      throw new Error('Failed to fetch credentials');
    }
  }

  /**
   * Check if user has valid credentials for a platform
   */
  static async hasValidCredentials(userId: string, platformName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('id')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking credentials:', error);
      return false;
    }
  }

  /**
   * Validate API operation without exposing credentials
   */
  static async validateCredentials(credentialId: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: { credentialId }
      });

      if (error) throw error;

      return {
        isValid: data?.success === true,
        error: data?.error
      };
    } catch (error) {
      console.error('Error validating credentials:', error);
      return {
        isValid: false,
        error: 'Failed to validate credentials'
      };
    }
  }
}
