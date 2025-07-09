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

// Normalize field names for API compatibility
const normalizeFieldName = (fieldName: string): string => {
  const normalizations: Record<string, string> = {
    'API Key': 'api_key',
    'api key': 'api_key',
    'apikey': 'api_key',
    'Integration Token': 'integration_token',
    'integration token': 'integration_token',
    'Bot Token': 'bot_token',
    'bot token': 'bot_token',
    'Access Token': 'access_token',
    'access token': 'access_token',
    'Client ID': 'client_id',
    'client id': 'client_id',
    'Client Secret': 'client_secret',
    'client secret': 'client_secret',
    'Database ID': 'database_id',
    'database id': 'database_id',
    'Username': 'username',
    'Password': 'password',
    'Token': 'token'
  };

  return normalizations[fieldName] || fieldName.toLowerCase().replace(/\s+/g, '_');
};

// Normalize credentials object with proper field names
const normalizeCredentials = (credentials: Record<string, string>): Record<string, string> => {
  const normalized: Record<string, string> = {};
  
  Object.entries(credentials).forEach(([key, value]) => {
    const normalizedKey = normalizeFieldName(key);
    normalized[normalizedKey] = value;
    
    // Also keep original key for backward compatibility
    if (normalizedKey !== key) {
      normalized[key] = value;
    }
  });

  console.log('🔄 Normalized credentials:', Object.keys(normalized));
  return normalized;
};

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

    console.log(`📊 Stored credential insight for ${platformName}: ${testStatus}`);
  } catch (error) {
    console.error('❌ Failed to store credential insights:', error);
  }
};

// Enhanced platform-specific authentication header building
const buildAuthHeaders = (platformName: string, credentials: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Automation/1.0',
  };

  const lowerPlatform = platformName.toLowerCase();
  
  console.log(`🔐 Building auth headers for ${platformName} with credentials:`, Object.keys(credentials));

  // Platform-specific authentication
  if (lowerPlatform.includes('typeform')) {
    const token = credentials.api_key || credentials['API Key'] || credentials.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Typeform: Added Bearer token');
    } else {
      console.log('❌ Typeform: No API key found');
    }
  } else if (lowerPlatform.includes('openai')) {
    const apiKey = credentials.api_key || credentials['API Key'];
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log('✅ OpenAI: Added Bearer token');
    } else {
      console.log('❌ OpenAI: No API key found');
    }
  } else if (lowerPlatform.includes('notion')) {
    const token = credentials.integration_token || credentials['Integration Token'];
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['Notion-Version'] = '2022-06-28';
      console.log('✅ Notion: Added Bearer token with version');
    } else {
      console.log('❌ Notion: No integration token found');
    }
  } else if (lowerPlatform.includes('slack')) {
    const token = credentials.bot_token || credentials['Bot Token'] || credentials.token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Slack: Added Bearer token');
    } else {
      console.log('❌ Slack: No bot token found');
    }
  } else if (lowerPlatform.includes('gmail') || lowerPlatform.includes('google')) {
    const token = credentials.access_token || credentials['Access Token'];
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Google: Added Bearer token');
    } else {
      console.log('❌ Google: No access token found');
    }
  } else if (lowerPlatform.includes('trello')) {
    const apiKey = credentials.api_key || credentials['API Key'];
    const token = credentials.token || credentials['Token'];
    if (apiKey && token) {
      // Trello uses query parameters, but we'll add them as headers for now
      headers['Authorization'] = `OAuth oauth_consumer_key="${apiKey}", oauth_token="${token}"`;
      console.log('✅ Trello: Added OAuth headers');
    } else {
      console.log('❌ Trello: Missing API key or token');
    }
  } else {
    // Generic fallback
    const apiKey = credentials.api_key || credentials['API Key'] || credentials.token;
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      console.log(`✅ ${platformName}: Added generic Bearer token`);
    } else {
      console.log(`❌ ${platformName}: No API key found for generic auth`);
    }
  }

  return headers;
};

