
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// DYNAMIC PLATFORM INTEGRATOR - NO MORE HARDCODING
class DynamicPlatformTester {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // Get AI-generated platform configuration from chat-ai
  async getAIGeneratedConfig(platformName: string, userId: string): Promise<any> {
    console.log(`🤖 Getting AI-generated config for ${platformName}`);
    
    try {
      const { data, error } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate complete API configuration for ${platformName} platform including: base URL, authentication method, test endpoint, required headers, error handling patterns, and sample request/response structure. Focus only on technical API configuration.`,
          messages: [],
          requestType: 'api_config_generation'
        }
      });

      if (error) {
        console.error('❌ Failed to get AI config:', error);
        return null;
      }

      console.log('🎯 AI Config received:', data);
      return data?.api_configurations?.[platformName.toLowerCase()] || data?.api_configurations?.[0];
    } catch (error) {
      console.error('💥 Error getting AI config:', error);
      return null;
    }
  }

  // Dynamic credential testing using AI-generated configurations
  async testPlatformCredentials(
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<{ success: boolean; message: string; details?: any; error_type?: string }> {
    try {
      console.log(`🧪 DYNAMIC TESTING: ${platformName} for user ${userId}`);
      
      // Get AI-generated configuration
      const aiConfig = await this.getAIGeneratedConfig(platformName, userId);
      
      if (!aiConfig) {
        console.log('⚠️ No AI config available, using intelligent fallback');
        return await this.intelligentFallbackTest(platformName, credentials);
      }

      console.log(`🔧 Using AI-generated config for ${platformName}:`, aiConfig);

      // Build dynamic test URL
      const baseUrl = aiConfig.base_url || this.inferBaseUrl(platformName);
      const testEndpoint = aiConfig.test_endpoint || { method: 'GET', path: '/me' };
      const testUrl = `${baseUrl}${testEndpoint.path}`;

      // Build dynamic headers using AI configuration
      const headers = await this.buildDynamicHeaders(aiConfig, credentials);

      console.log(`📡 DYNAMIC TEST: ${testEndpoint.method} ${testUrl}`);
      console.log(`🔐 Headers configured:`, Object.keys(headers));

      // Execute dynamic API call
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
        console.log(`✅ DYNAMIC TEST SUCCESS: ${platformName}`);
        
        return {
          success: true,
          message: `${platformName} credentials are working correctly! Dynamic AI-powered integration successful.`,
          details: {
            status: response.status,
            endpoint_tested: testUrl,
            ai_powered: true,
            dynamic_config: true,
            config_source: 'ai_generated',
            response_preview: typeof responseData === 'object' ? 
              Object.keys(responseData).slice(0, 5) : 
              responseData.toString().substring(0, 100),
            full_response: responseData
          }
        };
      } else {
        console.error(`❌ DYNAMIC TEST FAILED: ${platformName}`, response.status, responseData);
        
        return {
          success: false,
          message: this.generateErrorMessage(platformName, response.status, aiConfig),
          error_type: this.categorizeError(response.status),
          details: {
            status: response.status,
            endpoint_tested: testUrl,
            error_response: responseData,
            ai_powered: true,
            dynamic_config: true,
            config_source: 'ai_generated',
            troubleshooting: this.generateTroubleshooting(platformName, response.status, aiConfig)
          }
        };
      }

    } catch (error: any) {
      console.error(`💥 DYNAMIC TEST ERROR: ${platformName}`, error);
      return {
        success: false,
        message: `Failed to connect to ${platformName}: ${error.message}`,
        error_type: 'connection_error',
        details: {
          error: error.message,
          ai_powered: true,
          dynamic_config: true,
          troubleshooting: [
            'Check your internet connection',
            `Verify ${platformName} service is operational`,
            'Ensure credentials are valid and active',
            'Try testing your credentials again in a few minutes'
          ]
        }
      };
    }
  }

  private async buildDynamicHeaders(aiConfig: any, credentials: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Dynamic-Tester/3.0'
    };

    // Apply AI-generated authentication configuration
    const authConfig = aiConfig.auth_config || aiConfig.authentication || {};
    
    switch (authConfig.type?.toLowerCase()) {
      case 'bearer':
      case 'bearer_token':
        const bearerToken = credentials.access_token || credentials.token || credentials.api_key;
        if (bearerToken) {
          headers['Authorization'] = `Bearer ${bearerToken}`;
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey) {
          if (authConfig.location === 'header') {
            const headerName = authConfig.parameter_name || 'X-API-Key';
            headers[headerName] = apiKey;
          }
        }
        break;
        
      case 'oauth':
      case 'oauth2':
        const accessToken = credentials.access_token;
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
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
        
      default:
        // Custom authentication handling
        if (authConfig.headers) {
          Object.entries(authConfig.headers).forEach(([key, value]: [string, any]) => {
            if (typeof value === 'string' && value.includes('{')) {
              // Replace template variables
              Object.entries(credentials).forEach(([credKey, credValue]) => {
                value = value.replace(`{${credKey}}`, credValue);
              });
            }
            headers[key] = value;
          });
        }
    }

    // Add any custom headers from AI configuration
    if (aiConfig.custom_headers) {
      Object.assign(headers, aiConfig.custom_headers);
    }

    return headers;
  }

  private async intelligentFallbackTest(platformName: string, credentials: Record<string, string>): Promise<any> {
    console.log(`🔧 Intelligent fallback test for: ${platformName}`);
    
    const baseUrl = this.inferBaseUrl(platformName);
    const testPath = this.inferTestPath(platformName);
    const testUrl = `${baseUrl}${testPath}`;

    const headers = this.buildFallbackHeaders(platformName, credentials);

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return {
        success: response.ok,
        message: response.ok ? 
          `${platformName} credentials working with intelligent fallback` :
          `${platformName} credentials test failed`,
        details: {
          status: response.status,
          endpoint_tested: testUrl,
          fallback_mode: true,
          response_data: responseData
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Fallback test failed: ${error.message}`,
        error_type: 'connection_error'
      };
    }
  }

  private inferBaseUrl(platformName: string): string {
    const lowerPlatform = platformName.toLowerCase();
    
    // Intelligent URL patterns
    const patterns = [
      `https://api.${lowerPlatform}.com`,
      `https://${lowerPlatform}.com/api`,
      `https://api.${lowerPlatform}.io`,
      `https://${lowerPlatform}.io/api/v1`
    ];

    return patterns[0];
  }

  private inferTestPath(platformName: string): string {
    const commonPaths = ['/me', '/user', '/users/me', '/profile', '/auth/test', '/api/v1/me'];
    return commonPaths[0];
  }

  private buildFallbackHeaders(platformName: string, credentials: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Fallback-Tester/1.0'
    };

    // Intelligent authentication inference
    if (credentials.access_token) {
      headers['Authorization'] = `Bearer ${credentials.access_token}`;
    } else if (credentials.api_key) {
      headers['Authorization'] = `Bearer ${credentials.api_key}`;
      headers['X-API-Key'] = credentials.api_key;
    } else if (credentials.token) {
      headers['Authorization'] = `Bearer ${credentials.token}`;
    }

    return headers;
  }

  private generateErrorMessage(platformName: string, status: number, aiConfig: any): string {
    switch (status) {
      case 401:
        return `${platformName} authentication failed. Please verify your credentials are correct and active.`;
      case 403:
        return `${platformName} access forbidden. Check your account permissions and API scope.`;
      case 404:
        return `${platformName} endpoint not found. The API may have changed.`;
      case 429:
        return `${platformName} rate limit exceeded. Please wait before retrying.`;
      case 500:
      case 502:
      case 503:
        return `${platformName} server error. The service may be temporarily unavailable.`;
      default:
        return `${platformName} API call failed with status ${status}.`;
    }
  }

  private categorizeError(status: number): string {
    if (status === 401) return 'authentication_error';
    if (status === 403) return 'permission_error';
    if (status === 404) return 'endpoint_not_found';
    if (status === 429) return 'rate_limit_error';
    if (status >= 500) return 'server_error';
    return 'api_error';
  }

  private generateTroubleshooting(platformName: string, status: number, aiConfig: any): string[] {
    const base = [
      `Check ${platformName} service status and API documentation`,
      'Verify all credentials are correct and active',
      'Ensure your account has the required permissions'
    ];

    switch (status) {
      case 401:
        return [...base, 'Check if your API keys or tokens have expired', 'Verify the authentication method is correct'];
      case 403:
        return [...base, 'Check your account subscription level', 'Verify API scopes and permissions'];
      case 404:
        return [...base, 'Check if the API endpoint URL is correct', 'Verify the API version being used'];
      case 429:
        return [...base, 'Wait for rate limit to reset', 'Consider upgrading your API plan'];
      default:
        return base;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform_name, credentials, user_id } = await req.json();
    
    console.log(`🔧 DYNAMIC CREDENTIAL TEST: ${platform_name} for user ${user_id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tester = new DynamicPlatformTester(supabase);
    const result = await tester.testPlatformCredentials(platform_name, credentials, user_id);
    
    console.log(`📊 DYNAMIC TEST RESULT for ${platform_name}:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ DYNAMIC CREDENTIAL TEST ERROR:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Error testing credentials: ${error.message}`,
        error_type: 'system_error',
        details: { 
          error: error.message,
          dynamic_testing: true
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
