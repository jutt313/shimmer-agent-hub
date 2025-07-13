
import { supabase } from '@/integrations/supabase/client';

// COMPLETELY REWRITTEN UNIVERSAL PLATFORM INTEGRATOR - AI-POWERED
export interface DynamicPlatformConfig {
  name: string;
  base_url: string;
  api_spec?: any;
  auth_config: {
    type: 'bearer' | 'api_key' | 'oauth2' | 'basic';
    location: 'header' | 'query' | 'body';
    parameter_name: string;
    format: string;
    oauth2_endpoint?: string;
  };
  rate_limits: {
    requests_per_second: number;
    requests_per_minute: number;
    requests_per_hour: number;
  };
  endpoints: Record<string, {
    method: string;
    path: string;
    required_params: string[];
    optional_params: string[];
    response_schema: any;
  }>;
  test_endpoint: {
    method: string;
    path: string;
    description: string;
    query_params?: Record<string, string>;
  };
}

export class AIUniversalPlatformIntegrator {
  private configCache = new Map<string, DynamicPlatformConfig>();
  private rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    console.log('🤖 AI Universal Platform Integrator v4.0 - Fully AI-Powered');
  }

  // AI-POWERED PLATFORM DISCOVERY - NO MORE HARDCODING
  async getAIGeneratedConfig(platformName: string): Promise<DynamicPlatformConfig> {
    console.log(`🤖 Getting AI-generated config for ${platformName}`);

    // Check cache first
    const cached = this.configCache.get(platformName.toLowerCase());
    if (cached) {
      console.log(`⚡ Using cached config for ${platformName}`);
      return cached;
    }

    try {
      // Call Chat-AI to generate dynamic configuration
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate complete API configuration for ${platformName} platform including: base URL, authentication method, test endpoint, required headers, error handling patterns, sample request/response structure, and all necessary integration details. Return only the API configuration data.`,
          messages: [],
          requestType: 'platform_config_generation'
        }
      });

      if (error) {
        console.error('❌ Failed to get AI config:', error);
        return this.createIntelligentFallback(platformName);
      }

      // Extract API configuration from AI response
      const aiConfig = data?.api_configurations?.[platformName.toLowerCase()] || 
                      data?.api_configurations?.[0] || 
                      data?.platforms?.[0];

      if (aiConfig) {
        const dynamicConfig = this.parseAIConfiguration(platformName, aiConfig);
        this.configCache.set(platformName.toLowerCase(), dynamicConfig);
        console.log(`✅ Got AI-generated config for ${platformName}`);
        return dynamicConfig;
      }

      console.warn(`⚠️ No AI config available for ${platformName}, using intelligent fallback`);
      return this.createIntelligentFallback(platformName);

    } catch (error) {
      console.error(`💥 Error getting AI config for ${platformName}:`, error);
      return this.createIntelligentFallback(platformName);
    }
  }

  private parseAIConfiguration(platformName: string, aiConfig: any): DynamicPlatformConfig {
    return {
      name: platformName,
      base_url: aiConfig.base_url || this.inferBaseUrl(platformName),
      auth_config: aiConfig.auth_config || aiConfig.authentication || {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {token}'
      },
      rate_limits: aiConfig.rate_limits || {
        requests_per_second: 10,
        requests_per_minute: 100,
        requests_per_hour: 1000
      },
      endpoints: aiConfig.endpoints || this.createDefaultEndpoints(),
      test_endpoint: aiConfig.test_endpoint || {
        method: 'GET',
        path: '/me',
        description: `Test ${platformName} authentication`
      }
    };
  }

  private createIntelligentFallback(platformName: string): DynamicPlatformConfig {
    return {
      name: platformName,
      base_url: this.inferBaseUrl(platformName),
      auth_config: {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}'
      },
      rate_limits: {
        requests_per_second: 5,
        requests_per_minute: 50,
        requests_per_hour: 500
      },
      endpoints: this.createDefaultEndpoints(),
      test_endpoint: {
        method: 'GET',
        path: '/me',
        description: `Test ${platformName} authentication`
      }
    };
  }

  // AI-POWERED PLATFORM API CALLER
  async callPlatformAPI(
    platformName: string,
    endpointName: string,
    parameters: Record<string, any>,
    credentials: Record<string, string>
  ): Promise<any> {
    console.log(`🚀 AI-POWERED API CALL: ${platformName}.${endpointName}`);

    const config = await this.getAIGeneratedConfig(platformName);
    const endpoint = config.endpoints[endpointName] || config.endpoints['universal_api_call'];
    
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointName} not found for platform ${platformName}`);
    }

    // Rate limiting check
    if (!this.checkRateLimit(platformName, config.rate_limits)) {
      throw new Error(`Rate limit exceeded for platform ${platformName}`);
    }

    // Build request URL
    let url = config.base_url + endpoint.path;
    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    // Build headers with AI-generated auth configuration
    const headers = await this.buildDynamicHeaders(config.auth_config, credentials);

    // Build request options
    const requestOptions: RequestInit = {
      method: endpoint.method,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      requestOptions.body = JSON.stringify(parameters);
    } else if (endpoint.method === 'GET') {
      // Add query parameters for GET requests
      const queryParams = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        if (!url.includes(`{${key}}`)) {
          queryParams.append(key, String(value));
        }
      });
      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }
    }

    console.log(`📡 Making AI-powered ${endpoint.method} request to: ${url}`);

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI-powered API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ AI-powered API call successful for ${platformName}`);
      
      return result;
    } catch (error) {
      console.error(`❌ AI-powered API call failed:`, error);
      throw error;
    }
  }

  // AI-POWERED CREDENTIAL TESTING
  async testPlatformCredentials(
    platformName: string,
    credentials: Record<string, string>
  ): Promise<{ success: boolean; message: string; details?: any; error_type?: string }> {
    try {
      console.log(`🧪 AI-POWERED TESTING: ${platformName}`);
      
      const config = await this.getAIGeneratedConfig(platformName);
      const testEndpoint = config.test_endpoint;
      const baseUrl = config.base_url;
      
      // Build test URL
      let testUrl = `${baseUrl}${testEndpoint.path}`;
      
      // Add query parameters if specified
      if (testEndpoint.query_params) {
        const queryString = new URLSearchParams(testEndpoint.query_params).toString();
        testUrl += `?${queryString}`;
      }

      // Build authentication headers using AI configuration
      const headers = await this.buildDynamicHeaders(config.auth_config, credentials);

      console.log(`📡 AI-POWERED TEST: ${testEndpoint.method} ${testUrl}`);

      const response = await fetch(testUrl, {
        method: testEndpoint.method,
        headers,
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      if (response.ok) {
        console.log(`✅ AI-POWERED TEST SUCCESS: ${platformName}`);
        
        return {
          success: true,
          message: `${platformName} credentials are working correctly! AI-powered integration successful.`,
          details: {
            status: response.status,
            endpoint_tested: testUrl,
            ai_powered: true,
            dynamic_config: true,
            config_source: 'ai_generated',
            response_preview: typeof responseData === 'object' ? 
              Object.keys(responseData).slice(0, 5) : 
              responseData.toString().substring(0, 100)
          }
        };
      } else {
        console.error(`❌ AI-POWERED TEST FAILED: ${platformName}`, response.status, responseData);
        
        return {
          success: false,
          message: `${platformName} credentials test failed with status ${response.status}`,
          error_type: response.status === 401 ? 'authentication_error' : 'api_error',
          details: {
            status: response.status,
            endpoint_tested: testUrl,
            error_response: responseData,
            ai_powered: true,
            dynamic_config: true
          }
        };
      }

    } catch (error: any) {
      console.error(`💥 AI-POWERED TEST ERROR: ${platformName}`, error);
      return {
        success: false,
        message: `Failed to connect to ${platformName}: ${error.message}`,
        error_type: 'connection_error',
        details: {
          error: error.message,
          ai_powered: true,
          dynamic_config: true
        }
      };
    }
  }

  private async buildDynamicHeaders(authConfig: any, credentials: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-AI-Universal-Integrator/4.0'
    };

    // Apply AI-generated authentication configuration
    switch (authConfig.type) {
      case 'bearer':
        const token = credentials.access_token || credentials.token || credentials.api_key;
        if (token) {
          headers[authConfig.parameter_name] = authConfig.format
            .replace('{token}', token)
            .replace('{access_token}', token)
            .replace('{api_key}', token);
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey && authConfig.location === 'header') {
          headers[authConfig.parameter_name] = authConfig.format
            .replace('{api_key}', apiKey)
            .replace('{token}', apiKey);
        }
        break;
        
      case 'basic':
        const username = credentials.username;
        const password = credentials.password;
        if (username && password) {
          const basicAuth = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
        }
        break;
    }

    return headers;
  }

  private checkRateLimit(platformName: string, limits: any): boolean {
    const now = Date.now();
    const key = platformName.toLowerCase();
    const tracker = this.rateLimitTracker.get(key);

    if (!tracker || now > tracker.resetTime) {
      this.rateLimitTracker.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (tracker.count >= limits.requests_per_minute) {
      return false;
    }

    tracker.count++;
    return true;
  }

  private inferBaseUrl(platformName: string): string {
    const lowerPlatform = platformName.toLowerCase();
    return `https://api.${lowerPlatform}.com`;
  }

  private createDefaultEndpoints(): Record<string, any> {
    return {
      'universal_api_call': {
        method: 'GET',
        path: '/api/v1/me',
        required_params: [],
        optional_params: [],
        response_schema: {}
      }
    };
  }
}

// Export singleton instance
export const aiUniversalPlatformIntegrator = new AIUniversalPlatformIntegrator();
export const universalPlatformIntegrator = aiUniversalPlatformIntegrator; // Legacy compatibility
export const universalIntegrator = aiUniversalPlatformIntegrator; // Legacy compatibility