// Get platform-specific test endpoint
const getTestEndpoint = (platformName: string): { endpoint: string; method: string; baseURL: string } => {
  const lowerPlatform = platformName.toLowerCase();
  
  if (lowerPlatform.includes('typeform')) {
    return { 
      endpoint: 'me', 
      method: 'GET', 
      baseURL: 'https://api.typeform.com' 
    };
  } else if (lowerPlatform.includes('openai')) {
    return { 
      endpoint: 'models', 
      method: 'GET', 
      baseURL: 'https://api.openai.com/v1' 
    };
  } else if (lowerPlatform.includes('notion')) {
    return { 
      endpoint: 'users/me', 
      method: 'GET', 
      baseURL: 'https://api.notion.com/v1' 
    };
  } else if (lowerPlatform.includes('slack')) {
    return { 
      endpoint: 'auth.test', 
      method: 'GET', 
      baseURL: 'https://slack.com/api' 
    };
  } else if (lowerPlatform.includes('gmail') || lowerPlatform.includes('google')) {
    return { 
      endpoint: 'users/me/profile', 
      method: 'GET', 
      baseURL: 'https://www.googleapis.com/gmail/v1' 
    };
  } else if (lowerPlatform.includes('trello')) {
    return { 
      endpoint: 'members/me', 
      method: 'GET', 
      baseURL: 'https://api.trello.com/1' 
    };
  } else {
    return { 
      endpoint: 'user', 
      method: 'GET', 
      baseURL: `https://api.${lowerPlatform}.com` 
    };
  }
};

