
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformMethod {
  endpoint: string;
  http_method: string;
  required_params: string[];
  optional_params: string[];
  example_request: any;
}

interface PlatformAPIConfig {
  base_url: string;
  auth_type: string;
  auth_header_format: string;
  methods: Record<string, PlatformMethod>;
}

interface PlatformConfig {
  name: string;
  api_config: PlatformAPIConfig;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

// Store credential testing insights
const storeCredentialInsights = async (platformName: string, testStatus: string, errorDetails: any, supabase: any): Promise<void> => {
  try {
    const insights = {
      category: 'credential_knowledge',
      title: `${platformName} Credential ${testStatus === 'success' ? 'Success' : 'Failure'} Pattern`,
      summary: `${testStatus === 'success' ? 'Working' : 'Failed'} credential configuration for ${platformName}`,
      details: {
        platform: platformName,
        test_result: testStatus,
        error_details: errorDetails,
        timestamp: new Date().toISOString(),
        success_indicators: testStatus === 'success' ? ['valid_format', 'proper_permissions', 'active_token'] : [],
        failure_indicators: testStatus === 'failed' ? [errorDetails.status_code, errorDetails.error_type] : []
      },
      tags: [platformName.toLowerCase(), 'credential_test', testStatus, 'authentication'],
      priority: testStatus === 'failed' ? 8 : 6,
      source_type: 'credential_test'
    };

    await supabase
      .from('universal_knowledge_store')
      .insert(insights);

    console.log(`Stored credential insight for ${platformName}: ${testStatus}`);
  } catch (error) {
    console.error('Failed to store credential insights:', error);
  }
};

// Dynamic Platform API Configuration Builder (same as execute-automation)
const buildDynamicPlatformConfig = (
  platformName: string,
  platformsConfig: PlatformConfig[],
  credentials: Record<string, string>
): any => {
  console.log(`Building dynamic config for platform: ${platformName}`);
  
  const platformConfig = platformsConfig?.find(
    (config) => config.name.toLowerCase() === platformName.toLowerCase()
  );

  if (!platformConfig) {
    console.warn(`No dynamic config found for platform: ${platformName}, using fallback`);
    return buildFallbackConfig(platformName, credentials);
  }

  const { api_config } = platformConfig;
  
  const config: any = {
    baseURL: api_config.base_url,
    headers: buildDynamicHeaders(api_config, credentials),
    timeout: 10000, // Shorter timeout for tests
  };

  // Add authentication based on auth_type
  switch (api_config.auth_type.toLowerCase()) {
    case 'bearer_token':
    case 'bearer':
      const tokenField = platformConfig.credentials.find(c => 
        c.field.includes('token') || c.field.includes('api_key')
      )?.field;
      if (tokenField && credentials[tokenField]) {
        config.headers['Authorization'] = api_config.auth_header_format.replace('{token}', credentials[tokenField]);
      }
      break;
      
    case 'api_key':
      const apiKeyField = platformConfig.credentials.find(c => 
        c.field.includes('api_key') || c.field.includes('key')
      )?.field;
      if (apiKeyField && credentials[apiKeyField]) {
        if (api_config.auth_header_format.includes('Authorization')) {
          config.headers['Authorization'] = api_config.auth_header_format.replace('{token}', credentials[apiKeyField]);
        } else {
          config.headers['X-API-Key'] = credentials[apiKeyField];
        }
      }
      break;
      
    case 'oauth':
    case 'oauth2':
      const accessToken = credentials['access_token'] || credentials['token'];
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      break;
      
    case 'basic_auth':
      const username = credentials['username'];
      const password = credentials['password'];
      if (username && password) {
        const basicAuth = btoa(`${username}:${password}`);
        config.headers['Authorization'] = `Basic ${basicAuth}`;
      }
      break;
      
    default:
      console.log(`Using custom auth for ${platformName}`);
      Object.keys(credentials).forEach(credKey => {
        if (api_config.auth_header_format.includes(`{${credKey}}`)) {
          const headerValue = api_config.auth_header_format.replace(`{${credKey}}`, credentials[credKey]);
          if (headerValue.includes('Authorization:')) {
            config.headers['Authorization'] = headerValue.split('Authorization:')[1].trim();
          }
        }
      });
  }

  return config;
};

const buildDynamicHeaders = (apiConfig: PlatformAPIConfig, credentials: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Automation/1.0',
  };

  if (apiConfig.base_url.includes('slack.com')) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  } else if (apiConfig.base_url.includes('googleapis.com')) {
    headers['Accept'] = 'application/json';
  }

  return headers;
};

const buildFallbackConfig = (platformName: string, credentials: Record<string, string>): any => {
  const config: any = {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Automation/1.0',
    },
  };

  const lowerPlatform = platformName.toLowerCase();
  
  if (lowerPlatform.includes('slack')) {
    config.baseURL = 'https://slack.com/api';
    if (credentials.bot_token) {
      config.headers['Authorization'] = `Bearer ${credentials.bot_token}`;
    }
  } else if (lowerPlatform.includes('gmail') || lowerPlatform.includes('google')) {
    config.baseURL = 'https://www.googleapis.com/gmail/v1';
    if (credentials.access_token) {
      config.headers['Authorization'] = `Bearer ${credentials.access_token}`;
    }
  } else if (lowerPlatform.includes('trello')) {
    config.baseURL = 'https://api.trello.com/1';
  } else if (lowerPlatform.includes('openai')) {
    config.baseURL = 'https://api.openai.com/v1';
    if (credentials.api_key) {
      config.headers['Authorization'] = `Bearer ${credentials.api_key}`;
    }
  } else {
    config.baseURL = `https://api.${lowerPlatform}.com`;
    if (credentials.api_key) {
      config.headers['Authorization'] = `Bearer ${credentials.api_key}`;
    } else if (credentials.token) {
      config.headers['Authorization'] = `Bearer ${credentials.token}`;
    }
  }

  return config;
};

