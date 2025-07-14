
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
    header_format: string;
    field_names: string[];
  };
  sample_request: any;
  sample_response: any;
}

export class UniversalPlatformManager {
  private static configCache = new Map<string, UniversalPlatformConfig>();

  /**
   * Get platform configuration dynamically using AI - NO HARDCODING
   */
  static async getPlatformConfig(platformName: string): Promise<UniversalPlatformConfig> {
    console.log(`🤖 Getting universal config for ${platformName} via AI`);
    
    // Check cache first
    const cached = this.configCache.get(platformName.toLowerCase());
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate complete API configuration for ${platformName} platform. Return ONLY valid JSON:

{
  "platform_name": "${platformName}",
  "base_url": "https://api.platform.com",
  "test_endpoint": {
    "method": "GET",
    "path": "/me",
    "description": "Test authentication endpoint"
  },
  "auth_config": {
    "type": "bearer",
    "header_format": "Bearer {token}",
    "field_names": ["api_key", "access_token", "token"]
  },
  "sample_request": {
    "url": "https://api.platform.com/v1/action",
    "method": "POST",
    "headers": {"Authorization": "Bearer {token}"},
    "body": {"action": "sample_action"}
  },
  "sample_response": {
    "status": 200,
    "data": {"result": "success", "message": "Sample response"}
  }
}

For specific platforms use these real endpoints:
- OpenAI: base_url "https://api.openai.com", test "/v1/models", auth "Bearer {api_key}"
- Typeform: base_url "https://api.typeform.com", test "/me", auth "Bearer {personal_access_token}"
- Google Sheets: base_url "https://sheets.googleapis.com", test "/v4/spreadsheets", auth "Bearer {access_token}"

Return ONLY the JSON configuration.`,
          requestType: 'platform_config',
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

      // Validate required fields
      if (!config.base_url || !config.test_endpoint) {
        throw new Error('Invalid AI configuration');
      }

      this.configCache.set(platformName.toLowerCase(), config);
      console.log(`✅ Universal AI config generated for ${platformName}`);
      return config;

    } catch (error) {
      console.error(`Failed to get AI config for ${platformName}:`, error);
      throw error;
    }
  }

  /**
   * Test platform credentials universally - NO HARDCODING
   */
  static async testCredentials(
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{
    success: boolean;
    message: string;
    request_details: any;
    response_details: any;
    status_code: number;
  }> {
    console.log(`🧪 Universal testing for ${platformName}`);

    try {
      // Get AI-generated platform config
      const config = await this.getPlatformConfig(platformName);
      
      // Find the right credential field
      const credentialValue = this.findCredentialValue(credentials, config.auth_config.field_names);
      if (!credentialValue) {
        return {
          success: false,
          message: `No valid credential found. Expected fields: ${config.auth_config.field_names.join(', ')}`,
          request_details: null,
          response_details: null,
          status_code: 0
        };
      }

      // ENHANCED REQUEST BUILDING WITH PROPER CREDENTIAL INSERTION
      const testUrl = config.base_url + config.test_endpoint.path;
      
      // Build authorization header with ACTUAL credential value
      let authorizationHeader = config.auth_config.header_format;
      authorizationHeader = authorizationHeader
        .replace('{token}', credentialValue)
        .replace('{api_key}', credentialValue)
        .replace('{personal_access_token}', credentialValue)
        .replace('{access_token}', credentialValue)
        .replace('{bearer_token}', credentialValue)
        .replace('{auth_token}', credentialValue);
      
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'YusrAI-Universal-Tester/3.0',
        'Authorization': authorizationHeader
      };

      console.log(`🔑 Authorization header: ${authorizationHeader.replace(credentialValue, '***HIDDEN***')}`);

      const requestDetails = {
        url: testUrl,
        method: config.test_endpoint.method,
        headers: { 
          ...headers, 
          Authorization: headers.Authorization.replace(credentialValue, '***HIDDEN***')
        },
        body: config.test_endpoint.method === 'POST' ? {} : null,
        platform: platformName,
        ai_generated: true,
        credential_found: true,
        field_detected: Object.keys(credentials).find(key => credentials[key] === credentialValue)
      };

      console.log(`📡 Making universal API call to: ${testUrl}`);

      // Make API call
      const startTime = Date.now();
      const response = await fetch(testUrl, {
        method: config.test_endpoint.method,
        headers,
        signal: AbortSignal.timeout(15000)
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
        platform: platformName
      };

      const success = response.ok;
      const message = success 
        ? `✅ ${platformName} credentials verified successfully!`
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
        request_details: { error: error.message, platform: platformName },
        response_details: { error: error.message },
        status_code: 0
      };
    }
  }

  /**
   * ENHANCED CREDENTIAL DETECTION - Find ANY credential field dynamically
   */
  private static findCredentialValue(credentials: Record<string, string>, fieldNames: string[]): string | null {
    console.log('🔍 Finding credential value from fields:', fieldNames);
    console.log('📋 Available credentials:', Object.keys(credentials));
    
    // ENHANCED FIELD MATCHING - Check multiple variations
    const allPossibleNames = [
      ...fieldNames,
      'api_key', 'API Key', 'apikey', 'apiKey', 'key',
      'access_token', 'Access Token', 'accesstoken', 'accessToken', 'token',
      'personal_access_token', 'Personal Access Token', 'personalAccessToken',
      'bearer_token', 'Bearer Token', 'bearerToken',
      'auth_token', 'Auth Token', 'authToken',
      'client_secret', 'Client Secret', 'clientSecret', 'secret',
      'password', 'Password', 'pwd'
    ];
    
    for (const fieldName of allPossibleNames) {
      // Check exact match
      if (credentials[fieldName] && credentials[fieldName].trim()) {
        console.log(`✅ Found credential in field: ${fieldName}`);
        return credentials[fieldName].trim();
      }
      
      // Check case variations
      const variations = [
        fieldName.toLowerCase(),
        fieldName.toUpperCase(),
        fieldName.replace(/[_\s]/g, ''),
        fieldName.replace(/[_\s]/g, '').toLowerCase(),
        fieldName.replace(/[_\s]/g, '').toUpperCase()
      ];
      
      for (const variation of variations) {
        if (credentials[variation] && credentials[variation].trim()) {
          console.log(`✅ Found credential in variation: ${variation} (original: ${fieldName})`);
          return credentials[variation].trim();
        }
      }
    }
    
    // FALLBACK: Get any non-empty credential value
    for (const [key, value] of Object.entries(credentials)) {
      if (value && value.trim()) {
        console.log(`⚠️ Using fallback credential from field: ${key}`);
        return value.trim();
      }
    }
    
    console.log('❌ No credential value found');
    return null;
  }

  /**
   * Generate sample API call for preview
   */
  static async generateSampleCall(platformName: string, credentials: Record<string, string>): Promise<any> {
    try {
      const config = await this.getPlatformConfig(platformName);
      const credentialValue = this.findCredentialValue(credentials, config.auth_config.field_names);
      
      return {
        task_description: `Sample ${platformName} API operation`,
        request: {
          ...config.sample_request,
          headers: {
            ...config.sample_request.headers,
            Authorization: config.auth_config.header_format.replace('{token}', credentialValue || '[TOKEN]')
              .replace('{api_key}', credentialValue || '[API_KEY]')
              .replace('{personal_access_token}', credentialValue || '[TOKEN]')
              .replace('{access_token}', credentialValue || '[ACCESS_TOKEN]')
          }
        },
        expected_response: config.sample_response,
        platform: platformName,
        universal_support: true
      };
    } catch (error) {
      return {
        task_description: `${platformName} API operation`,
        request: {
          url: `https://api.${platformName.toLowerCase()}.com/v1/action`,
          method: 'POST',
          headers: { Authorization: 'Bearer [TOKEN]' },
          body: { action: 'sample' }
        },
        expected_response: { status: 200, data: 'success' },
        platform: platformName,
        fallback: true
      };
    }
  }
}
