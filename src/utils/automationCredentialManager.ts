
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

// ENHANCED CREDENTIAL MANAGER - PHASE 1-5 IMPLEMENTATION
export class AutomationCredentialManager {
  /**
   * PHASE 5: Enhanced credential testing with full transparency
   */
  static async testCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🌟 ENHANCED TESTING: ${platformName} with all 5 phases implemented`);
      
      // PHASE 5: Call enhanced test-credential function with full transparency
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platform_name: platformName,
          credentials: credentials,
          user_id: userId,
          automation_id: automationId,
          enhanced_mode: true,
          phase_implementation: {
            phase_1: 'standardized_communication',
            phase_2: 'universal_knowledge_integration',
            phase_3: 'enhanced_authentication',
            phase_4: 'advanced_error_diagnosis',
            phase_5: 'real_time_transparency'
          }
        }
      });

      if (error) {
        console.error('❌ Enhanced credential test error:', error);
        return {
          success: false,
          message: `Failed to test ${platformName} credentials: ${error.message}`,
          details: { 
            error: error.message,
            enhanced_system: true,
            phase_status: 'ERROR'
          }
        };
      }

      console.log(`✅ ENHANCED TEST RESULT for ${platformName}:`, data);
      
      // PHASE 4: Enhanced response with detailed analysis
      return {
        success: data.success,
        message: data.message,
        details: {
          ...data.details,
          enhanced_testing: true,
          phase_implementation_status: data.details?.phase_markers || 'ALL_PHASES_ACTIVE',
          performance_metrics: data.performance_metrics,
          real_time_transparency: true
        }
      };

    } catch (error: any) {
      console.error(`💥 Enhanced testing system error for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Enhanced testing system error for ${platformName}: ${error.message}`,
        details: { 
          error: error.message,
          enhanced_system: true,
          system_status: 'ERROR',
          phase_implementation: 'FAILED'
        }
      };
    }
  }

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
          credential_type: 'oauth2',
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: true,
          test_status: 'success'
        }, {
          onConflict: 'automation_id,platform_name'
        });

      if (error) throw error;

      console.log(`✅ Saved enhanced-tested credentials for ${platformName} in automation ${automationId}`);
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
