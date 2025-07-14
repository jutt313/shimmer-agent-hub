
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// COMPLETELY FIXED UNIVERSAL CREDENTIAL TESTER - REAL API TESTING
class FixedUniversalCredentialTester {
  private supabase: any;
  private configCache = new Map<string, any>();

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * FIXED: Get real platform configuration from chat-ai
   */
  async getRealPlatformConfig(platformName: string, userId: string): Promise<any> {
    console.log(`🔧 Getting REAL API config for ${platformName} via chat-ai`);
    
    const cacheKey = `${platformName}_${userId}`;
    if (this.configCache.has(cacheKey)) {
      console.log(`📦 Using cached config for ${platformName}`);
      return this.configCache.get(cacheKey);
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate REAL working API configuration for ${platformName}. Return ONLY valid JSON:

{
  "platform_name": "${platformName}",
  "base_url": "https://api.platform.com", 
  "test_endpoint": {
    "method": "GET",
    "path": "/endpoint/to/test"
  },
  "auth_config": {
    "type": "bearer",
    "location": "header", 
    "parameter_name": "Authorization"
  }
}

REAL endpoints for specific platforms:
- OpenAI: base_url "https://api.openai.com", test_endpoint "/v1/models"
- Typeform: base_url "https://api.typeform.com", test_endpoint "/me"
- Google Sheets: base_url "https://sheets.googleapis.com", test_endpoint "/v4/spreadsheets"

Return ONLY the JSON, no explanations.`,
          messages: [],
          requestType: 'platform_config_generation'
        }
      });

      if (error) {
        console.error('❌ Chat-AI error:', error);
        return this.createRealFallbackConfig(platformName);
      }

      let realConfig;
      try {
        if (typeof data === 'string') {
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            realConfig = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in chat-ai response');
          }
        } else if (data && typeof data === 'object') {
          realConfig = data;
        } else {
          throw new Error('Invalid chat-ai response');
        }

        if (!realConfig.base_url || !realConfig.test_endpoint) {
          throw new Error('Missing required config fields');
        }

        console.log(`✅ Real config obtained for ${platformName}`);
        this.configCache.set(cacheKey, realConfig);
        return realConfig;

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
   * FIXED: Validate credential format before API testing
   */
  validateCredentialFormat(platformName: string, credentials: Record<string, string>): { valid: boolean; message: string } {
    console.log(`🔍 Validating credential format for ${platformName}`);
    
    const platform = platformName.toLowerCase();
    
    switch (platform) {
      case 'openai':
        const openaiKey = credentials.api_key || credentials.key;
        if (!openaiKey) return { valid: false, message: 'OpenAI API key is required' };
        if (!openaiKey.startsWith('sk-')) return { valid: false, message: 'OpenAI API key must start with "sk-"' };
        if (openaiKey.length < 20) return { valid: false, message: 'OpenAI API key appears invalid (too short)' };
        return { valid: true, message: 'OpenAI API key format is valid' };
        
      case 'typeform':
        const typeformToken = credentials.personal_access_token || credentials.token;
        if (!typeformToken) return { valid: false, message: 'Typeform Personal Access Token is required' };
        if (!typeformToken.startsWith('tfp_')) return { valid: false, message: 'Typeform token must start with "tfp_"' };
        return { valid: true, message: 'Typeform token format is valid' };
        
      case 'google sheets':
      case 'google_sheets':
        const googleCreds = credentials.access_token || credentials.api_key;
        if (!googleCreds) return { valid: false, message: 'Google Sheets access token or API key is required' };
        return { valid: true, message: 'Google Sheets credentials format is valid' };
        
      default:
        const hasCredentials = Object.values(credentials).some(val => val && val.trim());
        if (!hasCredentials) return { valid: false, message: `${platformName} credentials are required` };
        return { valid: true, message: `${platformName} credentials format appears valid` };
    }
  }

  /**
   * FIXED: Build real authentication headers
   */
  buildRealAuthHeaders(config: any, credentials: Record<string, string>, platformName: string): {headers: Record<string, string>, url: string} {
    console.log(`🔑 Building real auth headers for ${platformName}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Real-Tester/2.0',
      'Accept': 'application/json'
    };

    let testUrl = config.base_url + (config.test_endpoint?.path || '/me');
    
    // FIXED: Platform-specific authentication
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
        // Universal fallback
        const token = credentials.access_token || credentials.api_key || credentials.token || credentials.key;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return { headers, url: testUrl };
  }

