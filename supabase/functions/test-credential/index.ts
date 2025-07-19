import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class FullyDynamicCredentialTester {
  private supabase: any;
  private usageTracker: any;

  constructor(supabase: any) {
    this.supabase = supabase;
    this.usageTracker = new Map();
  }

  /**
   * ENHANCED: Generate AI test configurations for platforms that don't have them
   */
  async generateAITestConfiguration(platformName: string): Promise<any> {
    console.log(`🤖 ENHANCED: Generating AI test configuration for ${platformName}`);
    
    try {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        console.error('❌ OpenAI API key not configured');
        return null;
      }

      const prompt = `Generate a comprehensive test configuration for platform "${platformName}" with the following JSON structure:
{
  "base_url": "https://api.${platformName.toLowerCase()}.com",
  "test_endpoint": {
    "method": "GET",
    "path": "/api/v1/me" or appropriate endpoint,
    "headers": {
      "Authorization": "Bearer {access_token}" or appropriate auth,
      "Content-Type": "application/json"
    }
  },
  "authentication": {
    "location": "header",
    "parameter_name": "Authorization",
    "format": "Bearer {access_token}"
  },
  "validation_rules": {
    "access_token": {
      "min_length": 20,
      "prefix": "optional_prefix"
    }
  },
  "expected_success_indicators": ["user", "id", "name"],
  "expected_error_indicators": ["error", "unauthorized", "invalid"],
  "error_patterns": {
    "401": "Invalid or expired access token",
    "403": "Access denied - check permissions",
    "404": "API endpoint not found"
  }
}

Make this specific to ${platformName} platform with realistic API endpoints and authentication methods.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an API integration expert. Generate realistic test configurations for platform APIs. Always respond with valid JSON only.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error('❌ OpenAI API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      const generatedConfig = data.choices[0].message.content;
      
      try {
        const parsedConfig = JSON.parse(generatedConfig);
        console.log(`✅ ENHANCED: Generated AI test configuration for ${platformName}`);
        return parsedConfig;
      } catch (parseError) {
        console.error('❌ Failed to parse AI-generated config:', parseError);
        return null;
      }

    } catch (error) {
      console.error(`❌ Error generating AI test configuration for ${platformName}:`, error);
      return null;
    }
  }

  /**
   * ENHANCED: Get or generate test configuration for a platform
   */
  async getOrGenerateTestConfig(platformName: string): Promise<any> {
    // ENHANCED: Built-in configurations for common platforms
    const builtInConfigs: Record<string, any> = {
      'typeform': {
        base_url: 'https://api.typeform.com',
        test_endpoint: {
          method: 'GET',
          path: '/me',
          headers: {
            'Authorization': 'Bearer {access_token}',
            'Content-Type': 'application/json'
          }
        },
        authentication: {
          location: 'header',
          parameter_name: 'Authorization',
          format: 'Bearer {access_token}'
        },
        validation_rules: {
          access_token: {
            min_length: 20,
            prefix: 'tfp_'
          }
        },
        expected_success_indicators: ['email', 'account_id', 'alias'],
        expected_error_indicators: ['error', 'message'],
        error_patterns: {
          '401': 'Invalid Typeform access token',
          '403': 'Access denied - check Typeform permissions',
          '404': 'Typeform API endpoint not found'
        }
      },
      'slack': {
        base_url: 'https://slack.com/api',
        test_endpoint: {
          method: 'GET',
          path: '/auth.test',
          headers: {
            'Authorization': 'Bearer {bot_token}',
            'Content-Type': 'application/json'
          }
        },
        authentication: {
          location: 'header',
          parameter_name: 'Authorization',
          format: 'Bearer {bot_token}'
        },
        validation_rules: {
          bot_token: {
            min_length: 20,
            prefix: 'xoxb-'
          }
        },
        expected_success_indicators: ['ok', 'user_id', 'team_id'],
        expected_error_indicators: ['error'],
        error_patterns: {
          '401': 'Invalid Slack bot token',
          '403': 'Access denied - check Slack app permissions'
        }
      },
      'discord': {
        base_url: 'https://discord.com/api/v10',
        test_endpoint: {
          method: 'GET',
          path: '/users/@me',
          headers: {
            'Authorization': 'Bot {bot_token}',
            'Content-Type': 'application/json'
          }
        },
        authentication: {
          location: 'header',
          parameter_name: 'Authorization',
          format: 'Bot {bot_token}'
        },
        validation_rules: {
          bot_token: {
            min_length: 50
          }
        },
        expected_success_indicators: ['id', 'username', 'discriminator'],
        expected_error_indicators: ['code', 'message'],
        error_patterns: {
          '401': 'Invalid Discord bot token',
          '403': 'Access denied - check Discord bot permissions'
        }
      }
    };

    const platformKey = platformName.toLowerCase();
    
    // Check if we have a built-in configuration
    if (builtInConfigs[platformKey]) {
      console.log(`✅ ENHANCED: Using built-in configuration for ${platformName}`);
      return builtInConfigs[platformKey];
    }

    // ENHANCED: Generate AI configuration for unknown platforms
    console.log(`🤖 ENHANCED: No built-in config for ${platformName}, generating with AI...`);
    const aiConfig = await this.generateAITestConfiguration(platformName);
    
    if (aiConfig) {
      console.log(`✅ ENHANCED: Successfully generated AI config for ${platformName}`);
      return aiConfig;
    }

    // Fallback generic configuration
    console.log(`⚠️ ENHANCED: Using fallback generic configuration for ${platformName}`);
    return {
      base_url: `https://api.${platformKey}.com`,
      test_endpoint: {
        method: 'GET',
        path: '/api/v1/me',
        headers: {
          'Authorization': 'Bearer {access_token}',
          'Content-Type': 'application/json'
        }
      },
      authentication: {
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}'
      },
      validation_rules: {
        access_token: {
          min_length: 10
        }
      },
      expected_success_indicators: ['user', 'id'],
      expected_error_indicators: ['error'],
      error_patterns: {
        '401': `Invalid ${platformName} access token`,
        '403': `Access denied - check ${platformName} permissions`
      }
    };
  }

  /**
   * FULLY DYNAMIC: Test credentials using AI-generated configuration ONLY
   */
  async testPlatformCredentialsComprehensively(
    platformName: string,
    credentials: Record<string, string>,
    testConfig?: any,
    userId?: string
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`🚀 ENHANCED DYNAMIC TESTING: ${platformName}`);

    try {
      // ENHANCED: Get or generate test configuration
      const finalTestConfig = testConfig || await this.getOrGenerateTestConfig(platformName);
      
      if (!finalTestConfig) {
        return {
          success: false,
          message: `Could not generate test configuration for ${platformName}`,
          details: {
            config_generation_failed: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime
          }
        };
      }

      console.log(`🔧 ENHANCED: Using test configuration for ${platformName}:`, Object.keys(finalTestConfig));

      // Step 1: Validate configuration
      const configValidation = this.validateAIConfig(finalTestConfig);
      if (!configValidation.valid) {
        return {
          success: false,
          message: `Configuration validation failed: ${configValidation.message}`,
          details: {
            validation_failed: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime,
            config_error: configValidation.message
          }
        };
      }

      // Step 2: Enhanced format validation using AI rules
      const formatValidation = this.validateCredentialFormatDynamic(platformName, credentials, finalTestConfig);
      if (!formatValidation.valid) {
        return {
          success: false,
          message: formatValidation.message,
          details: {
            validation_failed: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime,
            format_validation_error: true
          }
        };
      }

      // Step 3: Perform real API test
      const testResult = await this.performDynamicAPITest(finalTestConfig, credentials, platformName);
      const totalTime = Date.now() - startTime;

      // Step 4: Track API usage in database
      if (userId) {
        await this.trackAPIUsageInDatabase(
          userId,
          platformName,
          testResult.endpoint_tested || 'unknown',
          testResult.method_used || 'GET',
          testResult.status_code,
          testResult.request_time_ms || 0,
          testResult.success
        );
      }

      console.log(`🏁 ENHANCED: Testing completed for ${platformName} in ${totalTime}ms - ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: testResult.success,
        message: testResult.success 
          ? `✅ ${platformName} credentials verified successfully! Ready for automation use.`
          : this.generateDynamicErrorMessage(platformName, testResult, finalTestConfig),
        details: {
          // Real test results
          endpoint_tested: testResult.endpoint_tested,
          method_used: testResult.method_used,
          status_code: testResult.status_code,
          request_time_ms: testResult.request_time_ms,
          total_time_ms: totalTime,
          
          // Platform information
          platform: platformName,
          config_source: testConfig ? 'provided' : 'ai_generated',
          base_url: finalTestConfig.base_url,
          
          // Response preview (sanitized)
          api_response_preview: this.sanitizeResponse(testResult.response_data),
          
          // Testing markers
          enhanced_dynamic_test: true,
          real_api_call: true,
          format_validated: true,
          config_validated: true,
          
          // Usage tracking
          usage_tracked: this.usageTracker.has(platformName)
        }
      };

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 ENHANCED: Testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Enhanced testing system error for ${platformName}: ${error.message}`,
        details: {
          error_details: error.message,
          total_time_ms: totalTime,
          platform: platformName,
          system_error: true,
          enhanced_dynamic_test: true
        }
      };
    }
  }

  /**
   * DYNAMIC: Validate AI-generated configuration
   */
  validateAIConfig(testConfig: any): { valid: boolean; message: string } {
    console.log(`🔍 Validating configuration:`, Object.keys(testConfig || {}));
    
    if (!testConfig) {
      return { valid: false, message: 'No configuration provided' };
    }

    if (!testConfig.base_url) {
      return { valid: false, message: 'Configuration missing base_url' };
    }

    if (!testConfig.test_endpoint) {
      return { valid: false, message: 'Configuration missing test_endpoint' };
    }

    if (!testConfig.test_endpoint.method) {
      return { valid: false, message: 'Configuration missing test_endpoint.method' };
    }

    if (!testConfig.test_endpoint.path) {
      return { valid: false, message: 'Configuration missing test_endpoint.path' };
    }

    console.log(`✅ Configuration validated successfully`);
    return { valid: true, message: 'Configuration is valid' };
  }

  /**
   * DYNAMIC: Enhanced credential format validation using AI rules
   */
  validateCredentialFormatDynamic(platformName: string, credentials: Record<string, string>, testConfig: any): { valid: boolean; message: string } {
    console.log(`🔍 DYNAMIC validation for ${platformName} using AI rules`);
    
    const validationRules = testConfig.validation_rules || {};
    
    // Check if we have any credentials
    const hasCredentials = Object.values(credentials).some(val => val && val.trim());
    if (!hasCredentials) {
      return { 
        valid: false, 
        message: `${platformName} requires credentials. Please provide valid credentials.` 
      };
    }

    // Apply AI-generated validation rules
    for (const [field, rules] of Object.entries(validationRules)) {
      const value = credentials[field];
      
      if (!value || !value.trim()) {
        return { 
          valid: false, 
          message: `${platformName} requires ${field}. Please provide a valid ${field}.` 
        };
      }

      // Apply AI validation rules
      if (typeof rules === 'object' && rules !== null) {
        const validationRule = rules as any;
        
        if (validationRule.prefix && !value.startsWith(validationRule.prefix)) {
          return { 
            valid: false, 
            message: `${platformName} ${field} must start with "${validationRule.prefix}"` 
          };
        }
        
        if (validationRule.min_length && value.length < validationRule.min_length) {
          return { 
            valid: false, 
            message: `${platformName} ${field} appears too short (minimum ${validationRule.min_length} characters)` 
          };
        }

        if (validationRule.max_length && value.length > validationRule.max_length) {
          return { 
            valid: false, 
            message: `${platformName} ${field} appears too long (maximum ${validationRule.max_length} characters)` 
          };
        }

        if (validationRule.pattern) {
          const regex = new RegExp(validationRule.pattern);
          if (!regex.test(value)) {
            return { 
              valid: false, 
              message: `${platformName} ${field} format is invalid` 
            };
          }
        }
      }
    }

    return { 
      valid: true, 
      message: `${platformName} credentials format validated successfully using AI rules` 
    };
  }

  /**
   * DYNAMIC: Build real API request using AI-generated configuration
   */
  buildDynamicAPIRequest(testConfig: any, credentials: Record<string, string>): {url: string, options: any} {
    console.log(`🔧 Building DYNAMIC API request using AI config`);
    
    let url = testConfig.base_url + testConfig.test_endpoint.path;
    const headers = { ...testConfig.test_endpoint.headers } || {};
    
    // Apply AI-generated authentication configuration
    if (testConfig.authentication) {
      const auth = testConfig.authentication;
      
      if (auth.location === 'header') {
        const credentialValue = this.getCredentialValueDynamic(credentials, testConfig.field_mappings || {}, auth);
        if (credentialValue) {
          headers[auth.parameter_name] = auth.format.replace(/\{[\w_]+\}/g, credentialValue);
        }
      } else if (auth.location === 'query') {
        const credentialValue = this.getCredentialValueDynamic(credentials, testConfig.field_mappings || {}, auth);
        if (credentialValue) {
          const separator = url.includes('?') ? '&' : '?';
          url += `${separator}${auth.parameter_name}=${credentialValue}`;
        }
      }
    } else {
      // Dynamic credential substitution in headers
      Object.keys(headers).forEach(headerKey => {
        Object.keys(credentials).forEach(credKey => {
          if (credentials[credKey]) {
            headers[headerKey] = headers[headerKey].replace(`{${credKey}}`, credentials[credKey]);
            headers[headerKey] = headers[headerKey].replace(`{token}`, credentials[credKey]);
            headers[headerKey] = headers[headerKey].replace(`{access_token}`, credentials[credKey]);
            headers[headerKey] = headers[headerKey].replace(`{api_key}`, credentials[credKey]);
            headers[headerKey] = headers[headerKey].replace(`{bot_token}`, credentials[credKey]);
          }
        });
      });
    }

    // Add query parameters if specified in AI config
    if (testConfig.test_endpoint.query_params) {
      const queryString = new URLSearchParams(testConfig.test_endpoint.query_params).toString();
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}${queryString}`;
    }

    console.log(`🔗 Testing DYNAMIC endpoint: ${testConfig.test_endpoint.method} ${url}`);

    return {
      url,
      options: {
        method: testConfig.test_endpoint.method || 'GET',
        headers: {
          ...headers,
          'User-Agent': 'YusrAI-Enhanced-Dynamic-Tester/6.0'
        },
        signal: AbortSignal.timeout(15000),
        ...(testConfig.test_endpoint.body && { body: JSON.stringify(testConfig.test_endpoint.body) })
      }
    };
  }

  /**
   * DYNAMIC: Get credential value using AI field mappings
   */
  getCredentialValueDynamic(
    credentials: Record<string, string>,
    fieldMappings: Record<string, string>,
    authentication: any
  ): string | null {
    // Try AI field mapping first
    for (const [platformField, userField] of Object.entries(fieldMappings)) {
      if (credentials[userField]) {
        return credentials[userField];
      }
      if (credentials[platformField]) {
        return credentials[platformField];
      }
    }

    // Try common patterns as fallback
    const commonPatterns = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token', 'personal_access_token'];
    for (const pattern of commonPatterns) {
      if (credentials[pattern]) {
        return credentials[pattern];
      }
    }

    return null;
  }

  /**
   * DYNAMIC: Perform real API test with AI configuration
   */
  async performDynamicAPITest(testConfig: any, credentials: Record<string, string>, platformName: string): Promise<any> {
    console.log(`📡 Making DYNAMIC API call to ${platformName} using AI config`);
    
    try {
      const { url, options } = this.buildDynamicAPIRequest(testConfig, credentials);
      
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

      console.log(`📊 DYNAMIC API Response: Status ${response.status}, Time ${requestTime}ms`);

      return {
        success: this.analyzeDynamicAPIResponse(response, responseData, testConfig, platformName),
        status_code: response.status,
        response_data: responseData,
        request_time_ms: requestTime,
        endpoint_tested: url,
        method_used: options.method,
        ai_dynamic_call: true,
        platform_config: platformName
      };

    } catch (error: any) {
      console.error(`💥 DYNAMIC API call failed for ${platformName}:`, error);
      
      return {
        success: false,
        status_code: 0,
        response_data: error.message,
        endpoint_tested: 'connection_failed',
        error_type: 'network_error',
        ai_dynamic_call: true,
        platform_config: platformName
      };
    }
  }

  /**
   * DYNAMIC: Analyze response using AI success patterns
   */
  analyzeDynamicAPIResponse(response: Response, responseData: any, testConfig: any, platformName: string): boolean {
    console.log(`🔍 DYNAMIC analysis for ${platformName} response using AI patterns`);
    
    const status = response.status;
    
    // First check HTTP status
    if (status < 200 || status >= 300) {
      console.log(`❌ ${platformName} failed HTTP status check: ${status}`);
      return false;
    }
    
    const successIndicators = testConfig.expected_success_indicators || [];
    const errorIndicators = testConfig.expected_error_indicators || [];
    
    const responseString = JSON.stringify(responseData).toLowerCase();
    
    // Check for AI-generated success indicators
    const hasSuccessIndicators = successIndicators.length === 0 || successIndicators.some((indicator: string) =>
      responseString.includes(indicator.toLowerCase())
    );
    
    // Check for AI-generated error indicators
    const hasErrorIndicators = errorIndicators.some((indicator: string) =>
      responseString.includes(indicator.toLowerCase())
    );
    
    // DYNAMIC logic - require success indicators AND no error indicators
    const isSuccess = hasSuccessIndicators && !hasErrorIndicators;
    
    console.log(`🎯 ${platformName} DYNAMIC analysis result:`, {
      hasSuccessIndicators,
      hasErrorIndicators,
      finalResult: isSuccess,
      enhancedGenerated: true
    });
    
    if (isSuccess) {
      console.log(`✅ ${platformName} DYNAMIC credentials verified successfully`);
      return true;
    }
    
    console.log(`❌ ${platformName} DYNAMIC credentials validation failed`);
    return false;
  }

  /**
   * Generate dynamic error messages
   */
  generateDynamicErrorMessage(platformName: string, testResult: any, testConfig: any): string {
    const status = testResult.status_code;
    
    // Use AI-generated error patterns if available
    if (testConfig.error_patterns && testConfig.error_patterns[status.toString()]) {
      return `${platformName} ${testConfig.error_patterns[status.toString()]}`;
    }

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
   * Track API usage for real calls
   */
  trackAPIUsage(platformName: string, responseTime: number, statusCode: number): void {
    const usage = {
      platform: platformName,
      timestamp: new Date().toISOString(),
      response_time: responseTime,
      status_code: statusCode,
      call_type: 'enhanced_credential_test'
    };
    
    if (!this.usageTracker.has(platformName)) {
      this.usageTracker.set(platformName, []);
    }
    
    this.usageTracker.get(platformName).push(usage);
    console.log(`📊 Tracked ENHANCED API usage for ${platformName}:`, usage);
  }

  /**
   * Track API usage in Supabase database
   */
  async trackAPIUsageInDatabase(
    userId: string,
    platformName: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    isSuccess: boolean
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('api_usage_logs')
        .insert({
          user_id: userId,
          platform_name: platformName,
          endpoint: endpoint,
          method: method,
          status_code: statusCode,
          response_time_ms: responseTimeMs,
          is_success: isSuccess
        });

      if (error) {
        console.error("Error tracking API usage in database:", error.message);
      } else {
        console.log(`✅ ENHANCED API usage tracked in database for ${platformName}`);
      }
    } catch (e) {
      console.error("Exception in trackAPIUsageInDatabase:", e.message);
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
    const { platformName, credentials, testConfig, userId } = await req.json();

    if (!platformName || !credentials) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Platform name and credentials are required for enhanced testing' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎯 ENHANCED TESTING REQUEST: ${platformName}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize the enhanced credential tester
    const tester = new FullyDynamicCredentialTester(supabase);

    // Test platform credentials with enhanced AI configuration
    const result = await tester.testPlatformCredentialsComprehensively(platformName, credentials, testConfig, userId);

    console.log(`🎯 ENHANCED TESTING RESULT for ${platformName}:`, result.success ? 'SUCCESS' : 'FAILED');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('💥 Error in enhanced test-credential function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Enhanced server error: ${error.message}`,
        details: {
          error_type: 'enhanced_server_error',
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
