import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FIXED: Enhanced built-in platform configurations
const BUILT_IN_CONFIGS: Record<string, any> = {
  'typeform': {
    platform_name: 'Typeform',
    base_url: 'https://api.typeform.com',
    test_endpoint: {
      path: '/me',
      method: 'GET',
      headers: {},
      query_params: {}
    },
    authentication: {
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {token}'
    },
    field_mappings: {
      'personal_access_token': 'token',
      'api_key': 'token',
      'access_token': 'token'
    },
    success_indicators: {
      status_codes: [200],
      response_patterns: ['alias', 'email']
    },
    error_patterns: {
      '401': 'Invalid or expired personal access token',
      '403': 'Insufficient permissions for this token',
      '404': 'API endpoint not found'
    },
    ai_generated: false
  },
  'slack': {
    platform_name: 'Slack',
    base_url: 'https://slack.com/api',
    test_endpoint: {
      path: '/auth.test',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    },
    authentication: {
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {token}'
    },
    field_mappings: {
      'bot_token': 'token',
      'oauth_token': 'token',
      'api_token': 'token'
    },
    success_indicators: {
      status_codes: [200],
      response_patterns: ['ok', 'user']
    },
    error_patterns: {
      '401': 'Invalid Slack token',
      '403': 'Token lacks required scopes'
    },
    ai_generated: false
  },
  'discord': {
    platform_name: 'Discord',
    base_url: 'https://discord.com/api/v10',
    test_endpoint: {
      path: '/users/@me',
      method: 'GET'
    },
    authentication: {
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bot {token}'
    },
    field_mappings: {
      'bot_token': 'token',
      'token': 'token'
    },
    success_indicators: {
      status_codes: [200],
      response_patterns: ['id', 'username']
    },
    error_patterns: {
      '401': 'Invalid Discord bot token',
      '403': 'Bot lacks required permissions'
    },
    ai_generated: false
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🎯 SURGICAL FIX 1: Extract testConfig parameter from frontend
    const { platformName, credentials, userId, testConfig: frontendTestConfig } = await req.json();
    
    console.log('🧪 FIXED: Enhanced credential testing for:', platformName);
    console.log('🎯 FIXED: Frontend testConfig received:', frontendTestConfig ? 'YES' : 'NO');

    // Step 1: Prioritize frontend-sent AI config, then built-in, then generate new AI config
    let testConfig = frontendTestConfig;
    
    // 🎯 SURGICAL FIX 2: Use frontend testConfig first, fallback to built-in or AI generation
    if (!testConfig) {
      console.log('📋 FIXED: No frontend testConfig, checking built-in configs...');
      testConfig = BUILT_IN_CONFIGS[platformName.toLowerCase()];
    }
    
    if (!testConfig && openAIApiKey) {
      console.log('🤖 FIXED: Generating new AI configuration for:', platformName);
      testConfig = await generateAITestConfig(platformName);
    }
    
    if (!testConfig) {
      console.log('❌ FIXED: No configuration available for:', platformName);
      return new Response(JSON.stringify({
        success: false,
        message: `No test configuration available for ${platformName}. Frontend config: ${frontendTestConfig ? 'received but invalid' : 'not received'}, built-in config: ${BUILT_IN_CONFIGS[platformName.toLowerCase()] ? 'available' : 'not available'}, AI generation: ${openAIApiKey ? 'attempted but failed' : 'unavailable'}`,
        details: {
          platform_name: platformName,
          ai_generated_config: false,
          error_type: 'no_config',
          frontend_config_status: frontendTestConfig ? 'received' : 'not_received',
          built_in_config_status: BUILT_IN_CONFIGS[platformName.toLowerCase()] ? 'available' : 'not_available'
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🎯 SURGICAL FIX 3: Log which config source is being used
    const configSource = frontendTestConfig ? 'frontend-ai-generated' : 
                        BUILT_IN_CONFIGS[platformName.toLowerCase()] ? 'built-in' : 
                        'newly-ai-generated';
    console.log('📡 FIXED: Using config source:', configSource);

    // Step 2: Build test request
    const testRequest = buildTestRequest(testConfig, credentials);
    console.log('📡 FIXED: Testing endpoint:', testRequest.url);

    // Step 3: Execute test
    const response = await fetch(testRequest.url, testRequest.options);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Step 4: Evaluate success
    const isSuccess = evaluateTestSuccess(response, responseData, testConfig);
    
    if (isSuccess) {
      console.log('✅ FIXED: Credential test successful for:', platformName);
      
      return new Response(JSON.stringify({
        success: true,
        message: `${platformName} credentials verified successfully using ${configSource} configuration!`,
        details: {
          status: response.status,
          endpoint_tested: testRequest.url,
          ai_generated_config: testConfig.ai_generated || (configSource === 'frontend-ai-generated'),
          platform_name: testConfig.platform_name || platformName,
          api_response: sanitizeResponse(responseData),
          headers_used: testRequest.options.headers || {},
          config_source: configSource
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.error('❌ FIXED: Credential test failed for:', platformName, response.status);
      
      return new Response(JSON.stringify({
        success: false,
        message: generateErrorMessage(platformName, response.status, testConfig, configSource),
        error_type: categorizeError(response.status),
        details: {
          status: response.status,
          endpoint_tested: testRequest.url,
          ai_generated_config: testConfig.ai_generated || (configSource === 'frontend-ai-generated'),
          platform_name: testConfig.platform_name || platformName,
          api_response: sanitizeResponse(responseData),
          headers_used: testRequest.options.headers || {},
          config_source: configSource
        },
        troubleshooting: generateTroubleshootingSteps(platformName, response.status, testConfig)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('💥 FIXED: Test credential error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Testing failed: ${error.message}`,
      error_type: 'system_error',
      details: {
        platform_name: 'unknown',
        system_error: true,
        error_message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// FIXED: Enhanced AI configuration generation
async function generateAITestConfig(platformName: string): Promise<any> {
  if (!openAIApiKey) {
    console.warn('⚠️ FIXED: No OpenAI API key available for AI config generation');
    return null;
  }

  try {
    console.log('🤖 FIXED: Generating AI test configuration for:', platformName);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an API testing expert. Generate a test configuration for ${platformName} API credential testing. Respond with ONLY valid JSON in this exact format:
{
  "platform_name": "${platformName}",
  "base_url": "https://api.example.com",
  "test_endpoint": {
    "path": "/endpoint/path",
    "method": "GET",
    "headers": {},
    "query_params": {}
  },
  "authentication": {
    "location": "header",
    "parameter_name": "Authorization",
    "format": "Bearer {token}"
  },
  "field_mappings": {
    "api_key": "token",
    "access_token": "token"
  },
  "success_indicators": {
    "status_codes": [200],
    "response_patterns": ["id", "name"]
  },
  "error_patterns": {
    "401": "Invalid credentials",
    "403": "Insufficient permissions"
  },
  "ai_generated": true
}`
          },
          {
            role: 'user',
            content: `Generate API test configuration for ${platformName}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const configText = data.choices[0].message.content.trim();
    
    // Parse the AI-generated configuration
    const config = JSON.parse(configText);
    config.ai_generated = true;
    
    console.log('✅ FIXED: AI configuration generated successfully for:', platformName);
    return config;
    
  } catch (error) {
    console.error('❌ FIXED: Failed to generate AI configuration:', error);
    return null;
  }
}

// Helper functions
function buildTestRequest(testConfig: any, credentials: Record<string, string>): any {
  const { base_url, test_endpoint, authentication, field_mappings } = testConfig;
  
  let url = `${base_url}${test_endpoint.path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Enhanced-Tester/2.0',
    ...test_endpoint.headers
  };

  // Apply authentication
  if (authentication.location === 'header') {
    const credentialValue = getCredentialValue(credentials, field_mappings);
    if (credentialValue) {
      headers[authentication.parameter_name] = authentication.format.replace(/\{[\w_]+\}/g, credentialValue);
    }
  }

  // Add query parameters
  if (test_endpoint.query_params) {
    const params = new URLSearchParams(test_endpoint.query_params);
    url += `?${params.toString()}`;
  }

  return {
    url,
    options: {
      method: test_endpoint.method,
      headers
    }
  };
}

function getCredentialValue(credentials: Record<string, string>, fieldMappings: Record<string, string>): string | null {
  for (const [platformField, userField] of Object.entries(fieldMappings)) {
    if (credentials[userField] || credentials[platformField]) {
      return credentials[userField] || credentials[platformField];
    }
  }
  
  // Fallback to common patterns
  const commonPatterns = ['api_key', 'access_token', 'token', 'bot_token'];
  for (const pattern of commonPatterns) {
    if (credentials[pattern]) {
      return credentials[pattern];
    }
  }
  
  return null;
}

function evaluateTestSuccess(response: Response, responseData: any, testConfig: any): boolean {
  if (!testConfig.success_indicators.status_codes.includes(response.status)) {
    return false;
  }
  
  if (typeof responseData === 'object' && responseData !== null) {
    return testConfig.success_indicators.response_patterns.some((pattern: string) => {
      return responseData.hasOwnProperty(pattern);
    });
  }
  
  return true;
}

function generateErrorMessage(platformName: string, status: number, testConfig: any, configSource: string): string {
  const statusMessage = testConfig.error_patterns[status.toString()] || `HTTP ${status} error`;
  return `${platformName} test failed (${configSource} config): ${statusMessage}`;
}

function generateTroubleshootingSteps(platformName: string, status: number, testConfig: any): string[] {
  const base = [
    `Verify ${platformName} credentials are correct and active`,
    'Check API documentation for required permissions',
    'Ensure account has necessary subscription level'
  ];

  if (testConfig.ai_generated) {
    base.push('Using AI-generated test configuration - may need manual verification');
  }

  switch (status) {
    case 401:
      return [...base, 'Check if API keys have expired', 'Verify authentication format'];
    case 403:
      return [...base, 'Check API scopes and permissions', 'Verify account access level'];
    case 404:
      return [...base, 'Verify API endpoint URL', 'Check API version compatibility'];
    case 429:
      return [...base, 'Wait for rate limit reset', 'Consider upgrading API plan'];
    default:
      return base;
  }
}

function categorizeError(status: number): string {
  if (status === 401) return 'authentication_error';
  if (status === 403) return 'permission_error';
  if (status === 404) return 'endpoint_not_found';
  if (status === 429) return 'rate_limit_error';
  if (status >= 500) return 'server_error';
  return 'api_error';
}

function sanitizeResponse(responseData: any): any {
  if (typeof responseData === 'string') {
    return responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '');
  }
  
  if (typeof responseData === 'object' && responseData !== null) {
    const keys = Object.keys(responseData).slice(0, 5);
    const preview: any = {};
    keys.forEach(key => {
      preview[key] = responseData[key];
    });
    return preview;
  }
  
  return responseData;
}

console.log('✅ FIXED: Enhanced test-credential function loaded with frontend testConfig support');
