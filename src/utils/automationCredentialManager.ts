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

// FIXED AUTOMATION CREDENTIAL MANAGER - WITH REAL PLATFORM VALIDATION
export class AutomationCredentialManager {
  /**
   * PHASE 1: Real Platform-Specific Credential Validation
   */
  static validateCredentialFormat(platformName: string, credentials: Record<string, string>): { valid: boolean; message: string } {
    console.log(`🔍 Validating credential format for ${platformName}`);
    
    const platform = platformName.toLowerCase();
    
    switch (platform) {
      case 'openai':
        const openaiKey = credentials.api_key || credentials.key;
        if (!openaiKey) return { valid: false, message: 'OpenAI API key is required' };
        if (!openaiKey.startsWith('sk-')) return { valid: false, message: 'OpenAI API key must start with "sk-"' };
        if (openaiKey.length < 20) return { valid: false, message: 'OpenAI API key appears to be too short' };
        return { valid: true, message: 'OpenAI API key format is valid' };
        
      case 'typeform':
        const typeformToken = credentials.personal_access_token || credentials.token;
        if (!typeformToken) return { valid: false, message: 'Typeform Personal Access Token is required' };
        if (!typeformToken.startsWith('tfp_')) return { valid: false, message: 'Typeform token must start with "tfp_"' };
        return { valid: true, message: 'Typeform token format is valid' };
        
      case 'google sheets':
      case 'google_sheets':
        const googleToken = credentials.access_token || credentials.api_key;
        if (!googleToken) return { valid: false, message: 'Google Sheets access token or API key is required' };
        return { valid: true, message: 'Google Sheets credentials format is valid' };
        
      default:
        // Universal validation for other platforms
        const hasCredentials = Object.values(credentials).some(val => val && val.trim());
        if (!hasCredentials) return { valid: false, message: `${platformName} credentials are required` };
        return { valid: true, message: `${platformName} credentials format appears valid` };
    }
  }

  /**
   * PHASE 2: Real API Configuration Generation with Chat-AI
   */
  static async getRealPlatformConfig(platformName: string, userId: string): Promise<any> {
    console.log(`🤖 Getting real API configuration for ${platformName} via chat-ai`);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate REAL API testing configuration for ${platformName}. Return only valid JSON with this exact structure:
{
  "platform_name": "${platformName}",
  "base_url": "https://api.platform.com",
  "test_endpoint": {
    "method": "GET",
    "path": "/endpoint/to/test",
    "description": "Test endpoint description"
  },
  "auth_config": {
    "type": "bearer",
    "location": "header",
    "parameter_name": "Authorization",
    "format": "Bearer {token}"
  },
  "validation_endpoint": {
    "method": "GET",
    "path": "/me",
    "description": "Validate credentials"
  },
  "error_patterns": {
    "401": "Invalid credentials",
    "403": "Insufficient permissions",
    "429": "Rate limit exceeded"
  }
}

For ${platformName} specifically, use these real endpoints:
- OpenAI: base_url "https://api.openai.com", test_endpoint "/v1/models"
- Typeform: base_url "https://api.typeform.com", test_endpoint "/me"  
- Google Sheets: base_url "https://sheets.googleapis.com", test_endpoint "/v4/spreadsheets"

Return ONLY the JSON configuration, no explanations.`,
          requestType: 'platform_config_generation',
          messages: []
        }
      });

      if (error) {
        console.error('❌ Chat-AI error:', error);
        return this.createRealFallbackConfig(platformName);
      }

      // Parse chat-ai response
      let config;
      try {
        if (typeof data === 'string') {
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            config = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in chat-ai response');
          }
        } else if (data && typeof data === 'object') {
          config = data;
        } else {
          throw new Error('Invalid chat-ai response format');
        }

        // Validate required fields
        if (!config.base_url || !config.test_endpoint) {
          throw new Error('Invalid configuration structure');
        }

        console.log(`✅ Real API configuration obtained for ${platformName}`);
        return config;

      } catch (parseError) {
        console.error('❌ Config parsing failed:', parseError);
        return this.createRealFallbackConfig(platformName);
      }

    } catch (error) {
      console.error('💥 Complete config generation failed:', error);
      return this.createRealFallbackConfig(platformName);
    }
  }

  /**
   * PHASE 3: Real API Testing with Platform-Specific Logic
   */
  static async testCredentials(
    userId: string,
    automationId: string,
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log(`🧪 Starting REAL credential test for ${platformName}`);
      
      // Phase 1: Validate credential format
      const formatValidation = this.validateCredentialFormat(platformName, credentials);
      if (!formatValidation.valid) {
        return {
          success: false,
          message: formatValidation.message,
          details: { validation_failed: true, platform: platformName }
        };
      }

      // Phase 2: Get real platform configuration
      const config = await this.getRealPlatformConfig(platformName, userId);
      
      // Phase 3: Make real API call
      const testResult = await this.performRealAPITest(config, credentials, platformName);
      
      console.log(`📊 Test result for ${platformName}:`, testResult.success ? 'SUCCESS' : 'FAILED');
      
      return {
        success: testResult.success,
        message: testResult.success 
          ? `✅ ${platformName} credentials verified successfully!`
          : this.generateSpecificErrorMessage(platformName, testResult),
        details: {
          ...testResult,
          platform: platformName,
          real_api_test: true,
          config_used: config.base_url + config.test_endpoint.path
        }
      };

    } catch (error: any) {
      console.error(`💥 Real testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Real API testing failed for ${platformName}: ${error.message}`,
        details: { 
          error: error.message,
          platform: platformName,
          system_error: true
        }
      };
    }
  }

  /**
   * PHASE 4: Perform Real API Test
   */
  static async performRealAPITest(config: any, credentials: Record<string, string>, platformName: string): Promise<any> {
    console.log(`📡 Making real API call to ${platformName}`);
    
    try {
      const { headers, url } = this.buildRealAuthHeaders(config, credentials, platformName);
      
      console.log(`🔗 Testing endpoint: ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: config.test_endpoint?.method || 'GET',
        headers,
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      const requestTime = Date.now() - startTime;

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText.substring(0, 200);
      }