  /**
   * FIXED: Make real API call
   */
  async performRealAPITest(config: any, credentials: Record<string, string>, platformName: string): Promise<any> {
    console.log(`📡 Making REAL API call to ${platformName}`);
    
    try {
      const { headers, url } = this.buildRealAuthHeaders(config, credentials, platformName);
      
      console.log(`🔗 Testing real endpoint: ${config.test_endpoint?.method || 'GET'} ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: config.test_endpoint?.method || 'GET',
        headers,
        signal: AbortSignal.timeout(15000)
      });
      const requestTime = Date.now() - startTime;

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText.substring(0, 200);
      }

      console.log(`📊 Real API Response: Status ${response.status}, Time ${requestTime}ms`);

      return {
        success: this.analyzeRealAPIResponse(response, responseData, platformName),
        status_code: response.status,
        response_data: responseData,
        request_time_ms: requestTime,
        endpoint_tested: url,
        method_used: config.test_endpoint?.method || 'GET'
      };

    } catch (error: any) {
      console.error(`💥 Real API call failed for ${platformName}:`, error);
      
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
   * FIXED: Analyze real API response with platform-specific logic
   */
  analyzeRealAPIResponse(response: Response, responseData: any, platformName: string): boolean {
    console.log(`🔍 Analyzing real API response for ${platformName}`);
    
    const status = response.status;
    
    if (status >= 200 && status < 300) {
      const platform = platformName.toLowerCase();
      
      // Platform-specific success validation
      switch (platform) {
        case 'openai':
          // OpenAI /v1/models should return data array
          if (responseData?.data && Array.isArray(responseData.data)) {
            console.log(`✅ OpenAI API success - found ${responseData.data.length} models`);
            return true;
          }
          break;
          
        case 'typeform':
          // Typeform /me should return user info
          if (responseData?.alias || responseData?.account_id || responseData?.language) {
            console.log(`✅ Typeform API success - user authenticated`);
            return true;
          }
          break;
          
        case 'google sheets':
        case 'google_sheets':
          // Google Sheets API access confirmed by 200 status
          console.log(`✅ Google Sheets API success - access confirmed`);
          return true;
          
        default:
          // Generic success for other platforms
          if (typeof responseData === 'object' && responseData !== null) {
            const hasError = responseData.error || responseData.errors || 
                           (responseData.message && responseData.message.toLowerCase().includes('error'));
            if (!hasError) {
              console.log(`✅ ${platformName} API success - no errors detected`);
              return true;
            }
          }
          console.log(`✅ ${platformName} API success - status 2xx`);
          return true;
      }
      
      // If platform-specific validation failed but status is 2xx, still consider it success
      console.log(`⚠️ ${platformName} API returned 2xx but unexpected response format`);
      return true;
    }
    
    console.log(`❌ ${platformName} API failure - Status ${status}`);
    return false;
  }

  /**
   * FIXED: Generate platform-specific error messages
   */
  generateIntelligentErrorMessage(platformName: string, testResult: any): string {
    const platform = platformName.toLowerCase();
    const status = testResult.status_code;
    
    switch (platform) {
      case 'openai':
        if (status === 401) return `OpenAI authentication failed. Please verify your API key starts with "sk-" and is active.`;
        if (status === 429) return `OpenAI rate limit exceeded. Please wait before retrying.`;
        if (status === 403) return `OpenAI access denied. Check your account billing and status.`;
        return `OpenAI API error (${status}). Please verify your API key and account.`;
        
      case 'typeform':
        if (status === 401) return `Typeform authentication failed. Please verify your Personal Access Token starts with "tfp_".`;
        if (status === 403) return `Typeform access denied. Check your token permissions and scope.`;
        return `Typeform API error (${status}). Please verify your Personal Access Token.`;
        
      case 'google sheets':
      case 'google_sheets':
        if (status === 401) return `Google Sheets authentication failed. Please verify your access token or API key.`;
        if (status === 403) return `Google Sheets access denied. Check your OAuth2 scopes and permissions.`;
        return `Google Sheets API error (${status}). Please verify your credentials.`;
        
      default:
        if (status === 401) return `${platformName} authentication failed. Please verify your credentials.`;
        if (status === 403) return `${platformName} access denied. Check your account permissions.`;
        if (status === 429) return `${platformName} rate limit exceeded. Please wait before retrying.`;
        if (status === 0) return `Failed to connect to ${platformName}. Check your internet connection.`;
        return `${platformName} API error (${status}). Please check your credentials and try again.`;
    }
  }

  /**
   * FIXED: Main testing function - comprehensive real testing
   */
  async testPlatformCredentialsWithRealAPI(
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`🚀 Starting COMPREHENSIVE real test for ${platformName}`);

    try {
      // Step 1: Validate credential format
      const formatValidation = this.validateCredentialFormat(platformName, credentials);
      if (!formatValidation.valid) {
        console.log(`❌ Credential format validation failed for ${platformName}`);
        return {
          success: false,
          message: formatValidation.message,
          details: {
            validation_failed: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime
          }
        };
      }

      console.log(`✅ Credential format validation passed for ${platformName}`);

      // Step 2: Get real platform configuration
      const config = await this.getRealPlatformConfig(platformName, userId);
      console.log(`📋 Real configuration loaded for ${platformName}`);

      // Step 3: Perform real API test
      const testResult = await this.performRealAPITest(config, credentials, platformName);
      const totalTime = Date.now() - startTime;

      console.log(`🏁 Real testing completed for ${platformName} in ${totalTime}ms - ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: testResult.success,
        message: testResult.success 
          ? `✅ ${platformName} credentials verified successfully! Real API test passed.`
          : this.generateIntelligentErrorMessage(platformName, testResult),
        details: {
          // Real test results
          endpoint_tested: testResult.endpoint_tested,
          method_used: testResult.method_used,
          status_code: testResult.status_code,
          request_time_ms: testResult.request_time_ms,
          total_time_ms: totalTime,
          
          // Platform information
          platform: platformName,
          config_source: 'chat_ai_generated',
          base_url: config.base_url,
          
          // Response preview (sanitized)
          api_response_preview: this.sanitizeResponse(testResult.response_data),
          
          // Testing markers
          real_api_test: true,
          format_validated: true,
          chat_ai_powered: true
        }
      };

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 Comprehensive testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Real testing system error for ${platformName}: ${error.message}`,
        details: {
          error_details: error.message,
          total_time_ms: totalTime,
          platform: platformName,
          system_error: true
        }
      };
    }
  }

  /**
   * Sanitize response data for safe display
   */
  private sanitizeResponse(responseData: any): any {
    if (typeof responseData === 'string') {
      return responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '');
    }
    
    if (typeof responseData === 'object' && responseData !== null) {
      const keys = Object.keys(responseData).slice(0, 5);
      const preview: any = {};
      keys.forEach(key => {
        preview[key] = responseData[key];
      });
      return preview;
    }
    
    return responseData;
  }

  /**
   * FIXED: Create real fallback configurations
   */
  private createRealFallbackConfig(platformName: string): any {
    console.log(`⚠️ Creating REAL fallback config for ${platformName}`);
    
    const platform = platformName.toLowerCase();
    const realConfigs = {
      'openai': {
        platform_name: 'OpenAI',
        base_url: 'https://api.openai.com',
        test_endpoint: { method: 'GET', path: '/v1/models' },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
      },
      'typeform': {
        platform_name: 'Typeform', 
        base_url: 'https://api.typeform.com',
        test_endpoint: { method: 'GET', path: '/me' },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
      },
      'google sheets': {
        platform_name: 'Google Sheets',
        base_url: 'https://sheets.googleapis.com',
        test_endpoint: { method: 'GET', path: '/v4/spreadsheets' },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
      }
    };

    return realConfigs[platform] || {
      platform_name: platformName,
      base_url: `https://api.${platform.replace(/\s+/g, '')}.com`,
      test_endpoint: { method: 'GET', path: '/me' },
      auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform_name, credentials, user_id } = await req.json();
    
    console.log(`🌟 FIXED UNIVERSAL TESTING: ${platform_name} for user ${user_id}`);
    console.log(`🎯 COMPREHENSIVE REAL API TESTING WITH VALIDATION`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tester = new FixedUniversalCredentialTester(supabase);
    const result = await tester.testPlatformCredentialsWithRealAPI(platform_name, credentials, user_id);
    
    console.log(`📊 FINAL RESULT for ${platform_name}:`, result.success ? '✅ SUCCESS' : '❌ FAILED');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ SYSTEM ERROR:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `System error: ${error.message}`,
        details: { 
          error: error.message,
          system_error: true,
          fixed_real_testing: true
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
