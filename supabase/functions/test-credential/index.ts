
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ENHANCED PLATFORM TESTER - PHASE 1-5 IMPLEMENTATION
class EnhancedPlatformTester {
  private supabase: any;
  private configCache: Map<string, any> = new Map();

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // PHASE 1: Fixed Communication with Standardized Data Structure
  async getStandardizedPlatformConfig(platformName: string, userId: string): Promise<any> {
    console.log(`🔧 PHASE 1: Getting standardized config for ${platformName}`);
    
    // Check cache first
    const cacheKey = `${platformName}_${userId}`;
    if (this.configCache.has(cacheKey)) {
      console.log(`📦 Using cached config for ${platformName}`);
      return this.configCache.get(cacheKey);
    }

    try {
      // PHASE 2: Query Universal Knowledge Store FIRST
      const knowledgeConfig = await this.queryUniversalKnowledge(platformName);
      if (knowledgeConfig) {
        console.log(`✅ PHASE 2: Found platform knowledge for ${platformName}`);
        this.configCache.set(cacheKey, knowledgeConfig);
        return knowledgeConfig;
      }

      // Fallback to AI with proper JSON structure
      const { data, error } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate standardized API configuration for ${platformName}. Return ONLY valid JSON with this structure: {"platform_name":"${platformName}","base_url":"https://api.platform.com","auth_config":{"type":"bearer","location":"header","parameter_name":"Authorization"},"test_endpoint":{"method":"GET","path":"/me","description":"Test authentication"},"error_patterns":{"401":"Invalid credentials","403":"Insufficient permissions"},"credential_fields":[{"name":"api_key","type":"string","required":true}]}`,
          messages: [],
          requestType: 'api_config_generation'
        }
      });

      if (error) {
        console.error('❌ PHASE 1: AI config generation failed:', error);
        return this.createFallbackConfig(platformName);
      }

      // PHASE 1: Proper JSON parsing with validation
      let standardizedConfig;
      try {
        if (typeof data === 'string') {
          // Extract JSON from potential markdown or text
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            standardizedConfig = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } else if (data?.api_configurations?.[0]) {
          standardizedConfig = data.api_configurations[0];
        } else {
          standardizedConfig = data;
        }

        // Validate required fields
        if (!standardizedConfig.base_url || !standardizedConfig.auth_config) {
          throw new Error('Invalid config structure');
        }

        console.log(`✅ PHASE 1: Standardized config created for ${platformName}`);
        this.configCache.set(cacheKey, standardizedConfig);
        return standardizedConfig;

      } catch (parseError) {
        console.error('❌ PHASE 1: Config parsing failed:', parseError);
        return this.createFallbackConfig(platformName);
      }

    } catch (error) {
      console.error('💥 PHASE 1: Complete config generation failed:', error);
      return this.createFallbackConfig(platformName);
    }
  }

  // PHASE 2: Universal Knowledge Store Integration
  async queryUniversalKnowledge(platformName: string): Promise<any> {
    try {
      console.log(`🔍 PHASE 2: Querying Universal Knowledge Store for ${platformName}`);
      
      const { data, error } = await this.supabase
        .from('universal_knowledge_store')
        .select('*')
        .eq('category', 'platform_knowledge')
        .or(`platform_name.ilike.%${platformName}%,title.ilike.%${platformName}%`)
        .order('usage_count', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        console.log(`⚠️ PHASE 2: No knowledge found for ${platformName}`);
        return null;
      }

      const knowledgeEntry = data[0];
      console.log(`✅ PHASE 2: Found knowledge entry for ${platformName}`);

      // Convert knowledge store data to standardized config
      const standardizedConfig = {
        platform_name: knowledgeEntry.platform_name || platformName,
        base_url: knowledgeEntry.details?.base_url || `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
        auth_config: knowledgeEntry.details?.auth_config || {
          type: 'bearer',
          location: 'header',
          parameter_name: 'Authorization'
        },
        test_endpoint: knowledgeEntry.details?.test_endpoint || {
          method: 'GET',
          path: '/me',
          description: `Test ${platformName} authentication`
        },
        error_patterns: knowledgeEntry.details?.error_patterns || {
          "401": "Invalid or expired credentials",
          "403": "Insufficient permissions or scope",
          "404": "API endpoint not found",
          "429": "Rate limit exceeded"
        },
        credential_fields: knowledgeEntry.credential_fields || [
          { name: 'api_key', type: 'string', required: true }
        ],
        knowledge_source: true,
        usage_count: knowledgeEntry.usage_count || 0
      };

      // Update usage count
      await this.supabase
        .from('universal_knowledge_store')
        .update({
          usage_count: (knowledgeEntry.usage_count || 0) + 1,
          last_used: new Date().toISOString()
        })
        .eq('id', knowledgeEntry.id);

      return standardizedConfig;

    } catch (error) {
      console.error('💥 PHASE 2: Universal Knowledge Store query failed:', error);
      return null;
    }
  }

  // PHASE 3: Enhanced Authentication Logic
  async buildAdvancedAuthHeaders(config: any, credentials: Record<string, string>): Promise<{headers: Record<string, string>, url: string}> {
    console.log(`🔐 PHASE 3: Building advanced auth for ${config.platform_name}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Enhanced-Tester/5.0',
      'Accept': 'application/json'
    };

    let testUrl = config.base_url + (config.test_endpoint?.path || '/me');
    const authConfig = config.auth_config;

    // PHASE 3: Platform-specific authentication handling
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
            headers[authConfig.parameter_name || 'X-API-Key'] = apiKey;
          } else if (authConfig.location === 'query') {
            const separator = testUrl.includes('?') ? '&' : '?';
            testUrl += `${separator}${authConfig.parameter_name || 'api_key'}=${apiKey}`;
          }
        }
        break;
        
      case 'basic':
        const username = credentials.username || credentials.email;
        const password = credentials.password || credentials.api_key;
        if (username && password) {
          const basicAuth = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
        }
        break;
        
      case 'oauth2':
        const accessToken = credentials.access_token;
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        break;

      // PHASE 3: Custom authentication patterns
      case 'custom':
        if (authConfig.headers) {
          Object.entries(authConfig.headers).forEach(([key, template]: [string, any]) => {
            let value = template;
            // Replace credential placeholders
            Object.entries(credentials).forEach(([credKey, credValue]) => {
              value = value.replace(`{${credKey}}`, credValue);
            });
            headers[key] = value;
          });
        }
        break;
        
      default:
        // Intelligent fallback
        if (credentials.access_token) {
          headers['Authorization'] = `Bearer ${credentials.access_token}`;
        } else if (credentials.api_key) {
          headers['Authorization'] = `Bearer ${credentials.api_key}`;
          headers['X-API-Key'] = credentials.api_key;
        }
    }

    // Add platform-specific headers if defined
    if (config.custom_headers) {
      Object.assign(headers, config.custom_headers);
    }

    return { headers, url: testUrl };
  }

  // PHASE 4: Enhanced Error Diagnosis
  analyzeAPIResponse(response: Response, responseData: any, config: any): {
    success: boolean;
    errorType: string;
    detailedMessage: string;
    troubleshooting: string[];
    technicalDetails: any;
  } {
    console.log(`🔍 PHASE 4: Analyzing response for ${config.platform_name}`);
    
    const status = response.status;
    const errorPatterns = config.error_patterns || {};
    
    // Success detection
    if (status >= 200 && status < 300) {
      // Additional success validation for platforms that return 200 with errors
      if (typeof responseData === 'object' && responseData !== null) {
        if (responseData.error || responseData.errors) {
          return {
            success: false,
            errorType: 'api_error',
            detailedMessage: `${config.platform_name} returned an error: ${responseData.error || responseData.errors}`,
            troubleshooting: [
              'Check if your credentials are valid and active',
              `Verify your ${config.platform_name} account permissions`,
              'Ensure the API key has the required scopes'
            ],
            technicalDetails: { responseData, status }
          };
        }
      }
      
      return {
        success: true,
        errorType: 'none',
        detailedMessage: `${config.platform_name} credentials verified successfully! API endpoint responded correctly.`,
        troubleshooting: [],
        technicalDetails: { responseData, status, endpoint: config.test_endpoint }
      };
    }

    // PHASE 4: Detailed error categorization
    let errorType = 'unknown_error';
    let detailedMessage = '';
    let troubleshooting: string[] = [];

    switch (status) {
      case 400:
        errorType = 'bad_request';
        detailedMessage = `${config.platform_name} API rejected the request. ${errorPatterns['400'] || 'Invalid request format or parameters.'}`;
        troubleshooting = [
          'Verify your credentials format is correct',
          `Check ${config.platform_name} API documentation for required parameters`,
          'Ensure you\'re using the correct API version'
        ];
        break;
        
      case 401:
        errorType = 'authentication_error';
        detailedMessage = `${config.platform_name} authentication failed. ${errorPatterns['401'] || 'Invalid or expired credentials.'}`;
        troubleshooting = [
          'Verify your API key or token is correct',
          'Check if your credentials have expired',
          `Ensure your ${config.platform_name} account is active`,
          'Try regenerating your API credentials'
        ];
        break;
        
      case 403:
        errorType = 'permission_error';
        detailedMessage = `${config.platform_name} access forbidden. ${errorPatterns['403'] || 'Insufficient permissions or scope.'}`;
        troubleshooting = [
          'Check your account subscription level',
          'Verify API scopes and permissions',
          `Ensure your ${config.platform_name} plan supports API access`,
          'Contact support if permissions seem correct'
        ];
        break;
        
      case 404:
        errorType = 'endpoint_not_found';
        detailedMessage = `${config.platform_name} API endpoint not found. ${errorPatterns['404'] || 'The API endpoint may have changed.'}`;
        troubleshooting = [
          'Verify the API endpoint URL is correct',
          `Check ${config.platform_name} API documentation for changes`,
          'Ensure you\'re using the correct API version'
        ];
        break;
        
      case 429:
        errorType = 'rate_limit_error';
        detailedMessage = `${config.platform_name} rate limit exceeded. ${errorPatterns['429'] || 'Too many requests.'}`;
        troubleshooting = [
          'Wait before retrying the request',
          'Consider upgrading your API plan',
          'Implement request rate limiting in your application'
        ];
        break;
        
      case 500:
      case 502:
      case 503:
        errorType = 'server_error';
        detailedMessage = `${config.platform_name} server error. ${errorPatterns[status.toString()] || 'The service may be temporarily unavailable.'}`;
        troubleshooting = [
          `Check ${config.platform_name} service status`,
          'Try again in a few minutes',
          'Contact support if the issue persists'
        ];
        break;
        
      default:
        detailedMessage = `${config.platform_name} API responded with status ${status}. ${errorPatterns[status.toString()] || 'Unexpected response.'}`;
        troubleshooting = [
          'Check the response details for more information',
          `Consult ${config.platform_name} API documentation`,
          'Contact support if the issue persists'
        ];
    }

    return {
      success: false,
      errorType,
      detailedMessage,
      troubleshooting,
      technicalDetails: { responseData, status, headers: response.headers }
    };
  }

  // PHASE 5: Real-time Testing with Full Transparency
  async testPlatformCredentialsWithTransparency(
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`🚀 PHASE 5: Starting transparent testing for ${platformName}`);

    try {
      // Get standardized configuration
      const config = await this.getStandardizedPlatformConfig(platformName, userId);
      console.log(`📋 PHASE 5: Configuration loaded for ${platformName}`);

      // Build authentication
      const { headers, url } = await this.buildAdvancedAuthHeaders(config, credentials);
      console.log(`🔐 PHASE 5: Authentication prepared for ${url}`);

      // Execute API test with timing
      const requestStart = Date.now();
      const response = await fetch(url, {
        method: config.test_endpoint?.method || 'GET',
        headers,
      });
      const requestTime = Date.now() - requestStart;

      // Parse response
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Analyze results
      const analysis = this.analyzeAPIResponse(response, responseData, config);
      const totalTime = Date.now() - startTime;

      console.log(`✅ PHASE 5: Testing completed for ${platformName} in ${totalTime}ms`);

      // PHASE 5: Comprehensive transparent response
      return {
        success: analysis.success,
        message: analysis.detailedMessage,
        error_type: analysis.errorType,
        details: {
          // Real-time transparency data
          endpoint_tested: url,
          method_used: config.test_endpoint?.method || 'GET',
          request_time_ms: requestTime,
          total_time_ms: totalTime,
          status_code: response.status,
          
          // Configuration transparency
          platform_config: {
            source: config.knowledge_source ? 'Universal Knowledge Store' : 'AI Generated',
            base_url: config.base_url,
            auth_method: config.auth_config?.type,
            test_path: config.test_endpoint?.path
          },
          
          // Authentication transparency
          auth_headers_used: Object.keys(headers).filter(key => 
            key.toLowerCase().includes('auth') || 
            key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token')
          ),
          
          // Response transparency
          response_preview: typeof responseData === 'object' ? 
            Object.keys(responseData).slice(0, 5) : 
            responseData.toString().substring(0, 100),
          
          // Technical details
          technical_analysis: analysis.technicalDetails,
          
          // Phase implementation markers
          phase_markers: {
            phase_1_communication: 'FIXED',
            phase_2_knowledge_store: config.knowledge_source ? 'ACTIVE' : 'FALLBACK',
            phase_3_enhanced_auth: 'IMPLEMENTED',
            phase_4_error_diagnosis: 'ENHANCED',
            phase_5_transparency: 'ACTIVE'
          }
        },
        troubleshooting: analysis.troubleshooting,
        
        // Real-time testing metrics
        performance_metrics: {
          config_load_time: `${requestStart - startTime}ms`,
          api_request_time: `${requestTime}ms`,
          total_processing_time: `${totalTime}ms`
        }
      };

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 PHASE 5: Testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Enhanced testing failed for ${platformName}: ${error.message}`,
        error_type: 'connection_error',
        details: {
          endpoint_tested: 'connection_failed',
          error_details: error.message,
          total_time_ms: totalTime,
          phase_markers: {
            phase_1_communication: 'ERROR',
            phase_2_knowledge_store: 'UNAVAILABLE',
            phase_3_enhanced_auth: 'FAILED',
            phase_4_error_diagnosis: 'SYSTEM_ERROR',
            phase_5_transparency: 'ERROR_MODE'
          }
        },
        troubleshooting: [
          'Check your internet connection',
          'Verify the platform service is operational',
          'Ensure credentials are valid and active',
          'Try testing again in a few minutes'
        ]
      };
    }
  }

  // Fallback configuration creator
  private createFallbackConfig(platformName: string): any {
    return {
      platform_name: platformName,
      base_url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
      auth_config: {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization'
      },
      test_endpoint: {
        method: 'GET',
        path: '/me',
        description: `Test ${platformName} authentication`
      },
      error_patterns: {
        "400": "Invalid request format",
        "401": "Invalid or expired credentials",
        "403": "Insufficient permissions",
        "404": "API endpoint not found",
        "429": "Rate limit exceeded",
        "500": "Server error"
      },
      credential_fields: [
        { name: 'api_key', type: 'string', required: true }
      ],
      fallback_config: true
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform_name, credentials, user_id } = await req.json();
    
    console.log(`🌟 ENHANCED PLATFORM TESTING: ${platform_name} for user ${user_id}`);
    console.log(`🔧 IMPLEMENTING ALL 5 PHASES OF FIXES`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tester = new EnhancedPlatformTester(supabase);
    const result = await tester.testPlatformCredentialsWithTransparency(platform_name, credentials, user_id);
    
    console.log(`📊 ENHANCED TEST RESULT for ${platform_name}:`, result.success ? '✅ SUCCESS' : '❌ FAILED');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ ENHANCED SYSTEM ERROR:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Enhanced credential testing system error: ${error.message}`,
        error_type: 'system_error',
        details: { 
          error: error.message,
          enhanced_system: true,
          all_phases_implemented: true
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
