
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
      console.log(`💾 UNIFIED STORAGE: Storing credentials for ${platformName} in automation ${automationId}...`);
      
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
          console.log(`✅ UPDATED automation-specific credentials for ${platformName}`);
        } else {
          // Insert new
          const { error } = await supabase
            .from('automation_platform_credentials')
            .insert({
              user_id: userId,
              platform_name: platformName,
              automation_id: automationId,
              credentials: encryptedCredentials,
              credential_type: 'ai_generated_multi_field',
              is_active: true,
              is_tested: false
            });

          if (error) throw error;
          console.log(`✅ CREATED new automation-specific credentials for ${platformName}`);
        }
      } else {
        // NO FALLBACK - Force automation-specific storage
        console.warn(`⚠️ NO AUTOMATION ID: Cannot store credentials for ${platformName} without automation context`);
        return false;
      }

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
      console.log(`🔍 UNIFIED RETRIEVAL: Fetching credentials for ${platformName} in automation ${automationId}...`);
      
      if (!automationId) {
        console.log(`❌ NO AUTOMATION ID: Cannot retrieve credentials without automation context`);
        return null;
      }
      
      // Check automation_platform_credentials ONLY - NO FALLBACK
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
        console.log(`✅ FOUND automation-specific credentials for ${platformName}:`, Object.keys(decryptedCredentials));
        return decryptedCredentials;
      }
      
      console.log(`❌ NO CREDENTIALS: No automation-specific credentials found for ${platformName}`);
      return null;

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
        console.warn(`⚠️ Cannot delete credentials without automation context`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error deleting credentials for ${platformName}:`, error);
      return false;
    }
  }
}
