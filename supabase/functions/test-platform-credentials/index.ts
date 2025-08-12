
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
    const { platformName, credentials, testConfig, test_payloads, chatai_data } = await req.json();
    
    console.log('🧪 REAL CHATAI TESTING:', { platformName, hasTestConfig: !!testConfig, hasChatAIData: !!chatai_data });

    // STEP 1: Extract ChatAI test configuration
    let testUrl = '';
    let testMethod = 'GET';
    let authHeaders: Record<string, string> = {};

    // Priority 1: Use ChatAI original_platform configuration
    if (chatai_data?.original_platform) {
      const originalPlatform = chatai_data.original_platform;
      
      // Build test URL from ChatAI data
      if (originalPlatform.base_url || originalPlatform.api_base_url) {
        const baseUrl = (originalPlatform.base_url || originalPlatform.api_base_url).replace(/\/$/, '');
        const endpoint = originalPlatform.test_endpoint || '/user' || '/me';
        testUrl = `${baseUrl}${endpoint}`;
      }
      
      // Build authentication from ChatAI data
      if (originalPlatform.required_credentials && originalPlatform.required_credentials.length > 0) {
        const cred = originalPlatform.required_credentials[0];
        const credValue = credentials[cred.field_name];
        
        if (credValue) {
          // Use ChatAI's authentication format
          if (cred.authentication_method === 'header') {
            const headerName = cred.header_name || 'Authorization';
            const headerFormat = cred.header_format || 'Bearer {value}';
            authHeaders[headerName] = headerFormat.replace('{value}', credValue);
          }
        }
      }
    }

    // Priority 2: Use testConfig if available
    if (!testUrl && testConfig) {
      if (testConfig.base_url && testConfig.test_endpoint) {
        testUrl = `${testConfig.base_url.replace(/\/$/, '')}${testConfig.test_endpoint.path || testConfig.test_endpoint}`;
        testMethod = testConfig.test_endpoint.method || testConfig.method || 'GET';
        
        // Build auth from testConfig
        if (testConfig.authentication) {
          const auth = testConfig.authentication;
          const credKey = Object.keys(credentials)[0]; // Use first available credential
          const credValue = credentials[credKey];
          
          if (credValue && auth.parameter_name) {
            const authValue = auth.format ? auth.format.replace(/\{[^}]+\}/g, credValue) : credValue;
            authHeaders[auth.parameter_name] = authValue;
          }
        }
      }
    }

    // Priority 3: Use test_payloads if available
    if (!testUrl && test_payloads && test_payloads.length > 0) {
      const payload = test_payloads[0];
      if (payload.request && payload.request.url) {
        testUrl = payload.request.url;
        testMethod = payload.request.method || 'GET';
        
        // Extract auth from payload headers
        if (payload.request.headers) {
          Object.entries(payload.request.headers).forEach(([key, value]: [string, any]) => {
            if (typeof value === 'string' && value.includes('{')) {
              // Replace credential placeholders
              const credKey = Object.keys(credentials)[0];
              if (credentials[credKey]) {
                authHeaders[key] = value.replace(/\{[^}]+\}/g, credentials[credKey]);
              }
            } else {
              authHeaders[key] = value;
            }
          });
        }
      }
    }

    // Fallback: Generate basic test configuration
    if (!testUrl) {
      console.log('⚠️ No ChatAI config found, using platform-specific fallback');
      const lowerPlatform = platformName.toLowerCase();
      
      if (lowerPlatform.includes('elevenlabs')) {
        testUrl = 'https://api.elevenlabs.io/v1/user';
        const apiKey = credentials.xi_api_key || credentials.api_key;
        if (apiKey) {
          authHeaders['xi-api-key'] = apiKey;
        }
      } else if (lowerPlatform.includes('openai')) {
        testUrl = 'https://api.openai.com/v1/models';
        const apiKey = credentials.api_key;
        if (apiKey) {
          authHeaders['Authorization'] = `Bearer ${apiKey}`;
        }
      } else {
        // Generic fallback
        testUrl = `https://api.${lowerPlatform.replace(/\s+/g, '')}.com/me`;
        const apiKey = credentials.api_key || credentials.access_token || Object.values(credentials)[0];
        if (apiKey) {
          authHeaders['Authorization'] = `Bearer ${apiKey}`;
        }
      }
    }

    if (!testUrl) {
      throw new Error(`No test configuration available for ${platformName}`);
    }

    // STEP 2: Execute the real API test
    console.log('📡 EXECUTING REAL TEST:', testMethod, testUrl);
    console.log('🔑 Auth headers:', Object.keys(authHeaders));

    const testHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-ChatAI-Tester/1.0',
      ...authHeaders
    };

    const response = await fetch(testUrl, {
      method: testMethod,
      headers: testHeaders
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    console.log('📥 REAL API RESPONSE:', response.status, typeof responseData);

    // STEP 3: Return real test results
    const isSuccess = response.ok && (response.status >= 200 && response.status < 300);

    if (isSuccess) {
      console.log('✅ REAL API SUCCESS:', platformName);
      return new Response(JSON.stringify({
        success: true,
        message: `✅ ${platformName} credentials verified successfully using ChatAI configuration!`,
        details: {
          status: response.status,
          platform: platformName,
          test_url: testUrl,
          test_method: testMethod,
          auth_headers_used: Object.keys(authHeaders),
          chatai_powered: true,
          real_api_test: true,
          response_preview: typeof responseData === 'object' ? Object.keys(responseData).slice(0, 5) : 'text_response',
          chatai_data_used: {
            original_platform: !!chatai_data?.original_platform,
            test_config: !!testConfig,
            test_payloads: !!test_payloads
          }
        },
        api_response: responseData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ REAL API FAILURE:', response.status, platformName);
      const errorMessage = responseData?.error?.message || responseData?.error || responseData?.message || `HTTP ${response.status}`;
      
      return new Response(JSON.stringify({
        success: false,
        message: `❌ ${platformName} credentials test failed: ${errorMessage}`,
        details: {
          status: response.status,
          platform: platformName,
          test_url: testUrl,
          test_method: testMethod,
          auth_headers_used: Object.keys(authHeaders),
          error: errorMessage,
          chatai_powered: true,
          real_api_test: true,
          response: responseData,
          chatai_data_used: {
            original_platform: !!chatai_data?.original_platform,
            test_config: !!testConfig,
            test_payloads: !!test_payloads
          }
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('💥 REAL API TEST ERROR:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Real API test failed: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack?.substring(0, 500),
        chatai_powered: true,
        real_api_test: true
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
