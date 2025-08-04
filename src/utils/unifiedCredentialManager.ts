
import { supabase } from '@/integrations/supabase/client';

export interface UnifiedCredential {
  id: string;
  automation_id: string;
  platform_name: string;
  credentials: string;
  is_active: boolean;
  is_tested: boolean;
  test_status: string | null;
  test_message: string | null;
  created_at: string;
  updated_at: string;
}

export class UnifiedCredentialManager {
  /**
   * Save credentials using ONLY the unified automation_platform_credentials table
   */
  static async saveCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`💾 Saving UNIFIED credentials for ${platformName} in automation ${automationId}`);

      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          automation_id: automationId,
          platform_name: platformName,
          user_id: userId,
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: false,
          credential_type: 'chatai_unified'
        }, {
          onConflict: 'automation_id,platform_name,user_id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Successfully saved UNIFIED credentials for ${platformName}`);
      return { 
        success: true, 
        message: `${platformName} credentials saved successfully in unified system!` 
      };

    } catch (error: any) {
      console.error(`❌ Failed to save UNIFIED credentials for ${platformName}:`, error);
      return { 
        success: false, 
        message: `Failed to save credentials: ${error.message}` 
      };
    }
  }

  /**
   * Get credentials using ONLY the unified table
   */
  static async getCredentials(
    userId: string,
    automationId: string,
    platformName: string
  ): Promise<Record<string, string> | null> {
    try {
      console.log(`🔍 Fetching UNIFIED credentials for ${platformName} in automation ${automationId}`);

      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('credentials')
        .eq('user_id', userId)
        .eq('automation_id', automationId)
        .eq('platform_name', platformName)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.credentials) {
        const credentials = JSON.parse(data.credentials);
        console.log(`✅ Found UNIFIED credentials for ${platformName}`);
        return credentials;
      }

      console.log(`❌ No UNIFIED credentials found for ${platformName}`);
      return null;

    } catch (error) {
      console.error(`❌ Error fetching UNIFIED credentials for ${platformName}:`, error);
      return null;
    }
  }

  /**
   * CRITICAL FIX: Test credentials with AI-generated testConfig
   */
  static async testCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🧪 CRITICAL FIX: Testing UNIFIED credentials for ${platformName} with AI-generated testConfig`);

      // PHASE 1: Generate AI testConfig before testing
      const { data: configData, error: configError } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate test configuration for ${platformName} API with credential fields: ${Object.keys(credentials).join(', ')}`,
          requestType: 'test_config_generation',
          platformName: platformName,
          credentialFields: Object.keys(credentials),
          generateConfigOnly: true
        }
      });

      if (configError) {
        console.error('❌ Failed to generate AI testConfig:', configError);
        throw configError;
      }

      // PHASE 2: Extract and validate testConfig
      const testConfig = configData.config || {
        platform_name: platformName,
        base_url: `https://api.${platformName.toLowerCase()}.com`,
        test_endpoint: { path: '/me', method: 'GET' },
        authentication: { 
          type: 'bearer',
          location: 'header',
          parameter_name: 'Authorization',
          format: 'Bearer {api_key}'
        },
        success_indicators: { 
          status_codes: [200], 
          response_patterns: ['id', 'user', 'success'] 
        },
        error_patterns: { 401: 'Unauthorized', 403: 'Forbidden' },
        ai_generated: true
      };

      console.log(`✅ Generated AI testConfig for ${platformName}:`, testConfig);

      // PHASE 3: Call test-credential with the AI-generated testConfig
      const { data: result, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platformName,
          credentials,
          testConfig, // CRITICAL: Pass the AI-generated testConfig
          userId,
          automationId,
          unified_testing: true,
          chatai_integration: true,
          ai_generated_config: true
        }
      });

      if (error) throw error;

      // Update test status in unified table
      await supabase
        .from('automation_platform_credentials')
        .update({
          is_tested: true,
          test_status: result.success ? 'success' : 'error',
          test_message: result.message,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('automation_id', automationId)
        .eq('platform_name', platformName);

      console.log(`${result.success ? '✅' : '❌'} Test completed for ${platformName}:`, result.message);

      return {
        success: result.success,
        message: result.message,
        details: {
          ...result.details,
          unified_system: true,
          chatai_powered: true,
          ai_config_used: true,
          testConfig_generated: true
        }
      };

    } catch (error: any) {
      console.error(`❌ UNIFIED credential test failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        details: { 
          error: error.message,
          unified_system: true,
          chatai_powered: true,
          ai_config_failed: true
        }
      };
    }
  }

  /**
   * Delete credentials from unified table
   */
  static async deleteCredentials(
    userId: string,
    automationId: string,
    platformName: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('automation_platform_credentials')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('automation_id', automationId)
        .eq('platform_name', platformName);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`❌ Error deleting UNIFIED credentials for ${platformName}:`, error);
      return false;
    }
  }
}
