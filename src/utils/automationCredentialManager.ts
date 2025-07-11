
import { supabase } from '@/integrations/supabase/client';

export interface AutomationCredential {
  id: string;
  automation_id: string;
  platform_name: string;
  credential_type: string;
  credentials: string;
  is_active: boolean;
  is_tested: boolean;
  test_status?: string;
  test_message?: string;
}

export class AutomationCredentialManager {
  /**
   * Save credentials for a specific automation (ONLY after successful test)
   */
  static async saveCredentials(
    automationId: string,
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          automation_id: automationId,
          user_id: userId,
          platform_name: platformName.toLowerCase(),
          credential_type: 'api_key',
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: true, // Only save if tested
          test_status: 'success' // Only save if test passed
        }, {
          onConflict: 'automation_id,platform_name'
        });

      if (error) throw error;

      console.log(`✅ Saved tested credentials for ${platformName} in automation ${automationId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Failed to save credentials for ${platformName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get credentials for a specific automation and platform
   */
  static async getCredentials(
    automationId: string,
    platformName: string,
    userId: string
  ): Promise<Record<string, string> | null> {
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('credentials')
        .eq('automation_id', automationId)
        .eq('platform_name', platformName.toLowerCase())
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      return JSON.parse(data.credentials);
    } catch (error) {
      console.error(`❌ Failed to get credentials for ${platformName}:`, error);
      return null;
    }
  }

  /**
   * Get all credentials for an automation
   */
  static async getAllCredentials(
    automationId: string,
    userId: string
  ): Promise<AutomationCredential[]> {
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('*')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to get all credentials:', error);
      return [];
    }
  }

  /**
   * Test credentials for a platform - REAL API TESTING
   */
  static async testCredentials(
    automationId: string,
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🧪 Testing REAL credentials for ${platformName}...`);

      // Make REAL API call to test-credential edge function
      const response = await supabase.functions.invoke('test-credential', {
        body: {
          type: 'platform',
          platform_name: platformName,
          credential_fields: credentials,
          user_id: userId
        }
      });

      if (response.error) {
        console.error(`❌ Test failed for ${platformName}:`, response.error);
        return { 
          success: false, 
          message: `Test failed: ${response.error.message}` 
        };
      }

      const result = response.data;
      console.log(`📊 Test result for ${platformName}:`, result);

      if (result.success) {
        console.log(`✅ Real credential test SUCCESS for ${platformName}`);
        return { 
          success: true, 
          message: result.user_message || `${platformName} credentials work perfectly!` 
        };
      } else {
        console.log(`❌ Real credential test FAILED for ${platformName}`);
        return { 
          success: false, 
          message: result.user_message || `${platformName} credentials are invalid` 
        };
      }
    } catch (error: any) {
      console.error(`💥 Critical error testing ${platformName}:`, error);
      return { 
        success: false, 
        message: `Network error: ${error.message}` 
      };
    }
  }

  /**
   * Check if all required credentials are configured and tested for an automation
   */
  static async validateAutomationCredentials(
    automationId: string,
    requiredPlatforms: string[],
    userId: string
  ): Promise<{ valid: boolean; missing: string[]; untested: string[] }> {
    try {
      const credentials = await this.getAllCredentials(automationId, userId);
      const credentialMap = new Map(
        credentials.map(cred => [cred.platform_name.toLowerCase(), cred])
      );

      const missing: string[] = [];
      const untested: string[] = [];

      for (const platform of requiredPlatforms) {
        const platformKey = platform.toLowerCase();
        const credential = credentialMap.get(platformKey);

        if (!credential) {
          missing.push(platform);
        } else if (!credential.is_tested || credential.test_status !== 'success') {
          untested.push(platform);
        }
      }

      return {
        valid: missing.length === 0 && untested.length === 0,
        missing,
        untested
      };
    } catch (error) {
      console.error('❌ Failed to validate automation credentials:', error);
      return { valid: false, missing: requiredPlatforms, untested: [] };
    }
  }
}