      console.log(`📈 API Response: Status ${response.status}, Time ${requestTime}ms`);

      return {
        success: this.analyzeRealResponse(response, responseData, platformName),
        status_code: response.status,
        response_data: responseData,
        request_time_ms: requestTime,
        endpoint_tested: url,
        method_used: config.test_endpoint?.method || 'GET'
      };

    } catch (error: any) {
      console.error(`💥 API call failed for ${platformName}:`, error);
      
      return {
        success: false,
        status_code: 0,
        response_data: error.message,
        endpoint_tested: 'connection_failed',
        error_type: 'network_error'
      };
    }
  }

  /**
   * PHASE 5: Build Real Authentication Headers
   */
  static buildRealAuthHeaders(config: any, credentials: Record<string, string>, platformName: string): {headers: Record<string, string>, url: string} {
    console.log(`🔑 Building real auth headers for ${platformName}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Universal-Tester/2.0',
      'Accept': 'application/json'
    };

    let testUrl = config.base_url + (config.test_endpoint?.path || '/me');
    
    // Platform-specific authentication
    const platform = platformName.toLowerCase();
    
    switch (platform) {
      case 'openai':
        const openaiKey = credentials.api_key || credentials.key;
        if (openaiKey) {
          headers['Authorization'] = `Bearer ${openaiKey}`;
        }
        break;
        
      case 'typeform':
        const typeformToken = credentials.personal_access_token || credentials.token;
        if (typeformToken) {
          headers['Authorization'] = `Bearer ${typeformToken}`;
        }
        break;
        
      case 'google sheets':
      case 'google_sheets':
        const googleToken = credentials.access_token;
        const googleApiKey = credentials.api_key;
        if (googleToken) {
          headers['Authorization'] = `Bearer ${googleToken}`;
        } else if (googleApiKey) {
          testUrl += `?key=${googleApiKey}`;
        }
        break;
        
      default:
        // Universal auth logic
        const token = credentials.access_token || credentials.api_key || credentials.token || credentials.key;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return { headers, url: testUrl };
  }

  /**
   * PHASE 6: Analyze Real API Response
   */
  static analyzeRealResponse(response: Response, responseData: any, platformName: string): boolean {
    console.log(`🔍 Analyzing real API response for ${platformName}`);
    
    const status = response.status;
    
    // Success detection
    if (status >= 200 && status < 300) {
      // Platform-specific success validation
      const platform = platformName.toLowerCase();
      
      if (platform === 'openai' && responseData?.data) {
        return true; // OpenAI models endpoint returns data array
      }
      
      if (platform === 'typeform' && (responseData?.alias || responseData?.account_id)) {
        return true; // Typeform /me endpoint returns user info
      }
      
      if (platform === 'google sheets' || platform === 'google_sheets') {
        return true; // Google Sheets API access confirmed
      }
      
      // Generic success for other platforms
      if (typeof responseData === 'object' && responseData !== null) {
        return !responseData.error && !responseData.errors;
      }
      
      return true;
    }
    
    console.log(`❌ API failure - Status ${status} for ${platformName}`);
    return false;
  }

  /**
   * PHASE 7: Generate Platform-Specific Error Messages
   */
  static generateSpecificErrorMessage(platformName: string, testResult: any): string {
    const platform = platformName.toLowerCase();
    const status = testResult.status_code;
    
    switch (platform) {
      case 'openai':
        if (status === 401) return 'Invalid OpenAI API key. Please check that your key starts with "sk-" and is active.';
        if (status === 429) return 'OpenAI rate limit exceeded. Please wait before retrying.';
        if (status === 403) return 'OpenAI API access denied. Check your account status and billing.';
        return `OpenAI API error (${status}). Please verify your API key and account status.`;
        
      case 'typeform':
        if (status === 401) return 'Invalid Typeform Personal Access Token. Please check your token starts with "tfp_".';
        if (status === 403) return 'Insufficient Typeform permissions. Check your token scope.';
        return `Typeform API error (${status}). Please verify your Personal Access Token.`;
        
      case 'google sheets':
      case 'google_sheets':
        if (status === 401) return 'Invalid Google Sheets credentials. Please check your access token or API key.';
        if (status === 403) return 'Google Sheets access denied. Check your OAuth2 scopes or API key permissions.';
        return `Google Sheets API error (${status}). Please verify your credentials and permissions.`;
        
      default:
        if (status === 401) return `Invalid ${platformName} credentials. Please verify your authentication details.`;
        if (status === 403) return `${platformName} access denied. Check your account permissions.`;
        if (status === 429) return `${platformName} rate limit exceeded. Please wait before retrying.`;
        return `${platformName} API error (${status}). Please check your credentials and try again.`;
    }
  }

  /**
   * PHASE 8: Create Real Fallback Configuration
   */
  static createRealFallbackConfig(platformName: string): any {
    console.log(`⚠️ Creating real fallback config for ${platformName}`);
    
    const platform = platformName.toLowerCase();
    const configs = {
      'openai': {
        platform_name: 'OpenAI',
        base_url: 'https://api.openai.com',
        test_endpoint: { method: 'GET', path: '/v1/models', description: 'List available models' },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization', format: 'Bearer {api_key}' }
      },
      'typeform': {
        platform_name: 'Typeform',
        base_url: 'https://api.typeform.com',
        test_endpoint: { method: 'GET', path: '/me', description: 'Get user account info' },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization', format: 'Bearer {personal_access_token}' }
      },
      'google sheets': {
        platform_name: 'Google Sheets',
        base_url: 'https://sheets.googleapis.com',
        test_endpoint: { method: 'GET', path: '/v4/spreadsheets', description: 'Access Sheets API' },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization', format: 'Bearer {access_token}' }
      }
    };

    return configs[platform] || {
      platform_name: platformName,
      base_url: `https://api.${platform.replace(/\s+/g, '')}.com`,
      test_endpoint: { method: 'GET', path: '/me', description: `Test ${platformName} authentication` },
      auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization', format: 'Bearer {token}' }
    };
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
          credential_type: 'api_key',
          credentials: JSON.stringify(credentials),
          is_active: true,
          is_tested: true,
          test_status: 'success'
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
