
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SOLUTION 2: Platform-specific authentication header mapping
const getAuthHeader = (platformName: string, testConfig: any) => {
  const platformHeaders = {
    'ElevenLabs': 'xi-api-key',
    'OpenAI': 'Authorization',
    'Typeform': 'Authorization',
    'Slack': 'Authorization',
    'Notion': 'Authorization'
  };
  
  return testConfig.authentication?.parameter_name || 
         platformHeaders[platformName] || 
         'Authorization';
};

// SOLUTION 3: Platform-specific credential field mapping
const getCredentialField = (platformName: string) => {
  const platformFields = {
    'ElevenLabs': 'xi_api_key',
    'OpenAI': 'api_key',
    'Typeform': 'access_token',
    'Slack': 'bot_token',
    'Notion': 'access_token'
  };
  
  return platformFields[platformName] || 'api_key';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platformName, credentials, testConfig, userId } = await req.json();
    
    console.log('🧪 TESTING CREDENTIALS:', { platformName, userId, hasTestConfig: !!testConfig });

    // CRITICAL: Use ONLY AI-generated test config (no hardcoded fallbacks)
    if (!testConfig || !testConfig.base_url || !testConfig.test_endpoint) {
      console.error('❌ NO AI CONFIG: Missing AI-generated test configuration');
      return new Response(JSON.stringify({
        success: false,
        message: 'No AI-generated test configuration provided',
        details: {
          platform: platformName,
          error: 'AI test configuration is required',
          received_config: testConfig
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SOLUTION 2: Build configuration with platform-specific auth headers
    const config = {
      base_url: testConfig.base_url,
      test_endpoint: testConfig.test_endpoint.path || testConfig.test_endpoint,
      method: testConfig.test_endpoint.method || 'GET',
      auth_header: getAuthHeader(platformName, testConfig),
      auth_format: testConfig.authentication?.format || 'Bearer {api_key}',
      success_indicators: testConfig.success_indicators?.response_patterns || ['success'],
      error_patterns: testConfig.error_patterns || { 401: 'Unauthorized' }
    };

    // Build test URL
    const testUrl = `${config.base_url}${config.test_endpoint}`;
    console.log('🎯 TESTING URL:', testUrl);

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Test/1.0'
    };

    // SOLUTION 3: Add authentication header with platform-specific credential field detection
    if (config.auth_header && config.auth_format) {
      // Use platform-specific field first
      const preferredField = getCredentialField(platformName);
      let credentialValue = credentials[preferredField];

      if (!credentialValue) {
        // Fall back to common patterns
        const commonFields = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token', 'personal_access_token'];
        for (const field of commonFields) {
          if (credentials[field]) {
            credentialValue = credentials[field];
            break;
          }
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
        console.log('🔐 AUTH HEADER:', config.auth_header, 'set for platform:', platformName);
      } else {
        console.error('❌ NO CREDENTIAL: No valid credential found for platform:', platformName);
        return new Response(JSON.stringify({
          success: false,
          message: 'No valid credentials provided',
          details: {
            platform: platformName,
            available_fields: Object.keys(credentials),
            expected_field: preferredField,
            fallback_fields: ['api_key', 'access_token', 'token', 'bot_token']
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Make the test request
    console.log('📡 MAKING REQUEST:', config.method, testUrl, 'with auth header:', config.auth_header);
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
      console.log('✅ TEST SUCCESS:', platformName, 'with auth header:', config.auth_header);
      return new Response(JSON.stringify({
        success: true,
        message: `${platformName} credentials are valid and working`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: testUrl,
          auth_header_used: config.auth_header,
          response_preview: Object.keys(responseData).slice(0, 3),
          config_source: 'ai_generated_only',
          ai_driven: true,
          platform_specific_auth: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ TEST FAILED:', response.status, platformName, 'with auth header:', config.auth_header);
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
          auth_header_used: config.auth_header,
          error: errorMessage,
          response: responseData,
          config_source: 'ai_generated_only',
          ai_driven: true,
          platform_specific_auth: true
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
        stack: error.stack?.substring(0, 500),
        ai_driven_only: true,
        platform_specific_auth: true
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
