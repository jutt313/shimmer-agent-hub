
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platformName, credentials, testConfig, authPattern, userId } = await req.json();
    
    console.log('🧪 UNIVERSAL AUTH TESTING:', { 
      platformName, 
      userId, 
      authPattern: authPattern?.type,
      hasTestConfig: !!testConfig 
    });

    // UNIVERSAL: Validate AI-generated or universal test config
    if (!testConfig || !testConfig.base_url || !testConfig.test_endpoint) {
      console.error('❌ NO CONFIG: Missing test configuration');
      return new Response(JSON.stringify({
        success: false,
        message: 'No test configuration provided',
        details: {
          platform: platformName,
          error: 'Test configuration is required',
          received_config: testConfig
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UNIVERSAL: Build configuration from provided config
    const config = {
      base_url: testConfig.base_url,
      test_endpoint: testConfig.test_endpoint.path || testConfig.test_endpoint,
      method: testConfig.test_endpoint.method || 'GET',
      authentication: testConfig.authentication || {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {api_key}'
      }
    };

    // Build test URL
    const testUrl = `${config.base_url}${config.test_endpoint}`;
    console.log('🎯 UNIVERSAL TESTING URL:', testUrl);

    // UNIVERSAL: Build headers with dynamic authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Universal-Auth-Test/4.0'
    };

    // UNIVERSAL AUTH: Apply authentication based on detected pattern
    if (config.authentication.location === 'header') {
      const credentialValue = getUniversalCredentialValue(credentials, config.authentication);
      
      if (credentialValue) {
        // Apply authentication format (supports both Bearer and custom headers like xi-api-key)
        const authValue = config.authentication.format.replace(/\{[\w_]+\}/g, credentialValue);
        headers[config.authentication.parameter_name] = authValue;
        
        console.log('🔐 UNIVERSAL AUTH APPLIED:', {
          header_name: config.authentication.parameter_name,
          auth_type: config.authentication.type,
          format: config.authentication.format
        });
      } else {
        console.error('❌ NO CREDENTIAL: No valid credential found');
        return new Response(JSON.stringify({
          success: false,
          message: 'No valid credentials provided',
          details: {
            platform: platformName,
            available_fields: Object.keys(credentials),
            expected_field: config.authentication.credential_field || 'api_key',
            auth_pattern: config.authentication
          }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Make the test request
    console.log('📡 UNIVERSAL REQUEST:', config.method, testUrl);
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

    console.log('📥 UNIVERSAL RESPONSE:', response.status, typeof responseData);

    // Check for success using universal patterns
    const successIndicators = testConfig.success_indicators?.response_patterns || ['success', 'id', 'user', 'data'];
    const isSuccess = response.ok && (
      successIndicators.some(indicator => 
        responseData && typeof responseData === 'object' && responseData[indicator] !== undefined
      ) || response.status === 200
    );

    if (isSuccess) {
      console.log('✅ UNIVERSAL TEST SUCCESS:', platformName);
      return new Response(JSON.stringify({
        success: true,
        message: `${platformName} credentials verified with Universal Authentication!`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: testUrl,
          auth_method: config.authentication.type,
          auth_header: config.authentication.parameter_name,
          response_preview: Object.keys(responseData).slice(0, 3),
          universal_auth_success: true,
          config_source: testConfig.ai_generated ? 'ai_generated' : 'universal_fallback'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ UNIVERSAL TEST FAILED:', response.status, platformName);
      const errorPatterns = testConfig.error_patterns || {};
      const errorMessage = errorPatterns[response.status] || 
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
          auth_method: config.authentication.type,
          auth_header: config.authentication.parameter_name,
          response: responseData,
          universal_auth_applied: true,
          troubleshooting: `Check if ${config.authentication.parameter_name} header format is correct for ${platformName}`
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('💥 UNIVERSAL TEST ERROR:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Universal test failed: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        universal_auth_system: true
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * UNIVERSAL: Get credential value using smart detection
 */
function getUniversalCredentialValue(
  credentials: Record<string, string>, 
  authentication: any
): string | null {
  // Try the specified credential field first
  if (authentication.credential_field && credentials[authentication.credential_field]) {
    return credentials[authentication.credential_field];
  }
  
  // Try common credential fields
  const commonFields = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token', 'personal_access_token', 'secret_key'];
  
  for (const field of commonFields) {
    if (credentials[field]) {
      return credentials[field];
    }
  }
  
  // Try first available credential
  const credentialKeys = Object.keys(credentials);
  if (credentialKeys.length > 0) {
    return credentials[credentialKeys[0]];
  }
  
  return null;
}

console.log('✅ Universal Authentication Test System Active - Supports ALL platforms dynamically');
