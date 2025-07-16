import { supabase } from '@/integrations/supabase/client';

export interface SimpleCredential {
  id: string;
  automation_id: string;
  platform_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Simplified credential manager that connects to main Chat-AI function
 * and uses test-credential function for testing
 */
export class SimpleCredentialManager {
  /**
   * Save credentials and test with main Chat-AI + test-credential functions
   */
  static async saveCredentials(
    automationId: string,
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; error?: string; testResult?: any }> {
    try {
      // Basic validation
      if (!automationId || !platformName || !userId) {
        return { success: false, error: 'Missing required parameters' };
      }

      const hasValidCredentials = Object.values(credentials).some(value => 
        value && value.trim() !== ''
      );

      if (!hasValidCredentials) {
        return { success: false, error: 'At least one credential is required' };
      }

      // Step 1: Save credentials to database first
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .upsert({
          automation_id: automationId,
          platform_name: platformName,
          user_id: userId,
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: false,
          credential_type: 'fresh_ai_tested',
          test_status: 'testing',
          test_message: 'Testing credentials with fresh AI configurations...'
        }, {
          onConflict: 'automation_id,platform_name,user_id'
        });

      if (error) {
        console.error('Error saving credentials:', error);
        return { success: false, error: error.message };
      }

      // Step 2: Get automation context for testing
      const { data: automationData } = await supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single();

      // Step 3: Get fresh AI configuration from main Chat-AI function
      console.log(`🧪 Getting fresh AI config for ${platformName} credentials...`);
      
      try {
        const { data: aiConfigResult, error: aiError } = await supabase.functions.invoke('chat-ai', {
          body: {
            message: `Generate fresh API configuration for ${platformName} platform credential testing.

**AUTOMATION CONTEXT:**
${JSON.stringify(automationData, null, 2)}

**CRITICAL REQUIREMENTS:**
- Generate REAL API operations that serve this specific automation workflow
- NO generic /auth/verify or /me endpoints for operations
- Use actual operations and real field names from current API documentation
- Include proper test endpoint configuration for credential validation
- Return ONLY the api_configurations array with test_endpoint included

**REQUIRED FORMAT:**
{
  "api_configurations": [
    {
      "platform_name": "${platformName}",
      "base_url": "https://api.platform.com",
      "authentication": {
        "type": "Bearer",
        "location": "header",
        "parameter_name": "Authorization",
        "format": "Bearer {field_name}"
      },
      "test_endpoint": {
        "method": "GET",
        "path": "/v1/real/test/endpoint",
        "headers": {
          "Authorization": "Bearer {field_name}",
          "Content-Type": "application/json"
        },
        "expected_success_indicators": ["success", "data", "user"],
        "expected_error_indicators": ["error", "invalid", "unauthorized"]
      }
    }
  ]
}

Return ONLY this JSON configuration, no explanations.`,
            messages: [],
            requestType: 'fresh_ai_platform_config',
            automationContext: automationData,
            platformName: platformName
          }
        });

        if (aiError) {
          console.warn('AI config generation failed:', aiError);
          throw new Error(`AI config failed: ${aiError.message}`);
        }

        // Step 4: Extract test configuration from AI response
        let testConfig = null;
        if (aiConfigResult && aiConfigResult.api_configurations && aiConfigResult.api_configurations.length > 0) {
          testConfig = aiConfigResult.api_configurations[0];
        }

        if (!testConfig || !testConfig.test_endpoint) {
          throw new Error('AI did not provide valid test configuration');
        }

        // Step 5: Test credentials using test-credential function with AI config
        console.log(`🔧 Testing ${platformName} credentials with fresh AI config...`);
        
        const { data: testResult, error: testError } = await supabase.functions.invoke('test-credential', {
          body: {
            platformName,
            credentials,
            automationId,
            aiGeneratedConfig: testConfig // Pass AI config to test function
          }
        });

        if (testError) {
          console.warn('Credential test failed:', testError);
          
          // Update with test failure
          await supabase
            .from('automation_platform_credentials')
            .update({
              is_tested: false,
              test_status: 'failed',
              test_message: `Fresh AI test failed: ${testError.message}`
            })
            .eq('automation_id', automationId)
            .eq('platform_name', platformName)
            .eq('user_id', userId);

          return { 
            success: true, // Credentials saved, but test failed
            error: `Credentials saved but fresh AI test failed: ${testError.message}`,
            testResult: { success: false, message: testError.message }
          };
        }

        // Update with test results
        await supabase
          .from('automation_platform_credentials')
          .update({
            is_tested: testResult.success,
            test_status: testResult.success ? 'passed' : 'failed',
            test_message: testResult.message
          })
          .eq('automation_id', automationId)
          .eq('platform_name', platformName)
          .eq('user_id', userId);

        return { 
          success: true, 
          testResult 
        };

      } catch (testError: any) {
        console.warn('Could not test credentials with fresh AI system:', testError);
        
        // Update with test error
        await supabase
          .from('automation_platform_credentials')
          .update({
            is_tested: false,
            test_status: 'error',
            test_message: 'Could not test credentials with fresh AI - will be tested during execution'
          })
          .eq('automation_id', automationId)
          .eq('platform_name', platformName)
          .eq('user_id', userId);

        return { 
          success: true,
          error: 'Credentials saved but could not be tested with fresh AI automatically'
        };
      }
      
    } catch (error: any) {
      console.error('Unexpected error saving credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get credentials for a platform
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
      console.error('Error getting credentials:', error);
      return null;
    }
  }

  /**
   * Get all credentials for an automation
   */
  static async getAllCredentials(
    automationId: string,
    userId: string
  ): Promise<SimpleCredential[]> {
    try {
      const { data, error } = await supabase
        .from('automation_platform_credentials')
        .select('id, automation_id, platform_name, is_active, created_at, updated_at')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting all credentials:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all credentials:', error);
      return [];
    }
  }

  /**
   * Check which platforms have saved credentials with Chat-AI test status
   */
  static async getCredentialStatus(
    automationId: string,
    requiredPlatforms: string[],
    userId: string
  ): Promise<Record<string, 'saved' | 'tested' | 'missing'>> {
    try {
      const { data: credentials, error } = await supabase
        .from('automation_platform_credentials')
        .select('platform_name, is_tested, test_status')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting credential status:', error);
        return {};
      }

      const credentialMap = new Map();
      credentials?.forEach(cred => {
        credentialMap.set(cred.platform_name.toLowerCase(), {
          is_tested: cred.is_tested,
          test_status: cred.test_status
        });
      });
      
      const status: Record<string, 'saved' | 'tested' | 'missing'> = {};
      
      requiredPlatforms.forEach(platform => {
        const credInfo = credentialMap.get(platform.toLowerCase());
        if (!credInfo) {
          status[platform] = 'missing';
        } else if (credInfo.is_tested && credInfo.test_status === 'passed') {
          status[platform] = 'tested';
        } else {
          status[platform] = 'saved';
        }
      });

      return status;
    } catch (error) {
      console.error('Error getting credential status:', error);
      return {};
    }
  }

