
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
      console.log(`💾 Storing credentials for ${platformName} in automation ${automationId} (UNIFIED ONLY)...`);
      
      const encryptedCredentials = JSON.stringify(credentials);
      
      // UNIFIED APPROACH: Only use automation_platform_credentials table
      if (!automationId) {
        console.warn('⚠️ No automation ID provided - this should not happen in unified system');
        return false;
      }

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
            credential_type: 'unified_chatai',
            is_active: true,
            is_tested: false
          });

        if (error) throw error;
      }

      console.log(`✅ Successfully stored UNIFIED credentials for ${platformName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store UNIFIED credentials for ${platformName}:`, error);
      return false;
    }
  }

  static async getCredentials(
    userId: string,
    platformName: string,
    automationId?: string
  ): Promise<Record<string, string> | null> {
    try {
      console.log(`🔍 Fetching UNIFIED credentials for ${platformName} in automation ${automationId}...`);
      
      if (!automationId) {
        console.warn('⚠️ No automation ID provided - this should not happen in unified system');
        return null;
      }

      // UNIFIED APPROACH: Only check automation_platform_credentials
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
        console.log(`✅ Found UNIFIED credentials for ${platformName}`);
        return decryptedCredentials;
      }

      console.log(`❌ No UNIFIED credentials found for ${platformName}`);
      return null;
    } catch (error) {
      console.error(`❌ Error fetching UNIFIED credentials for ${platformName}:`, error);
      return null;
    }
  }

  static async deleteCredentials(
    userId: string,
    platformName: string,
    automationId?: string
  ): Promise<boolean> {
    try {
      if (!automationId) {
        console.warn('⚠️ No automation ID provided - this should not happen in unified system');
        return false;
      }

      // UNIFIED APPROACH: Only delete from automation_platform_credentials
      const { error } = await supabase
        .from('automation_platform_credentials')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('platform_name', platformName)
        .eq('automation_id', automationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`❌ Error deleting UNIFIED credentials for ${platformName}:`, error);
      return false;
    }
  }
}
