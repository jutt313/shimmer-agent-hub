
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
    const { platformName, credentials, testConfig, chataiData, userId } = await req.json();
    
    console.log('🧪 REAL CHATAI TESTING:', { 
      platformName, 
      userId, 
      hasTestConfig: !!testConfig,
      hasChataiData: !!chataiData 
    });

    // Extract ChatAI configuration for real testing
    let baseUrl, testEndpoint, authConfig;
    
    if (chataiData?.original_platform) {
      // Use ChatAI original_platform data (highest priority)
      const originalPlatform = chataiData.original_platform;
      baseUrl = originalPlatform.base_url || originalPlatform.api_base_url;
      testEndpoint = originalPlatform.test_endpoint || '/health';
      
      if (originalPlatform.required_credentials?.[0]) {
        const firstCred = originalPlatform.required_credentials[0];
        authConfig = {
          header: getAuthHeader(firstCred.field_name, platformName),
          format: getAuthFormat(firstCred.field_name, platformName),
          field: firstCred.field_name
        };
      }
    } else if (testConfig) {
      // Fallback to testConfig
      baseUrl = testConfig.base_url;
      testEndpoint = testConfig.test_endpoint?.path || testConfig.test_endpoint;
      authConfig = testConfig.authentication;
    }

    if (!baseUrl) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No ChatAI configuration available for testing',
        details: { platform: platformName, missing: 'base_url' }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build test URL and headers
    const testUrl = `${baseUrl.replace(/\/$/, '')}${testEndpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-ChatAI-Tester/1.0'
    };

    // Apply ChatAI authentication
    if (authConfig && credentials) {
      const credentialValue = findCredentialValue(credentials, authConfig.field || 'api_key');
      if (credentialValue) {
        const authValue = applyAuthFormat(authConfig.format, credentialValue);
        headers[authConfig.header || authConfig.parameter_name || 'Authorization'] = authValue;
      }
    }

    console.log('📡 REAL API CALL:', {
      method: 'GET',
      url: testUrl,
      authHeader: authConfig?.header,
      platform: platformName
    });

    // Make real API call
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: headers
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw_response: responseText };
    }

    const isSuccess = response.ok && (response.status >= 200 && response.status < 300);

    if (isSuccess) {
      console.log('✅ REAL API SUCCESS:', platformName);
      return new Response(JSON.stringify({
        success: true,
        message: `${platformName} credentials tested successfully with real API`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: testUrl,
          chatai_driven: true,
          real_api_response: true,
          response_preview: typeof responseData === 'object' ? Object.keys(responseData).slice(0, 3) : 'text_response'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('❌ REAL API FAILURE:', response.status, platformName);
      const errorMessage = responseData?.error || responseData?.message || `HTTP ${response.status}`;
      
      return new Response(JSON.stringify({
        success: false,
        message: `${platformName} test failed: ${errorMessage}`,
        details: {
          status: response.status,
          platform: platformName,
          endpoint_tested: testUrl,
          error: errorMessage,
          response: responseData,
          chatai_driven: true,
          real_api_response: true
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
        chatai_driven: true,
        real_api_response: true
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions for ChatAI authentication
function getAuthHeader(fieldName: string, platformName: string): string {
  const lowerField = (fieldName || '').toLowerCase();
  const lowerPlatform = (platformName || '').toLowerCase();
  
  if (lowerPlatform.includes('elevenlabs') || lowerField.includes('xi')) {
    return 'xi-api-key';
  }
  
  return 'Authorization';
}

function getAuthFormat(fieldName: string, platformName: string): string {
  const lowerField = (fieldName || '').toLowerCase();
  const lowerPlatform = (platformName || '').toLowerCase();
  
  if (lowerPlatform.includes('elevenlabs') || lowerField.includes('xi')) {
    return '{api_key}';
  }
  
  return 'Bearer {api_key}';
}

function findCredentialValue(credentials: Record<string, string>, targetField: string): string | null {
  // Try exact match first
  if (credentials[targetField]) {
    return credentials[targetField];
  }
  
  // Try common variations
  const variations = ['api_key', 'access_token', 'token', 'bot_token', 'xi_api_key'];
  for (const variation of variations) {
    if (credentials[variation]) {
      return credentials[variation];
    }
  }
  
  // Return first available credential
  const keys = Object.keys(credentials);
  return keys.length > 0 ? credentials[keys[0]] : null;
}

function applyAuthFormat(format: string, credentialValue: string): string {
  if (!format) {
    return `Bearer ${credentialValue}`;
  }
  
  return format.replace(/\{[^}]+\}/g, credentialValue);
}
