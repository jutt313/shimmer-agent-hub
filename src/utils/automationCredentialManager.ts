
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
   * Save credentials for a specific automation
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
          is_tested: false
        }, {
          onConflict: 'automation_id,platform_name'
        });

      if (error) throw error;

      console.log(`✅ Saved credentials for ${platformName} in automation ${automationId}`);
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
   * Test credentials for a platform
   */
  static async testCredentials(
    automationId: string,
    platformName: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const credentials = await this.getCredentials(automationId, platformName, userId);
      if (!credentials) {
        return { success: false, message: 'No credentials found' };
      }

      // Test the credentials based on platform
      let testResult = { success: false, message: 'Test not implemented' };
      
      // Basic test - just check if credentials exist and have required fields
      if (platformName.toLowerCase().includes('openai')) {
        testResult = credentials.api_key ? 
          { success: true, message: 'OpenAI credentials configured' } :
          { success: false, message: 'OpenAI API key missing' };
      } else if (platformName.toLowerCase().includes('typeform')) {
        testResult = credentials.api_key ? 
          { success: true, message: 'Typeform credentials configured' } :
          { success: false, message: 'Typeform API key missing' };
      } else if (platformName.toLowerCase().includes('gmail')) {
        testResult = credentials.access_token ? 
          { success: true, message: 'Gmail credentials configured' } :
          { success: false, message: 'Gmail access token missing' };
      } else {
        testResult = Object.keys(credentials).length > 0 ? 
          { success: true, message: 'Credentials configured' } :
          { success: false, message: 'No credentials configured' };
      }

      // Update test status in database
      await supabase
        .from('automation_platform_credentials')
        .update({
          is_tested: true,
          test_status: testResult.success ? 'success' : 'failed',
          test_message: testResult.message
        })
        .eq('automation_id', automationId)
        .eq('platform_name', platformName.toLowerCase())
        .eq('user_id', userId);

      return testResult;
    } catch (error: any) {
      console.error(`❌ Failed to test credentials for ${platformName}:`, error);
      return { success: false, message: error.message };
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