  /**
   * Delete credentials for a platform
   */
  static async deleteCredentials(
    automationId: string,
    platformName: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('automation_platform_credentials')
        .update({ is_active: false })
        .eq('automation_id', automationId)
        .eq('platform_name', platformName)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Basic credential format validation
   */
  static validateCredentialFormat(
    fieldName: string,
    value: string
  ): { isValid: boolean; message?: string } {
    if (!value || value.trim() === '') {
      return { isValid: false, message: 'This field is required' };
    }

    const lowerField = fieldName.toLowerCase();
    const trimmedValue = value.trim();

    // API Key validation
    if (lowerField.includes('api_key') || lowerField.includes('key')) {
      if (trimmedValue.length < 8) {
        return { isValid: false, message: 'API key appears to be too short' };
      }
    }

    // Token validation
    if (lowerField.includes('token')) {
      if (trimmedValue.length < 10) {
        return { isValid: false, message: 'Token appears to be too short' };
      }
    }

    // Email validation
    if (lowerField.includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        return { isValid: false, message: 'Please enter a valid email address' };
      }
    }

    // URL validation
    if (lowerField.includes('url') || lowerField.includes('endpoint')) {
      try {
        new URL(trimmedValue);
      } catch {
        return { isValid: false, message: 'Please enter a valid URL' };
      }
    }

    return { isValid: true };
  }
}
