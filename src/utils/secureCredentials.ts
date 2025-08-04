
import { supabase } from '@/integrations/supabase/client';

export class SecureCredentialManager {
  private static encryptCredentials(credentials: Record<string, string>): string {
    try {
      // Simple base64 encoding for now - in production, use proper encryption
      return btoa(JSON.stringify(credentials));
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw error;
    }
  }

  private static decryptCredentials(encryptedData: string): Record<string, string> {
    try {
      // Handle both encrypted and plain text data for backward compatibility
      if (!encryptedData) return {};
      
      // Try to parse as JSON first (unencrypted)
      try {
        const parsed = JSON.parse(encryptedData);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      } catch (e) {
        // Not JSON, try base64 decode
      }
      
      // Try base64 decode
      try {
        const decoded = atob(encryptedData);
        return JSON.parse(decoded);
      } catch (e) {
        console.warn('⚠️ Could not decrypt credentials, returning empty object');
        return {};
      }
    } catch (error) {
      console.error('❌ Decryption error:', error);
      return {};
    }
  }

  static async storeCredentials(
    userId: string,
    platformName: string,
    credentials: Record<string, string>,
    automationId?: string
  ): Promise<boolean> {
    try {
      console.log(`💾 Storing credentials for ${platformName} in automation ${automationId}...`);
      
      const encryptedCredentials = JSON.stringify(credentials);
      
      if (automationId) {
        // Store in automation_platform_credentials table (UNIFIED APPROACH)
        const { data: existing } = await supabase
          .from('automation_platform_credentials')
          .select('id')
          .eq('user_id', userId)
          .eq('platform_name', platformName)
          .eq('automation_id', automationId)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('automation_platform_credentials')
            .update({
              credentials: encryptedCredentials,
              updated_at: new Date().toISOString(),
              is_tested: false,
              test_status: null
            })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('automation_platform_credentials')
            .insert({
              user_id: userId,
              platform_name: platformName,
              automation_id: automationId,
              credentials: encryptedCredentials,
              credential_type: 'api_key',
              is_active: true,
              is_tested: false
            });

          if (error) throw error;
        }
      } else {
        // Fallback to platform_credentials for backward compatibility
        const { data: existing } = await supabase
          .from('platform_credentials')
          .select('id')
          .eq('user_id', userId)
          .eq('platform_name', platformName)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('platform_credentials')
            .update({
              credentials: encryptedCredentials,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('platform_credentials')
            .insert({
              user_id: userId,
              platform_name: platformName,
              credential_type: 'api_key',
              credentials: encryptedCredentials
            });

          if (error) throw error;
        }
      }

      console.log(`✅ Successfully stored credentials for ${platformName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store credentials for ${platformName}:`, error);
      return false;
    }
  }

  static async getCredentials(
    userId: string,
    platformName: string,
    automationId?: string
  ): Promise<Record<string, string> | null> {
    try {
      console.log(`🔍 Fetching credentials for ${platformName} in automation ${automationId}...`);
      
      if (automationId) {
        // Check automation_platform_credentials first (UNIFIED APPROACH)
        const { data, error } = await supabase
          .from('automation_platform_credentials')
          .select('credentials')
          .eq('user_id', userId)
          .eq('platform_name', platformName)
          .eq('automation_id', automationId)
          .eq('is_active', true)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data?.credentials) {
          const decryptedCredentials = this.decryptCredentials(data.credentials);
          console.log(`✅ Found automation-specific credentials for ${platformName}`);
          return decryptedCredentials;
        }
      }
      
      // Fallback to platform_credentials for backward compatibility
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ No credentials found for ${platformName}`);
          return null;
        }
        throw error;
      }

      if (!data?.credentials) {
        console.log(`❌ Empty credentials for ${platformName}`);
        return null;
      }

      const decryptedCredentials = this.decryptCredentials(data.credentials);
      console.log(`✅ Found fallback credentials for ${platformName}`);
      return decryptedCredentials;
    } catch (error) {
      console.error(`❌ Error fetching credentials for ${platformName}:`, error);
      return null;
    }
  }

  static async deleteCredentials(
    userId: string,
    platformName: string,
    automationId?: string
  ): Promise<boolean> {
    try {
      if (automationId) {
        // Delete from automation_platform_credentials
        const { error } = await supabase
          .from('automation_platform_credentials')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('platform_name', platformName)
          .eq('automation_id', automationId);

        if (error) throw error;
      } else {
        // Delete from platform_credentials
        const { error } = await supabase
          .from('platform_credentials')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('platform_name', platformName);

        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error deleting credentials for ${platformName}:`, error);
      return false;
    }
  }
}
