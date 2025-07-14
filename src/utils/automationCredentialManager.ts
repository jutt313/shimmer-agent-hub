
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

// REAL CREDENTIAL MANAGER - INTEGRATED WITH REAL TESTING SYSTEM
export class AutomationCredentialManager {
  /**
   * REAL CREDENTIAL TESTING - Using actual API calls via chat-ai configurations
   */
  static async testCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🌟 REAL TESTING: ${platformName} with chat-ai integration`);
      
      // Call the REAL test-credential function
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platform_name: platformName,
          credentials: credentials,
          user_id: userId,
          automation_id: automationId
        }
      });

      if (error) {
        console.error('❌ Real credential test error:', error);
        return {
          success: false,
          message: `Failed to test ${platformName} credentials: ${error.message}`,
          details: { 
            error: error.message,
            real_testing: true
          }
        };
      }

      console.log(`✅ REAL TEST RESULT for ${platformName}:`, data);
      
      return {
        success: data.success,
        message: data.message,
        details: {
          ...data.details,
          real_api_testing: true,
          chat_ai_powered: true
        }
      };

    } catch (error: any) {
      console.error(`💥 Real testing system error for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Real testing system error for ${platformName}: ${error.message}`,
        details: { 
          error: error.message,
          real_testing: true
        }
      };
    }
  }

  /**
   * Save credentials for a specific automation (ONLY after successful REAL test)
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
          is_tested: true,
          test_status: 'success'
        }, {
          onConflict: 'automation_id,platform_name'
        });

      if (error) throw error;

      console.log(`✅ Saved REAL-tested credentials for ${platformName} in automation ${automationId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Failed to save credentials for ${platformName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get credentials for execution
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
