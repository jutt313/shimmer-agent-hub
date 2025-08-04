
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
   * Test credentials with Chat AI integration
   */
  static async testCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🧪 Testing UNIFIED credentials for ${platformName} with Chat AI integration`);

      const { data: result, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platformName,
          credentials,
          userId,
          automationId,
          unified_testing: true,
          chatai_integration: true
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

      return {
        success: result.success,
        message: result.message,
        details: {
          ...result.details,
          unified_system: true,
          chatai_powered: true
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
          chatai_powered: true
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
