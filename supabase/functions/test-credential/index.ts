
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CRITICAL FIX: Universal ChatAI Script Executor - NO HARDCODED PLATFORMS
const executeUniversalChatAIScript = (platformName: string, testConfig: any, credentials: Record<string, string>) => {
  console.log('🚀 UNIVERSAL EXECUTOR: Processing ChatAI script for:', platformName);
  console.log('🔧 Test config received:', testConfig);
  console.log('🔧 Credentials fields:', Object.keys(credentials));

  // STEP 1: Extract base configuration from ChatAI
  const baseUrl = testConfig.base_url || testConfig.url || testConfig.endpoint?.base;
  const testEndpoint = testConfig.test_endpoint?.path || testConfig.test_endpoint || testConfig.endpoint?.path || '/health';
  const method = testConfig.test_endpoint?.method || testConfig.method || 'GET';
  
  if (!baseUrl) {
    throw new Error(`ChatAI script missing base_url for ${platformName}`);
  }

  // STEP 2: Build dynamic headers from ChatAI configuration
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Universal-Tester/1.0'
  };

  // STEP 3: Dynamic authentication header construction
  const authConfig = testConfig.authentication || {};
  const authHeader = authConfig.parameter_name || authConfig.header || 'Authorization';
  const authFormat = authConfig.format || 'Bearer {api_key}';

  // STEP 4: Intelligent credential selection
  let credentialValue = null;
  const credentialKeys = Object.keys(credentials);
  
  // Try platform-specific field first
  const platformSpecificFields = {
    'elevenlabs': 'xi_api_key',
    'openai': 'api_key',
    'slack': 'bot_token',
    'notion': 'access_token',
    'typeform': 'access_token'
  };
  
  const platformKey = platformName.toLowerCase();
  if (platformSpecificFields[platformKey] && credentials[platformSpecificFields[platformKey]]) {
    credentialValue = credentials[platformSpecificFields[platformKey]];
  } else {
    // Fallback to common credential patterns
    const commonFields = ['api_key', 'access_token', 'token', 'bot_token', 'xi_api_key'];
    for (const field of commonFields) {
      if (credentials[field]) {
        credentialValue = credentials[field];
        break;
      }
    }
    
    // Last resort: use first available credential
    if (!credentialValue && credentialKeys.length > 0) {
      credentialValue = credentials[credentialKeys[0]];
    }
  }

  if (!credentialValue) {
    throw new Error(`No valid credentials provided for ${platformName}`);
  }

  // STEP 5: Apply authentication format
  const authValue = authFormat.replace(/\{[^}]+\}/g, credentialValue);
  headers[authHeader] = authValue;

  // STEP 6: Build final test URL and configuration
  const testUrl = `${baseUrl.replace(/\/$/, '')}${testEndpoint}`;
  
  console.log('✅ UNIVERSAL EXECUTOR: Built configuration:', {
    platform: platformName,
    url: testUrl,
    method: method,
    authHeader: authHeader,
    hasCredential: !!credentialValue
  });

  return {
    url: testUrl,
    method: method,
    headers: headers,
    authHeader: authHeader,
    credentialUsed: credentialKeys.find(k => credentials[k] === credentialValue)
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platformName, credentials, testConfig, userId } = await req.json();
    
    console.log('🧪 UNIVERSAL TESTING:', { platformName, userId, hasTestConfig: !!testConfig });

    // CRITICAL: Require ChatAI-generated test configuration
    if (!testConfig) {
      console.error('❌ NO CHATAI CONFIG: Missing ChatAI-generated test configuration');
      return new Response(JSON.stringify({
        success: false,
        message: 'ChatAI test configuration is required for universal testing',
        details: {
          platform: platformName,
          error: 'ChatAI must provide test configuration for any platform',
          universal_testing: true
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // UNIVERSAL EXECUTION: Use ChatAI script executor for ANY platform
    const scriptConfig = executeUniversalChatAIScript(platformName, testConfig, credentials);
    
    console.log('📡 UNIVERSAL REQUEST:', scriptConfig.method, scriptConfig.url);
    
    // Execute the universal test
    const response = await fetch(scriptConfig.url, {
      method: scriptConfig.method,
      headers: scriptConfig.headers
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    console.log('📥 UNIVERSAL RESPONSE:', response.status, typeof responseData);

    // Universal success detection
    const isSuccess = response.ok && (response.status >= 200 && response.status < 300);

    if (isSuccess) {
      console.log('✅ UNIVERSAL SUCCESS:', platformName);
      return new Response(JSON.stringify({
        success: true,
        message: `${platformName} credentials tested successfully with ChatAI universal executor`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: scriptConfig.url,
          auth_header_used: scriptConfig.authHeader,
          credential_field_used: scriptConfig.credentialUsed,
          universal_executor: true,
          chatai_driven: true,
          response_preview: typeof responseData === 'object' ? Object.keys(responseData).slice(0, 3) : 'text_response'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ UNIVERSAL FAILURE:', response.status, platformName);
      const errorMessage = responseData?.error || responseData?.message || `HTTP ${response.status}`;
      
      return new Response(JSON.stringify({
        success: false,
        message: `${platformName} test failed: ${errorMessage}`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: scriptConfig.url,
          auth_header_used: scriptConfig.authHeader,
          credential_field_used: scriptConfig.credentialUsed,
          error: errorMessage,
          response: responseData,
          universal_executor: true,
          chatai_driven: true
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
        universal_executor: true,
        chatai_driven: true
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