// Dynamic Platform API Configuration Builder
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
    const requestBody = await req.json();
    console.log('🔧 Test credential request:', JSON.stringify(requestBody, null, 2));
    
    // Handle AI Agent testing
    if (requestBody.type === 'agent' && requestBody.agent_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch the agent details
      const { data: agent, error: agentError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', requestBody.agent_id)
        .single();

      if (agentError || !agent) {
        throw new Error(`Agent not found: ${agentError?.message}`);
      }

      // Test the AI agent by making a simple API call
      const testMessage = "Hello, please respond with 'Test successful' to confirm you're working.";
      
      let testUrl = '';
      let testHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      let testBody: any = {};

      // Configure test based on LLM provider
      switch (agent.llm_provider.toLowerCase()) {
        case 'openai':
          testUrl = 'https://api.openai.com/v1/chat/completions';
          testHeaders['Authorization'] = `Bearer ${agent.api_key}`;
          testBody = {
            model: agent.model,
            messages: [
              { role: 'system', content: agent.agent_role },
              { role: 'user', content: testMessage }
            ],
            max_tokens: 50
          };
          break;
          
        default:
          throw new Error(`Testing for ${agent.llm_provider} is not implemented yet`);
      }

      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: testHeaders,
        body: JSON.stringify(testBody),
      });

      const testResult = await testResponse.json();
      
      if (testResponse.ok) {
        return new Response(JSON.stringify({
          success: true,
          user_message: `✅ AI Agent "${agent.agent_name}" test successful with ${agent.llm_provider}/${agent.model}`,
          technical_details: {
            status_code: testResponse.status,
            model_response: testResult.choices?.[0]?.message?.content || 'Response received',
            provider: agent.llm_provider,
            model: agent.model
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          user_message: `❌ AI Agent "${agent.agent_name}" test failed: ${testResult.error?.message || 'Unknown error'}`,
          technical_details: {
            status_code: testResponse.status,
            error: testResult.error,
            provider: agent.llm_provider,
            model: agent.model
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle platform credential testing - ENHANCED MODE
    if (requestBody.type === 'platform') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { platform_name, credential_fields, user_id } = requestBody;

      if (!platform_name || !credential_fields) {
        throw new Error('Platform name and credential fields are required for platform testing');
      }

      console.log(`🧪 Testing raw credentials for platform: ${platform_name}`);
      console.log(`📝 Original credentials:`, Object.keys(credential_fields));

      // Normalize credentials for API compatibility
      const normalizedCredentials = normalizeCredentials(credential_fields);
      
      // Build authentication headers
      const authHeaders = buildAuthHeaders(platform_name, normalizedCredentials);
      
      // Get test endpoint
      const testConfig = getTestEndpoint(platform_name);
      
      // Build test URL
      const testUrl = `${testConfig.baseURL}/${testConfig.endpoint.replace(/^\//, '')}`;

      console.log(`🔗 Testing credential for ${platform_name} at: ${testUrl}`);
      console.log(`📋 Test method: ${testConfig.method}`);
      console.log(`🔑 Auth headers set:`, Object.keys(authHeaders).filter(k => k.includes('Auth')));

      // Make test request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const testResponse = await fetch(testUrl, {
          method: testConfig.method,
          headers: authHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        let responseText = '';
        try {
          responseText = await testResponse.text();
        } catch (error) {
          console.error('Failed to read response text:', error);
        }

        const technicalDetails = {
          status_code: testResponse.status,
          response_preview: responseText.substring(0, 300),
          test_url: testUrl,
          test_method: testConfig.method,
          platform_name: platform_name,
          credential_fields_sent: Object.keys(credential_fields),
          normalized_fields: Object.keys(normalizedCredentials),
          auth_headers_used: Object.keys(authHeaders).filter(k => k.includes('Auth')),
          timestamp: new Date().toISOString()
        };

        let userMessage = '';
        let errorType = 'unknown';

        if (testResponse.ok) {
          userMessage = `✅ ${platform_name} credentials are working correctly!`;
          console.log(`✅ Credential test successful for ${platform_name}`);
        } else {
          // Enhanced error categorization
          switch (testResponse.status) {
            case 401:
              errorType = 'authentication';
              userMessage = `❌ Authentication failed for ${platform_name}. Please check your API key/token is correct and has proper permissions.`;
              break;
            case 403:
              errorType = 'permission';
              userMessage = `❌ Permission denied for ${platform_name}. Your credentials may not have the required permissions.`;
              break;
            case 404:
              errorType = 'endpoint';
              userMessage = `❌ API endpoint not found for ${platform_name}. This might be a configuration issue.`;
              break;
            case 429:
              errorType = 'rate_limit';
              userMessage = `❌ Rate limit exceeded for ${platform_name}. Please try again later.`;
              break;
            case 500:
              errorType = 'server_error';
              userMessage = `❌ ${platform_name} server error. Please try again later.`;
              break;
            default:
              errorType = 'unknown';
              userMessage = `❌ Credential test failed for ${platform_name}: HTTP ${testResponse.status}`;
          }
          
          console.log(`❌ Credential test failed for ${platform_name}: ${testResponse.status}`);
        }

        // Store credential insights for learning (async, don't await)
        storeCredentialInsights(
          platform_name, 
          testResponse.ok ? 'success' : 'failed', 
          { ...technicalDetails, error_type: errorType }, 
          supabase
        );

        return new Response(JSON.stringify({
          success: testResponse.ok,
          user_message: userMessage,
          technical_details: { ...technicalDetails, error_type: errorType }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        let errorType = 'network';
        let userMessage = '';
        
        if (fetchError.name === 'AbortError') {
          errorType = 'timeout';
          userMessage = `❌ Request timeout for ${platform_name}. The platform may be slow to respond.`;
        } else {
          errorType = 'network';
          userMessage = `❌ Network error testing ${platform_name}. Please check your internet connection.`;
        }

        console.error(`❌ Network error testing ${platform_name}:`, fetchError.message);

        return new Response(JSON.stringify({
          success: false,
          user_message: userMessage,
          technical_details: {
            error_type: errorType,
            error_message: fetchError.message,
            platform_name: platform_name,
            test_url: testUrl,
            timestamp: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Legacy support for old credential testing format
    const { credentialId, userId } = requestBody;

    if (!credentialId || !userId) {
      throw new Error('Either use new format (type: platform, platform_name, credential_fields) or legacy format (credentialId, userId)');
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
    console.error('🚨 Test failed with error:', error);
    
    // Determine error type for better user messaging
    let userMessage = `❌ Test failed: ${error.message}`;
    let errorType = 'unknown';
    
    if (error.message.includes('fetch')) {
      errorType = 'network';
      userMessage = `❌ Network error: Unable to connect to the platform. Please check your internet connection and try again.`;
    } else if (error.message.includes('timeout')) {
      errorType = 'timeout';
      userMessage = `❌ Request timeout: The platform took too long to respond. Please try again.`;
    } else if (error.message.includes('credential')) {
      errorType = 'credential';
      userMessage = `❌ Credential error: ${error.message}`;
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      errorType = 'not_found';
      userMessage = `❌ Platform endpoint not found. This might be a configuration issue.`;
    }

    return new Response(JSON.stringify({
      success: false,
      user_message: userMessage,
      technical_details: { 
        error: error.message,
        error_type: errorType,
        timestamp: new Date().toISOString(),
        stack: error.stack
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
