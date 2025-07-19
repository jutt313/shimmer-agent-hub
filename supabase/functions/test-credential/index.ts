
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
   * FULLY DYNAMIC: Test credentials using AI-generated configuration ONLY
   */
  async testPlatformCredentialsComprehensively(
    platformName: string,
    credentials: Record<string, string>,
    testConfig: any,
    userId?: string
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`🚀 FULLY DYNAMIC TESTING: ${platformName} with AI-generated config`);

    try {
      // Step 1: Validate AI-generated configuration
      const configValidation = this.validateAIConfig(testConfig);
      if (!configValidation.valid) {
        return {
          success: false,
          message: `AI configuration validation failed: ${configValidation.message}`,
          details: {
            validation_failed: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime,
            ai_dynamic_test: true,
            config_error: configValidation.message
          }
        };
      }

      // Step 2: Enhanced format validation using AI rules
      const formatValidation = this.validateCredentialFormatDynamic(platformName, credentials, testConfig);
      if (!formatValidation.valid) {
        return {
          success: false,
          message: formatValidation.message,
          details: {
            validation_failed: true,
            platform: platformName,
            total_time_ms: Date.now() - startTime,
            ai_dynamic_test: true,
            format_validation_error: true
          }
        };
      }

      // Step 3: Perform real API test with AI-generated configuration
      const testResult = await this.performDynamicAPITest(testConfig, credentials, platformName);
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

      console.log(`🏁 Fully dynamic testing completed for ${platformName} in ${totalTime}ms - ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: testResult.success,
        message: testResult.success 
          ? `✅ ${platformName} credentials verified successfully with AI-generated dynamic testing! Ready for automation use.`
          : this.generateDynamicErrorMessage(platformName, testResult, testConfig),
        details: {
          // Real test results
          endpoint_tested: testResult.endpoint_tested,
          method_used: testResult.method_used,
          status_code: testResult.status_code,
          request_time_ms: testResult.request_time_ms,
          total_time_ms: totalTime,
          
          // Platform information
          platform: platformName,
          config_source: 'ai_generated_dynamic',
          base_url: testConfig.base_url,
          
          // Response preview (sanitized)
          api_response_preview: this.sanitizeResponse(testResult.response_data),
          
          // Testing markers
          ai_dynamic_test: true,
          real_api_call: true,
          format_validated: true,
          ai_config_validated: true,
          
          // Usage tracking
          usage_tracked: this.usageTracker.has(platformName)
        }
      };

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 Fully dynamic testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `AI-powered dynamic testing system error for ${platformName}: ${error.message}`,
        details: {
          error_details: error.message,
          total_time_ms: totalTime,
          platform: platformName,
          system_error: true,
          ai_dynamic_test: true
        }
      };
    }
  }

  /**
   * DYNAMIC: Validate AI-generated configuration
   */
  validateAIConfig(testConfig: any): { valid: boolean; message: string } {
    console.log(`🔍 Validating AI-generated config:`, Object.keys(testConfig || {}));
    
    if (!testConfig) {
      return { valid: false, message: 'No AI configuration provided' };
    }

    if (!testConfig.base_url) {
      return { valid: false, message: 'AI configuration missing base_url' };
    }

    if (!testConfig.test_endpoint) {
      return { valid: false, message: 'AI configuration missing test_endpoint' };
    }

    if (!testConfig.test_endpoint.method) {
      return { valid: false, message: 'AI configuration missing test_endpoint.method' };
    }

    if (!testConfig.test_endpoint.path) {
      return { valid: false, message: 'AI configuration missing test_endpoint.path' };
    }

    console.log(`✅ AI configuration validated successfully`);
    return { valid: true, message: 'AI configuration is valid' };
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
          'User-Agent': 'YusrAI-Fully-Dynamic-Tester/5.0'
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
      aiGenerated: true
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
      call_type: 'dynamic_credential_test'
    };
    
    if (!this.usageTracker.has(platformName)) {
      this.usageTracker.set(platformName, []);
    }
    
    this.usageTracker.get(platformName).push(usage);
    console.log(`📊 Tracked DYNAMIC API usage for ${platformName}:`, usage);
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
        console.log(`✅ DYNAMIC API usage tracked in database for ${platformName}`);
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

    if (!platformName || !credentials || !testConfig) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Platform name, credentials, and AI-generated testConfig are required for dynamic testing' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎯 FULLY DYNAMIC TESTING REQUEST: ${platformName} with AI testConfig:`, Object.keys(testConfig));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize the fully dynamic credential tester
    const tester = new FullyDynamicCredentialTester(supabase);

    // Test platform credentials with AI-generated configuration
    const result = await tester.testPlatformCredentialsComprehensively(platformName, credentials, testConfig, userId);

    console.log(`🎯 FULLY DYNAMIC TESTING RESULT for ${platformName}:`, result.success ? 'SUCCESS' : 'FAILED');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('💥 Error in fully dynamic test-credential function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Fully dynamic server error: ${error.message}`,
        details: {
          error_type: 'dynamic_server_error',
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
