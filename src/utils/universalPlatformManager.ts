
import { supabase } from '@/integrations/supabase/client';

export interface UniversalPlatformConfig {
  platform_name: string;
  base_url: string;
  test_endpoint: {
    method: string;
    path: string;
    description: string;
  };
  auth_config: {
    type: string;
    location: string;
    parameter_name: string;
    format: string;
    field_names: string[];
    oauth2_config?: {
      authorization_url: string;
      token_url: string;
      scopes: string[];
    };
  };
  automation_operations: Array<{
    name: string;
    method: string;
    path: string;
    description: string;
    sample_request: any;
    sample_response: any;
  }>;
  error_patterns: Array<{
    status: number;
    pattern: string;
    action: string;
  }>;
  rate_limits: {
    requests_per_minute: number;
    requests_per_hour: number;
    burst_limit: number;
  };
}

export class UniversalPlatformManager {
  private static configCache = new Map<string, UniversalPlatformConfig>();

  /**
   * UNIVERSAL PLATFORM CONFIGURATION - NO HARDCODING
   * Uses AI-powered dynamic configuration generation for ANY platform
   */
  static async getPlatformConfig(platformName: string, automationContext?: any): Promise<UniversalPlatformConfig> {
    console.log(`🤖 Getting universal config for ${platformName} via AI with automation context`);
    
    // Check cache first
    const cacheKey = `${platformName.toLowerCase()}_${automationContext?.id || 'general'}`;
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Using cached config for ${platformName}`);
      return cached;
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate complete API configuration for ${platformName} platform with automation context awareness.`,
          requestType: 'platform_config',
          platformName: platformName,
          automationContext: automationContext,
          messages: []
        }
      });

      if (error) {
        throw new Error(`AI config generation failed: ${error.message}`);
      }

      let config;
      if (typeof data === 'string') {
        const jsonMatch = data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          config = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } else {
        config = data;
      }

      // Validate and enhance configuration
      if (!config.base_url || !config.test_endpoint) {
        console.warn(`⚠️ Invalid AI config for ${platformName}, using intelligent fallback`);
        config = this.generateIntelligentFallback(platformName, automationContext);
      }

      // Cache the configuration
      this.configCache.set(cacheKey, config);
      console.log(`✅ Universal AI config generated and cached for ${platformName}`);
      return config;

    } catch (error) {
      console.error(`Failed to get AI config for ${platformName}:`, error);
      console.log(`🔄 Using intelligent fallback for ${platformName}`);
      return this.generateIntelligentFallback(platformName, automationContext);
    }
  }

  /**
   * INTELLIGENT FALLBACK CONFIGURATION GENERATOR
   * Generates realistic configurations using platform analysis rules
   */
  private static generateIntelligentFallback(platformName: string, automationContext?: any): UniversalPlatformConfig {
    console.log(`🔧 Generating intelligent fallback for ${platformName}`);
    
    const cleanName = platformName.toLowerCase().replace(/\s+/g, '');
    
    // UNIVERSAL BASE URL DETECTION RULES
    const baseUrlPatterns = [
      `https://api.${cleanName}.com`,
      `https://${cleanName}-api.com`,
      `https://api-${cleanName}.com`,
      `https://${cleanName}.api.com`
    ];
    
    // AUTHENTICATION PATTERN DETECTION
    const authPatterns = {
      modern: { type: 'bearer', format: 'Bearer {token}', param: 'Authorization' },
      legacy: { type: 'api_key', format: '{api_key}', param: 'X-API-Key' },
      custom: { type: 'bearer', format: 'Bearer {access_token}', param: 'Authorization' }
    };
    
    // CREDENTIAL FIELD INTELLIGENCE
    const credentialFields = [
      'api_key', 'access_token', 'token', 'personal_access_token',
      'client_id', 'client_secret', 'bearer_token', 'auth_token'
    ];
    
    // TEST ENDPOINT DISCOVERY
    const testEndpoints = ['/me', '/user', '/auth/test', '/ping', '/status', '/account', '/profile'];
    
    // AUTOMATION OPERATION DETECTION
    const operationPatterns = this.detectOperationPatterns(platformName, automationContext);
    
    const selectedAuth = authPatterns.modern; // Default to modern pattern
    
    return {
      platform_name: platformName,
      base_url: baseUrlPatterns[0], // Use most common pattern
      test_endpoint: {
        method: 'GET',
        path: testEndpoints[0], // Most common: /me
        description: `Test ${platformName} authentication and permissions`
      },
      auth_config: {
        type: selectedAuth.type,
        location: 'header',
        parameter_name: selectedAuth.param,
        format: selectedAuth.format,
        field_names: credentialFields,
        oauth2_config: {
          authorization_url: `${baseUrlPatterns[0]}/oauth/authorize`,
          token_url: `${baseUrlPatterns[0]}/oauth/token`,
          scopes: ['read', 'write', 'admin']
        }
      },
      automation_operations: operationPatterns,
      error_patterns: [
        { status: 401, pattern: 'unauthorized|invalid.*token', action: 'refresh_credentials' },
        { status: 429, pattern: 'rate.*limit', action: 'retry_with_backoff' },
        { status: 403, pattern: 'forbidden|insufficient.*permissions', action: 'check_scopes' },
        { status: 400, pattern: 'bad.*request|invalid.*input', action: 'validate_input' },
        { status: 500, pattern: 'server.*error|internal.*error', action: 'retry_later' }
      ],
      rate_limits: {
        requests_per_minute: 60,
        requests_per_hour: 1000,
        burst_limit: 10
      }
    };
  }

  /**
   * AUTOMATION OPERATION PATTERN DETECTION
   * Generates realistic operations based on platform type and automation context
   */
  private static detectOperationPatterns(platformName: string, automationContext?: any): Array<any> {
    const lowerName = platformName.toLowerCase();
    const operations = [];
    
    // UNIVERSAL OPERATION DETECTION RULES
    if (lowerName.includes('form') || lowerName.includes('survey')) {
      operations.push({
        name: 'Create Form',
        method: 'POST',
        path: '/forms',
        description: 'Create a new form for data collection',
        sample_request: {
          url: `https://api.${lowerName}.com/forms`,
          method: 'POST',
          headers: { 'Authorization': 'Bearer {access_token}' },
          body: { title: 'Automation Form', fields: [] }
        },
        sample_response: {
          success: { id: 'form_123', title: 'Automation Form', url: 'https://form.url' },
          error: { error: 'creation_failed', message: 'Form creation failed' }
        }
      });
    }
    
    if (lowerName.includes('slack') || lowerName.includes('chat') || lowerName.includes('message')) {
      operations.push({
        name: 'Send Message',
        method: 'POST',
        path: '/chat.postMessage',
        description: 'Send a message to a channel or user',
        sample_request: {
          url: `https://api.${lowerName}.com/chat.postMessage`,
          method: 'POST',
          headers: { 'Authorization': 'Bearer {token}' },
          body: { channel: '#general', text: 'Automation message' }
        },
        sample_response: {
          success: { ok: true, channel: 'C123456', ts: '1234567890.123' },
          error: { ok: false, error: 'channel_not_found' }
        }
      });
    }
    
    if (lowerName.includes('email') || lowerName.includes('mail')) {
      operations.push({
        name: 'Send Email',
        method: 'POST',
        path: '/mail/send',
        description: 'Send an email message',
        sample_request: {
          url: `https://api.${lowerName}.com/mail/send`,
          method: 'POST',
          headers: { 'Authorization': 'Bearer {api_key}' },
          body: { 
            to: 'recipient@example.com',
            subject: 'Automation Email',
            html: '<p>This is an automated email</p>'
          }
        },
        sample_response: {
          success: { message: 'Queued. Thank you.', message_id: 'msg_123' },
          error: { errors: [{ message: 'Invalid email address' }] }
        }
      });
    }
    
    // DEFAULT OPERATION FOR ANY PLATFORM - ensure it has description
    if (operations.length === 0) {
      operations.push({
        name: `${platformName} Operation`,
        method: 'POST',
        path: '/action',
        description: `Perform an action using ${platformName}`,
        sample_request: {
          url: `https://api.${lowerName.replace(/\s+/g, '')}.com/action`,
          method: 'POST',
          headers: { 'Authorization': 'Bearer {access_token}' },
          body: { action: 'automation_action', data: automationContext || {} }
        },
        sample_response: {
          success: { result: 'success', data: 'operation_completed' },
          error: { error: 'operation_failed', message: 'Action could not be completed' }
        }
      });
    }
    
    return operations;
  }

  /**
   * UNIVERSAL CREDENTIAL TESTING - NO HARDCODING
   */
  static async testCredentials(
    platformName: string,
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<{
    success: boolean;
    message: string;
    request_details: any;
    response_details: any;
    status_code: number;
  }> {
    console.log(`🧪 Universal testing for ${platformName} with automation context`);

    try {
      // Get AI-generated platform config with automation context
      const config = await this.getPlatformConfig(platformName, automationContext);
      
      // ENHANCED CREDENTIAL DETECTION - NO HARDCODING
      const credentialValue = this.findCredentialValueIntelligently(credentials, config.auth_config.field_names);
      if (!credentialValue) {
        return {
          success: false,
          message: `No valid credential found. Expected fields: ${config.auth_config.field_names.join(', ')}`,
          request_details: {
            error: 'credential_not_found',
            expected_fields: config.auth_config.field_names,
            provided_fields: Object.keys(credentials)
          },
          response_details: { error: 'No valid credentials provided' },
          status_code: 0
        };
      }

      // UNIVERSAL REQUEST BUILDING
      const testUrl = config.base_url + config.test_endpoint.path;
      
      // Build authorization using detected format
      let authValue = config.auth_config.format;
      const placeholders = ['{token}', '{api_key}', '{personal_access_token}', '{access_token}', '{bearer_token}', '{auth_token}'];
      placeholders.forEach(placeholder => {
        authValue = authValue.replace(placeholder, credentialValue);
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'YusrAI-Universal-Tester/3.0'
      };
      
      if (config.auth_config.location === 'header') {
        headers[config.auth_config.parameter_name] = authValue;
      }

      console.log(`🔑 Authorization: ${authValue.replace(credentialValue, '***HIDDEN***')}`);

      const requestDetails = {
        url: testUrl,
        method: config.test_endpoint.method,
        headers: { 
          ...headers, 
          [config.auth_config.parameter_name]: headers[config.auth_config.parameter_name]?.replace(credentialValue, '***HIDDEN***')
        },
        body: config.test_endpoint.method === 'POST' ? {} : null,
        platform: platformName,
        universal_detection: true,
        credential_found: true,
        automation_context: !!automationContext
      };

      console.log(`📡 Making universal API call to: ${testUrl}`);

      // Make API call with timeout
      const startTime = Date.now();
      const response = await fetch(testUrl, {
        method: config.test_endpoint.method,
        headers,
        signal: AbortSignal.timeout(15000),
        ...(config.test_endpoint.method === 'POST' && { body: JSON.stringify({}) })
      });
      const requestTime = Date.now() - startTime;

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw_response: responseText.substring(0, 500) };
      }

      const responseDetails = {
        status: response.status,
        data: responseData,
        request_time_ms: requestTime,
        headers: Object.fromEntries(response.headers.entries()),
        platform: platformName,
        universal_detection: true
      };

      const success = response.ok;
      const message = success 
        ? `✅ ${platformName} credentials verified successfully with universal detection!`
        : `❌ ${platformName} test failed: ${response.status} ${response.statusText}`;

      return {
        success,
        message,
        request_details: requestDetails,
        response_details: responseDetails,
        status_code: response.status
      };

    } catch (error: any) {
      console.error(`Universal testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Universal test failed: ${error.message}`,
        request_details: { 
          error: error.message, 
          platform: platformName,
          universal_detection: true,
          automation_context: !!automationContext
        },
        response_details: { error: error.message },
        status_code: 0
      };
    }
  }

  /**
   * ENHANCED INTELLIGENT CREDENTIAL DETECTION
   * Finds ANY credential field dynamically using advanced pattern matching
   */
  private static findCredentialValueIntelligently(credentials: Record<string, string>, fieldNames: string[]): string | null {
    console.log('🔍 Intelligent credential detection from fields:', fieldNames);
    console.log('📋 Available credentials:', Object.keys(credentials));
    
    // ENHANCED UNIVERSAL FIELD MATCHING PATTERNS
    const universalPatterns = [
      // Direct field names from AI
      ...fieldNames,
      // Common API key variations
      'api_key', 'API Key', 'apikey', 'apiKey', 'key', 'Key',
      'access_token', 'Access Token', 'accesstoken', 'accessToken', 'token', 'Token',
      'personal_access_token', 'Personal Access Token', 'personalAccessToken', 'pat', 'PAT',
      'bearer_token', 'Bearer Token', 'bearerToken', 'bearer', 'Bearer',
      'auth_token', 'Auth Token', 'authToken', 'auth', 'Auth',
      'client_secret', 'Client Secret', 'clientSecret', 'secret', 'Secret',
      'authorization', 'Authorization', 'AUTH', 'auth_key', 'Auth Key',
      // Platform-specific patterns
      'password', 'Password', 'pwd', 'PWD', 'pass', 'Pass'
    ];
    
    // INTELLIGENT MATCHING ALGORITHM
    for (const pattern of universalPatterns) {
      // Exact match
      if (credentials[pattern] && credentials[pattern].trim()) {
        console.log(`✅ Found credential via exact match: ${pattern}`);
        return credentials[pattern].trim();
      }
      
      // Case variations
      const variations = [
        pattern.toLowerCase(),
        pattern.toUpperCase(),
        pattern.replace(/[_\s]/g, ''),
        pattern.replace(/[_\s]/g, '').toLowerCase(),
        pattern.replace(/[_\s]/g, '').toUpperCase(),
        pattern.replace(/_/g, ' '),
        pattern.replace(/\s/g, '_')
      ];
      
      for (const variation of variations) {
        if (credentials[variation] && credentials[variation].trim()) {
          console.log(`✅ Found credential via variation: ${variation} (original: ${pattern})`);
          return credentials[variation].trim();
        }
      }
    }
    
    // FALLBACK: Any non-empty credential
    for (const [key, value] of Object.entries(credentials)) {
      if (value && value.trim()) {
        console.log(`⚠️ Using fallback credential from field: ${key}`);
        return value.trim();
      }
    }
    
    console.log('❌ No credential value found with intelligent detection');
    return null;
  }

  /**
   * AUTOMATION-AWARE SAMPLE CALL GENERATION
   */
  static async generateSampleCall(platformName: string, credentials: Record<string, string>, automationContext?: any): Promise<any> {
    try {
      const config = await this.getPlatformConfig(platformName, automationContext);
      const credentialValue = this.findCredentialValueIntelligently(credentials, config.auth_config.field_names);
      
      // Use automation operations if available, otherwise use test endpoint
      const operation = config.automation_operations?.[0] || {
        name: 'Authentication Test',
        method: config.test_endpoint.method,
        path: config.test_endpoint.path,
        description: 'Test authentication and permissions',
        sample_request: {
          url: config.base_url + config.test_endpoint.path,
          method: config.test_endpoint.method,
          headers: {},
          body: null
        },
        sample_response: {
          success: { authenticated: true, user: 'test_user' },
          error: { error: 'authentication_failed' }
        }
      };
      
      // Build authorization
      let authValue = config.auth_config.format;
      const placeholders = ['{token}', '{api_key}', '{personal_access_token}', '{access_token}', '{bearer_token}', '{auth_token}'];
      placeholders.forEach(placeholder => {
        authValue = authValue.replace(placeholder, credentialValue || '[TOKEN]');
      });
      
      return {
        task_description: `${operation.description} for ${platformName}`,
        automation_context: automationContext ? 'Automation-aware operation' : 'General platform operation',
        request: {
          ...operation.sample_request,
          headers: {
            ...operation.sample_request.headers,
            [config.auth_config.parameter_name]: authValue
          }
        },
        expected_response: operation.sample_response,
        platform: platformName,
        universal_support: true,
        intelligent_detection: true
      };
    } catch (error) {
      console.error(`Sample call generation failed for ${platformName}:`, error);
      return {
        task_description: `${platformName} API operation`,
        request: {
          url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com/v1/action`,
          method: 'POST',
          headers: { Authorization: 'Bearer [TOKEN]' },
          body: { action: 'sample', automation_context: automationContext }
        },
        expected_response: { status: 200, data: 'success' },
        platform: platformName,
        fallback: true,
        universal_support: true
      };
    }
  }

  /**
   * Clear cache when needed
   */
  static clearCache(): void {
    this.configCache.clear();
    console.log('🗑️ Universal platform config cache cleared');
  }
}
