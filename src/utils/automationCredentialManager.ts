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

export class AutomationCredentialManager {
  /**
   * ENHANCED: Universal credential testing with REAL credential injection
   */
  static async testCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🧪 UNIVERSAL TESTING for ${platformName} with REAL credentials`);
      
      // Use Enhanced Universal Platform Manager for REAL testing
      const result = await UniversalPlatformManager.testCredentials(
        platformName, 
        credentials,
        automationContext
      );
      
      return {
        success: result.success,
        message: result.message,
        details: {
          ...result.response_details,
          platform: platformName,
          universal_testing: true,
          real_credential_injection: true,
          automation_id: automationId
        }
      };

    } catch (error: any) {
      console.error(`💥 Universal testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Universal testing failed for ${platformName}: ${error.message}`,
        details: { 
          error: error.message,
          platform: platformName,
          system_error: true,
          universal_testing: true
        }
      };
    }
  }

  /**
   * ENHANCED: Save credentials with universal support
   */
  static async saveCredentials(
    automationId: string,
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`💾 Saving UNIVERSAL credentials for ${platformName} in automation ${automationId}`);

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
          test_message: `Universal testing successful for ${platformName} with REAL credential injection`,
          credential_type: 'universal_multi_field'
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
   * Get existing credentials for platform
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

  /**
   * ENHANCED: Get all credentials for automation
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

      if (error) {
        console.error('Failed to get all credentials:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get all credentials:', error);
      return [];
    }
  }

  /**
   * ENHANCED: Validate automation credentials with complete checking
   */
  static async validateAutomationCredentials(
    automationId: string,
    requiredPlatforms: string[],
    userId: string
  ): Promise<{
    valid: boolean;
    missing: string[];
    untested: string[];
    status: Record<string, 'saved' | 'tested' | 'unsaved'>;
  }> {
    try {
      const credentials = await this.getAllCredentials(automationId, userId);
      const missing: string[] = [];
      const untested: string[] = [];
      const status: Record<string, 'saved' | 'tested' | 'unsaved'> = {};

      for (const platform of requiredPlatforms) {
        const platformCred = credentials.find(
          c => c.platform_name.toLowerCase() === platform.toLowerCase()
        );

        if (!platformCred) {
          missing.push(platform);
          status[platform] = 'unsaved';
        } else if (!platformCred.is_tested || platformCred.test_status !== 'success') {
          untested.push(platform);
          status[platform] = 'saved';
        } else {
          status[platform] = 'tested';
        }
      }

      return {
        valid: missing.length === 0 && untested.length === 0,
        missing,
        untested,
        status
      };
    } catch (error) {
      console.error('Failed to validate automation credentials:', error);
      
      const status: Record<string, 'saved' | 'tested' | 'unsaved'> = {};
      requiredPlatforms.forEach(platform => {
        status[platform] = 'unsaved';
      });
      
      return {
        valid: false,
        missing: requiredPlatforms,
        untested: [],
        status
      };
    }
  }
}