// Get dynamic test endpoint for a platform
const getDynamicTestEndpoint = (
  platformName: string,
  platformsConfig: PlatformConfig[]
): { endpoint: string; method: string } => {
  const platformConfig = platformsConfig?.find(
    (config) => config.name.toLowerCase() === platformName.toLowerCase()
  );

  if (platformConfig && platformConfig.api_config.methods) {
    // Find a suitable test method (prefer GET methods for testing)
    const methods = Object.entries(platformConfig.api_config.methods);
    
    // Look for common test endpoints
    const testMethod = methods.find(([name, config]) => 
      name.includes('test') || 
      name.includes('me') || 
      name.includes('user') ||
      name.includes('info') ||
      config.http_method === 'GET'
    );

    if (testMethod) {
      return {
        endpoint: testMethod[1].endpoint,
        method: testMethod[1].http_method
      };
    }

    // Fallback to first available method
    if (methods.length > 0) {
      return {
        endpoint: methods[0][1].endpoint,
        method: methods[0][1].http_method
      };
    }
  }

  // Hardcoded fallbacks for common platforms
  const lowerPlatform = platformName.toLowerCase();
  if (lowerPlatform.includes('slack')) {
    return { endpoint: 'auth.test', method: 'GET' };
  } else if (lowerPlatform.includes('gmail') || lowerPlatform.includes('google')) {
    return { endpoint: 'users/me/profile', method: 'GET' };
  } else if (lowerPlatform.includes('trello')) {
    return { endpoint: 'members/me', method: 'GET' };
  } else if (lowerPlatform.includes('openai')) {
    return { endpoint: 'models', method: 'GET' };
  } else {
    return { endpoint: 'user', method: 'GET' };
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credentialId, userId } = await req.json();

    if (!credentialId || !userId) {
      throw new Error('Credential ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the credential
    const { data: credential, error: credentialError } = await supabase
      .from('platform_credentials')
      .select('*')
      .eq('id', credentialId)
      .eq('user_id', userId)
      .single();

    if (credentialError || !credential) {
      throw new Error(`Credential not found: ${credentialError?.message}`);
    }

    // Get all automations to find platforms_config for this platform
    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('platforms_config')
      .eq('user_id', userId)
      .not('platforms_config', 'is', null);

    let platformsConfig: PlatformConfig[] = [];
    
    if (!automationsError && automations && automations.length > 0) {
      // Merge all platforms_config from user's automations
      for (const automation of automations) {
        if (automation.platforms_config && Array.isArray(automation.platforms_config)) {
          platformsConfig = [...platformsConfig, ...automation.platforms_config];
        }
      }
      
      // Remove duplicates based on platform name
      platformsConfig = platformsConfig.filter((config, index, self) => 
        index === self.findIndex(c => c.name.toLowerCase() === config.name.toLowerCase())
      );
    }

    let parsedCredentials: Record<string, string>;
    try {
      parsedCredentials = typeof credential.credentials === 'string' 
        ? JSON.parse(credential.credentials) 
        : credential.credentials;
    } catch (error) {
      throw new Error(`Invalid credentials format for platform: ${credential.platform_name}`);
    }

    // Build dynamic platform configuration
    const platformConfig = buildDynamicPlatformConfig(
      credential.platform_name, 
      platformsConfig, 
      parsedCredentials
    );

    // Get test endpoint
    const testEndpoint = getDynamicTestEndpoint(credential.platform_name, platformsConfig);

    // Build test URL
    const testUrl = `${platformConfig.baseURL.replace(/\/$/, '')}/${testEndpoint.endpoint.replace(/^\//, '')}`;

    console.log(`Testing credential for ${credential.platform_name} at: ${testUrl}`);

    // Make test request
    const testResponse = await fetch(testUrl, {
      method: testEndpoint.method,
      headers: platformConfig.headers,
      timeout: platformConfig.timeout,
    });

    const testMessage = testResponse.ok 
      ? `✅ Credential test successful for ${credential.platform_name}` 
      : `❌ Credential test failed for ${credential.platform_name}: ${testResponse.status}`;

    const technicalDetails = {
      status_code: testResponse.status,
      headers: Object.fromEntries(testResponse.headers.entries()),
      test_url: testUrl,
      test_method: testEndpoint.method,
      platform_config_source: platformsConfig.find(c => 
        c.name.toLowerCase() === credential.platform_name.toLowerCase()
      ) ? 'dynamic' : 'fallback'
    };

    // Store test result
    const { error: insertError } = await supabase
      .from('credential_test_results')
      .insert({
        platform_credential_id: credentialId,
        test_status: testResponse.ok ? 'success' : 'failed',
        test_message: testMessage,
        technical_details: technicalDetails,
        tested_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to store test result:', insertError);
    }

    // Store credential insights for learning (async, don't await)
    storeCredentialInsights(
      credential.platform_name, 
      testResponse.ok ? 'success' : 'failed', 
      technicalDetails, 
      supabase
    );

    return new Response(JSON.stringify({
      success: testResponse.ok,
      message: testMessage,
      details: technicalDetails
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Credential test failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
