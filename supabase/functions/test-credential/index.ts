
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// COMPREHENSIVE PLATFORM CONFIGURATIONS
const PLATFORM_CONFIGS = {
  'openai': {
    platform_name: 'OpenAI',
    base_url: 'https://api.openai.com',
    test_endpoint: { 
      method: 'POST', 
      path: '/v1/chat/completions',
      headers: { 'Authorization': 'Bearer {api_key}', 'Content-Type': 'application/json' },
      body: {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      },
      expected_success_indicators: ['choices', 'message', 'content', 'model'],
      expected_error_indicators: ['error', 'invalid_api_key', 'unauthorized', 'incorrect_api_key']
    },
    authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['api_key'],
    validation: {
      api_key: { prefix: 'sk-', min_length: 20 }
    }
  },
  'typeform': {
    platform_name: 'Typeform', 
    base_url: 'https://api.typeform.com',
    test_endpoint: { 
      method: 'GET', 
      path: '/me',
      headers: { 'Authorization': 'Bearer {personal_access_token}' },
      expected_success_indicators: ['alias', 'account_id', 'language', 'email'],
      expected_error_indicators: ['error', 'invalid', 'unauthorized', 'forbidden']
    },
    authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['personal_access_token'],
    validation: {
      personal_access_token: { prefix: 'tfp_', min_length: 15 }
    }
  },
  'google sheets': {
    platform_name: 'Google Sheets',
    base_url: 'https://sheets.googleapis.com',
    test_endpoint: { 
      method: 'GET', 
      path: '/v4/spreadsheets/{spreadsheet_id}',
      headers: { 'Authorization': 'Bearer {access_token}' },
      expected_success_indicators: ['spreadsheetId', 'properties', 'sheets'],
      expected_error_indicators: ['error', 'invalid_grant', 'unauthorized', 'invalid_token']
    },
    authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['access_token', 'spreadsheet_id'],
    validation: {
      access_token: { min_length: 20 },
      spreadsheet_id: { min_length: 10 }
    }
  },
  'notion': {
    platform_name: 'Notion',
    base_url: 'https://api.notion.com',
    test_endpoint: { 
      method: 'GET', 
      path: '/v1/users/me',
      headers: { 'Authorization': 'Bearer {integration_token}', 'Notion-Version': '2022-06-28' },
      expected_success_indicators: ['name', 'id', 'type', 'person'],
      expected_error_indicators: ['error', 'invalid', 'unauthorized']
    },
    authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['integration_token'],
    validation: {
      integration_token: { prefix: 'secret_', min_length: 20 }
    }
  },
  'slack': {
    platform_name: 'Slack',
    base_url: 'https://slack.com',
    test_endpoint: { 
      method: 'POST', 
      path: '/api/auth.test',
      headers: { 'Authorization': 'Bearer {bot_token}', 'Content-Type': 'application/json' },
      expected_success_indicators: ['ok', 'user_id', 'team_id'],
      expected_error_indicators: ['error', 'invalid_auth', 'account_inactive']
    },
    authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['bot_token'],
    validation: {
      bot_token: { prefix: 'xoxb-', min_length: 20 }
    }
  },
  'github': {
    platform_name: 'GitHub',
    base_url: 'https://api.github.com',
    test_endpoint: { 
      method: 'GET', 
      path: '/user',
      headers: { 'Authorization': 'Bearer {access_token}', 'User-Agent': 'YusrAI-Test' },
      expected_success_indicators: ['login', 'id', 'node_id'],
      expected_error_indicators: ['message', 'bad_credentials', 'requires_authentication']
    },
    authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['access_token'],
    validation: {
      access_token: { prefix: 'ghp_', min_length: 20 }
    }
  },
  'discord': {
    platform_name: 'Discord',
    base_url: 'https://discord.com/api',
    test_endpoint: { 
      method: 'GET', 
      path: '/users/@me',
      headers: { 'Authorization': 'Bot {bot_token}' },
      expected_success_indicators: ['id', 'username', 'discriminator'],
      expected_error_indicators: ['message', 'code', 'unauthorized']
    },
    authentication: { type: 'Bot', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['bot_token'],
    validation: {
      bot_token: { min_length: 50 }
    }
  },
  'salesforce': {
    platform_name: 'Salesforce',
    base_url: 'https://{instance_url}.salesforce.com',
    test_endpoint: { 
      method: 'GET', 
      path: '/services/data/v57.0/',
      headers: { 'Authorization': 'Bearer {access_token}' },
      expected_success_indicators: ['sobjects', 'encoding', 'maxBatchSize'],
      expected_error_indicators: ['error', 'error_description', 'invalid_grant']
    },
    authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' },
    credential_fields: ['access_token', 'instance_url'],
    validation: {
      access_token: { min_length: 15 },
      instance_url: { min_length: 5 }
    }
  }
};

class ComprehensiveCredentialTester {
  private supabase: any;
  private usageTracker: any;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.usageTracker = new Map();
  }

  /**
   * FIXED: Enhanced credential format validation with platform-specific rules
   */
  validateCredentialFormat(platformName: string, credentials: Record<string, string>): { valid: boolean; message: string } {
    console.log(`🔍 ENHANCED validation for ${platformName} with credentials:`, Object.keys(credentials));
    
    const platformKey = platformName.toLowerCase().replace(/\s+/g, ' ');
    const config = PLATFORM_CONFIGS[platformKey];
    
    if (!config) {
      console.warn(`⚠️ No specific config for ${platformName}, using generic validation`);
      const hasCredentials = Object.values(credentials).some(val => val && val.trim());
      return { 
        valid: hasCredentials, 
        message: hasCredentials ? `${platformName} credentials format validated` : `${platformName} credentials required` 
      };
    }

    // Check required fields
    for (const field of config.credential_fields) {
      if (!credentials[field] || !credentials[field].trim()) {
        return { 
          valid: false, 
          message: `${config.platform_name} requires ${field}. Please provide a valid ${field}.` 
        };
      }

      // Validate field format
      const validation = config.validation?.[field];
      if (validation) {
        const value = credentials[field];
        
        if (validation.prefix && !value.startsWith(validation.prefix)) {
          return { 
            valid: false, 
            message: `${config.platform_name} ${field} must start with "${validation.prefix}"` 
          };
        }
        
        if (validation.min_length && value.length < validation.min_length) {
          return { 
            valid: false, 
            message: `${config.platform_name} ${field} appears too short (minimum ${validation.min_length} characters)` 
          };
        }
      }
    }

    return { 
      valid: true, 
      message: `${config.platform_name} credentials format validated successfully` 
    };
  }

  /**
   * FIXED: Build real API request with proper credential substitution
   */
  buildRealAPIRequest(config: any, credentials: Record<string, string>): {url: string, options: any} {
    console.log(`🔧 Building REAL API request for ${config.platform_name}`);
    
    let url = config.base_url + config.test_endpoint.path;
    const headers = { ...config.test_endpoint.headers };
    
    // Substitute credentials in URL and headers
    Object.keys(credentials).forEach(credKey => {
      if (credentials[credKey]) {
        // Replace in URL
        url = url.replace(`{${credKey}}`, credentials[credKey]);
        
        // Replace in headers
        Object.keys(headers).forEach(headerKey => {
          headers[headerKey] = headers[headerKey].replace(`{${credKey}}`, credentials[credKey]);
        });
      }
    });

    // Handle special URL cases
    if (config.platform_name === 'Google Sheets' && !url.includes('spreadsheets/')) {
      // Use a test spreadsheet ID if none provided
      url = url.replace('/v4/spreadsheets/{spreadsheet_id}', '/v4/spreadsheets/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    }

    return {
      url,
      options: {
        method: config.test_endpoint.method || 'GET',
        headers: {
          ...headers,
          'User-Agent': 'YusrAI-Real-Credential-Tester/2.0'
        },
        signal: AbortSignal.timeout(15000),
        ...(config.test_endpoint.body && { body: JSON.stringify(config.test_endpoint.body) })
      }
    };
  }

  /**
   * FIXED: Perform real API test with comprehensive validation
   */
  async performRealAPITest(config: any, credentials: Record<string, string>, platformName: string): Promise<any> {
    console.log(`📡 Making REAL API call to ${platformName}`);
    
    try {
      const { url, options } = this.buildRealAPIRequest(config, credentials);
      
      console.log(`🔗 Testing REAL endpoint: ${options.method} ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, options);
      const requestTime = Date.now() - startTime;

      // Track usage for real API calls
      this.trackAPIUsage(platformName, requestTime, response.status);

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText.substring(0, 200);
      }

      console.log(`📊 REAL API Response: Status ${response.status}, Time ${requestTime}ms`);

      return {
        success: this.analyzeRealAPIResponse(response, responseData, config, platformName),
        status_code: response.status,
        response_data: responseData,
        request_time_ms: requestTime,
        endpoint_tested: url,
        method_used: options.method,
        real_api_call: true,
        platform_config: config.platform_name
      };

    } catch (error: any) {
      console.error(`💥 REAL API call failed for ${platformName}:`, error);
      
      return {
        success: false,
        status_code: 0,
        response_data: error.message,
        endpoint_tested: 'connection_failed',
        error_type: 'network_error',
        real_api_call: true,
        platform_config: platformName
      };
    }
  }

  /**
   * FIXED: Strengthened response analysis - requires BOTH success indicators AND no error indicators
   */
  analyzeRealAPIResponse(response: Response, responseData: any, config: any, platformName: string): boolean {
    console.log(`🔍 STRENGTHENED analysis for ${platformName} response`);
    
    const status = response.status;
    
    // First check HTTP status
    if (status < 200 || status >= 300) {
      console.log(`❌ ${platformName} failed HTTP status check: ${status}`);
      return false;
    }
    
    const testEndpoint = config.test_endpoint || {};
    const successIndicators = testEndpoint.expected_success_indicators || [];
    const errorIndicators = testEndpoint.expected_error_indicators || [];
    
    const responseString = JSON.stringify(responseData).toLowerCase();
    
    // Check for success indicators
    const hasSuccessIndicators = successIndicators.some((indicator: string) =>
      responseString.includes(indicator.toLowerCase())
    );
    
    // Check for error indicators
    const hasErrorIndicators = errorIndicators.some((indicator: string) =>
      responseString.includes(indicator.toLowerCase())
    );
    
    // FIXED: Strengthened logic - require BOTH success indicators AND no error indicators
    const isSuccess = hasSuccessIndicators && !hasErrorIndicators;
    
    console.log(`🎯 ${platformName} analysis result:`, {
      hasSuccessIndicators,
      hasErrorIndicators,
      finalResult: isSuccess
    });
    
    if (isSuccess) {
      console.log(`✅ ${platformName} REAL credentials verified successfully`);
      return true;
    }
    
    console.log(`❌ ${platformName} REAL credentials validation failed`);
    return false;
  }

  /**
   * Track API usage for real calls
   */
  trackAPIUsage(platformName: string, responseTime: number, statusCode: number): void {
    const usage = {
      platform: platformName,
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      status_code: statusCode,
      call_type: 'credential_test'
    };
    
    if (!this.usageTracker.has(platformName)) {
      this.usageTracker.set(platformName, []);
    }
    
    this.usageTracker.get(platformName).push(usage);
    console.log(`📊 Tracked API usage for ${platformName}:`, usage);
  }

  /**
   * Generate enhanced error messages with real API context
   */
  generateEnhancedErrorMessage(platformName: string, testResult: any): string {
    const status = testResult.status_code;
    const platform = platformName.toLowerCase();
    
    // Platform-specific error messages
    const platformErrors = {
      'openai': {
        401: 'OpenAI API key is invalid or expired. Please check your API key starts with "sk-" and is active.',
        403: 'OpenAI account access denied. Check your billing status and account standing.',
        429: 'OpenAI rate limit exceeded. Please wait before retrying or upgrade your plan.'
      },
      'typeform': {
        401: 'Typeform Personal Access Token is invalid. Please verify your token starts with "tfp_".',
        403: 'Typeform access denied. Check your token permissions and account status.'
      },
      'google sheets': {
        401: 'Google Sheets access token is invalid or expired. Please refresh your OAuth token.',
        403: 'Google Sheets access denied. Check your API permissions and spreadsheet sharing settings.'
      }
    };

    const specificError = platformErrors[platform]?.[status];
    if (specificError) return specificError;

    // Generic error messages
    switch (status) {
      case 401: return `${platformName} authentication failed. Please verify your credentials are correct and active.`;
      case 403: return `${platformName} access denied. Check your account permissions and API access.`;
      case 404: return `${platformName} API endpoint not found. The service may be unavailable.`;
      case 429: return `${platformName} rate limit exceeded. Please wait before retrying.`;
      case 0: return `Failed to connect to ${platformName}. Check your internet connection.`;
      default: return `${platformName} API error (${status}). Please verify your credentials and try again.`;
    }
  }

  /**
   * Main comprehensive testing function
   */
  async testPlatformCredentialsComprehensively(
    platformName: string,
    credentials: Record<string, string>
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`🚀 Starting COMPREHENSIVE test for ${platformName}`);

    try {
      // Step 1: Enhanced format validation
      const formatValidation = this.validateCredentialFormat(platformName, credentials);
      if (!formatValidation.valid) {
        return {
          success: false,
          message: formatValidation.message,
          details: {
            validation_failed: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime,
            comprehensive_test: true
          }
        };
      }

      // Step 2: Get platform configuration
      const platformKey = platformName.toLowerCase().replace(/\s+/g, ' ');
      const config = PLATFORM_CONFIGS[platformKey];
      
      if (!config) {
        console.warn(`⚠️ No comprehensive config for ${platformName}`);
        return {
          success: false,
          message: `${platformName} is not yet supported in our comprehensive testing system`,
          details: {
            unsupported_platform: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime
          }
        };
      }

      // Step 3: Perform real API test with comprehensive validation
      const testResult = await this.performRealAPITest(config, credentials, platformName);
      const totalTime = Date.now() - startTime;

      console.log(`🏁 Comprehensive testing completed for ${platformName} in ${totalTime}ms - ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: testResult.success,
        message: testResult.success 
          ? `✅ ${platformName} credentials verified successfully with REAL API testing! Ready for automation use.`
          : this.generateEnhancedErrorMessage(platformName, testResult),
        details: {
          // Real test results
          endpoint_tested: testResult.endpoint_tested,
          method_used: testResult.method_used,
          status_code: testResult.status_code,
          request_time_ms: testResult.request_time_ms,
          total_time_ms: totalTime,
          
          // Platform information
          platform: platformName,
          config_source: 'comprehensive_real_config',
          base_url: config.base_url,
          
          // Response preview (sanitized)
          api_response_preview: this.sanitizeResponse(testResult.response_data),
          
          // Testing markers
          comprehensive_test: true,
          real_api_call: true,
          format_validated: true,
          strengthened_validation: true,
          
          // Usage tracking
          usage_tracked: this.usageTracker.has(platformName)
        }
      };

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 Comprehensive testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Comprehensive testing system error for ${platformName}: ${error.message}`,
        details: {
          error_details: error.message,
          total_time_ms: totalTime,
          platform: platformName,
          system_error: true,
          comprehensive_test: true
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platformName, credentials } = await req.json();

    if (!platformName || !credentials) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Platform name and credentials are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize the comprehensive credential tester
    const tester = new ComprehensiveCredentialTester(supabase);

    // Test platform credentials with comprehensive validation
    const result = await tester.testPlatformCredentialsComprehensively(platformName, credentials);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in comprehensive test-credential function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Comprehensive server error: ${error.message}`,
        details: {
          error_type: 'comprehensive_server_error',
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
