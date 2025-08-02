
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FIXED: Correct built-in configurations with real API endpoints
const PLATFORM_CONFIGS = {
  'OpenAI': {
    base_url: 'https://api.openai.com',
    test_endpoint: '/v1/models', // CORRECT: OpenAI uses /v1/models, NOT /me
    method: 'GET',
    auth_header: 'Authorization',
    auth_format: 'Bearer {api_key}',
    success_indicators: ['data', 'object'],
    error_patterns: {
      401: 'Invalid API key',
      429: 'Rate limit exceeded'
    }
  },
  'GitHub': {
    base_url: 'https://api.github.com',
    test_endpoint: '/user', // CORRECT: GitHub uses /user
    method: 'GET',
    auth_header: 'Authorization',
    auth_format: 'token {personal_access_token}',
    success_indicators: ['login', 'id'],
    error_patterns: {
      401: 'Bad credentials',
      403: 'Forbidden'
    }
  },
  'Slack': {
    base_url: 'https://slack.com/api',
    test_endpoint: '/auth.test', // CORRECT: Slack auth test endpoint
    method: 'POST',
    auth_header: 'Authorization',
    auth_format: 'Bearer {bot_token}',
    success_indicators: ['ok'],
    error_patterns: {
      401: 'Invalid token'
    }
  },
  'Gmail': {
    base_url: 'https://gmail.googleapis.com',
    test_endpoint: '/gmail/v1/users/me/profile', // CORRECT: Gmail profile endpoint
    method: 'GET',
    auth_header: 'Authorization',
    auth_format: 'Bearer {access_token}',
    success_indicators: ['emailAddress'],
    error_patterns: {
      401: 'Invalid access token',
      403: 'Insufficient permissions'
    }
  },
  'Notion': {
    base_url: 'https://api.notion.com',
    test_endpoint: '/v1/users/me', // CORRECT: Notion user endpoint
    method: 'GET',
    auth_header: 'Authorization',
    auth_format: 'Bearer {integration_token}',
    success_indicators: ['id', 'name'],
    error_patterns: {
      401: 'Invalid integration token'
    }
  },
  'Trello': {
    base_url: 'https://api.trello.com',
    test_endpoint: '/1/members/me', // CORRECT: Trello member endpoint
    method: 'GET',
    auth_header: 'Authorization',
    auth_format: 'OAuth oauth_consumer_key="{api_key}", oauth_token="{token}"',
    success_indicators: ['id', 'username'],
    error_patterns: {
      401: 'Invalid API key or token'
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platformName, credentials, testConfig, userId } = await req.json();
    
    console.log('🧪 TESTING CREDENTIALS:', { platformName, userId, hasTestConfig: !!testConfig });

    // PRIORITY 1: Use AI-generated test config if provided
    let config;
    if (testConfig && testConfig.base_url && testConfig.test_endpoint) {
      console.log('✅ USING: AI-generated test configuration');
      config = {
        base_url: testConfig.base_url,
        test_endpoint: testConfig.test_endpoint.path || testConfig.test_endpoint,
        method: testConfig.test_endpoint.method || 'GET',
        auth_header: testConfig.authentication?.parameter_name || 'Authorization',
        auth_format: testConfig.authentication?.format || 'Bearer {api_key}',
        success_indicators: testConfig.success_indicators?.response_patterns || ['success'],
        error_patterns: testConfig.error_patterns || { 401: 'Unauthorized' }
      };
    }
    // PRIORITY 2: Use built-in configuration
    else if (PLATFORM_CONFIGS[platformName]) {
      console.log('✅ USING: Built-in platform configuration for', platformName);
      config = PLATFORM_CONFIGS[platformName];
    }
    // PRIORITY 3: Generate basic fallback
    else {
      console.log('⚠️ FALLBACK: Using basic configuration for', platformName);
      config = {
        base_url: `https://api.${platformName.toLowerCase()}.com`,
        test_endpoint: '/me',
        method: 'GET',
        auth_header: 'Authorization',
        auth_format: 'Bearer {api_key}',
        success_indicators: ['id'],
        error_patterns: { 401: 'Invalid credentials' }
      };
    }

    // Build test URL
    const testUrl = `${config.base_url}${config.test_endpoint}`;
    console.log('🎯 TESTING URL:', testUrl);

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Test/1.0'
    };

    // IMPROVED: Add authentication header
    if (config.auth_header && config.auth_format) {
      // Find the credential field to use
      let credentialValue = null;
      
      // Try common patterns
      const commonFields = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token', 'personal_access_token'];
      for (const field of commonFields) {
        if (credentials[field]) {
          credentialValue = credentials[field];
          break;
        }
      }

      // Use first available credential if no common pattern found
      if (!credentialValue) {
        const credentialKeys = Object.keys(credentials);
        if (credentialKeys.length > 0) {
          credentialValue = credentials[credentialKeys[0]];
        }
      }

      if (credentialValue) {
        // Replace placeholder in auth format
        const authValue = config.auth_format.replace(/\{[^}]+\}/g, credentialValue);
        headers[config.auth_header] = authValue;
        console.log('🔐 AUTH HEADER:', config.auth_header, 'set');
      } else {
        console.error('❌ NO CREDENTIAL: No valid credential found');
        return new Response(JSON.stringify({
          success: false,
          message: 'No valid credentials provided',
          details: {
            platform: platformName,
            available_fields: Object.keys(credentials),
            expected_fields: commonFields
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Make the test request
    console.log('📡 MAKING REQUEST:', config.method, testUrl);
    const response = await fetch(testUrl, {
      method: config.method,
      headers: headers
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    console.log('📥 RESPONSE:', response.status, typeof responseData);

    // Check for success
    const isSuccess = response.ok && (
      config.success_indicators.some(indicator => 
        responseData && typeof responseData === 'object' && responseData[indicator] !== undefined
      ) || response.status === 200
    );

    if (isSuccess) {
      console.log('✅ TEST SUCCESS:', platformName);
      return new Response(JSON.stringify({
        success: true,
        message: `${platformName} credentials are valid and working`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: testUrl,
          response_preview: Object.keys(responseData).slice(0, 3),
          config_source: testConfig ? 'ai_generated' : 'built_in'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ TEST FAILED:', response.status, platformName);
      const errorMessage = config.error_patterns[response.status] || 
                          (responseData?.error || responseData?.message) || 
                          `HTTP ${response.status}`;
      
      return new Response(JSON.stringify({
        success: false,
        message: `${platformName} test failed: ${errorMessage}`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: testUrl,
          error: errorMessage,
          response: responseData,
          config_source: testConfig ? 'ai_generated' : 'built_in'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('💥 TEST ERROR:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Test failed: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack?.substring(0, 500)
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
