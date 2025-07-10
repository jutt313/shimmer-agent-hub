
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
    credentials: Record<string, string>
  ): Promise<boolean> {
    try {
      console.log(`💾 Storing credentials for ${platformName}...`);
      
      const encryptedCredentials = this.encryptCredentials(credentials);
      
      // Check if credentials already exist
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

      console.log(`✅ Successfully stored credentials for ${platformName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store credentials for ${platformName}:`, error);
      return false;
    }
  }

  static async getCredentials(
    userId: string,
    platformName: string
  ): Promise<Record<string, string> | null> {
    try {
      console.log(`🔍 Fetching credentials for ${platformName}...`);
      
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No records found
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
      console.log(`✅ Found credentials for ${platformName}`);
      return decryptedCredentials;
    } catch (error) {
      console.error(`❌ Error fetching credentials for ${platformName}:`, error);
      return null;
    }
  }

  static async deleteCredentials(
    userId: string,
    platformName: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('platform_credentials')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('platform_name', platformName);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`❌ Error deleting credentials for ${platformName}:`, error);
      return false;
    }
  }
}
