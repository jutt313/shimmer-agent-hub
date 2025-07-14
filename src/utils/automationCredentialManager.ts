
import { supabase } from '@/integrations/supabase/client';
import { UniversalPlatformManager } from './universalPlatformManager';

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

// UNIVERSAL AUTOMATION CREDENTIAL MANAGER - NO HARDCODING
export class AutomationCredentialManager {
  /**
   * Universal credential testing using AI-powered platform detection
   */
  static async testCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🧪 Universal testing for ${platformName} via AI`);
      
      // Use Universal Platform Manager for testing
      const result = await UniversalPlatformManager.testCredentials(platformName, credentials);
      
      return {
        success: result.success,
        message: result.message,
        details: {
          ...result,
          platform: platformName,
          universal_ai_powered: true,
          no_hardcoding: true
        }
      };

    } catch (error: any) {
      console.error(`💥 Universal testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Universal AI testing failed for ${platformName}: ${error.message}`,
        details: { 
          error: error.message,
          platform: platformName,
          system_error: true
        }
      };
    }
  }

  /**
   * Save credentials after successful testing
   */
  static async saveCredentials(
    automationId: string,
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`💾 Saving universal credentials for ${platformName}`);

      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          automation_id: automationId,
          platform_name: platformName,
          user_id: userId,
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: true,
          test_status: 'success',
          test_message: `Universal AI testing successful for ${platformName}`,
          credential_type: 'universal_ai_managed'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Universal credentials saved for ${platformName}`);
      return { success: true };

    } catch (error: any) {
      console.error(`❌ Failed to save universal credentials:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get existing credentials
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
        .eq('platform_name', platformName)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return JSON.parse(data.credentials);
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }
}
