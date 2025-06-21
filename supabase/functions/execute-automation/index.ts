
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

// Store automation execution insights
const storeExecutionInsights = async (automationId: string, executionLog: any[], status: string, supabase: any): Promise<void> => {
  try {
    // Analyze execution patterns
    const failedSteps = executionLog.filter(log => log.status === 'error');
    const successfulSteps = executionLog.filter(log => log.status === 'success');
    
    if (failedSteps.length > 0) {
      // Store error patterns
      for (const failedStep of failedSteps) {
        const errorInsight = {
          category: 'error_solutions',
          title: `Automation Step Failure: ${failedStep.step_name}`,
          summary: `Common failure pattern in ${failedStep.step_name} step`,
          details: {
            step_type: failedStep.step_id,
            error_message: failedStep.error,
            automation_context: automationId,
            failure_frequency: 1,
            common_causes: [failedStep.error],
            suggested_solutions: ['Check credentials', 'Verify API permissions', 'Review endpoint configuration']
          },
          tags: ['automation_error', 'step_failure', failedStep.step_name.toLowerCase().replace(/\s+/g, '_')],
          priority: 7,
          source_type: 'automation_execution'
        };

        await supabase
          .from('universal_knowledge_store')
          .insert(errorInsight);
      }
    }

    if (successfulSteps.length > 0 && status === 'completed') {
      // Store successful patterns
      const successInsight = {
        category: 'automation_patterns',
        title: `Successful Automation Pattern: ${successfulSteps.length} Steps`,
        summary: `Working automation pattern with ${successfulSteps.length} successful steps`,
        details: {
          step_sequence: successfulSteps.map(s => s.step_name),
          execution_time: executionLog[executionLog.length - 1]?.timestamp,
          success_rate: (successfulSteps.length / executionLog.length) * 100,
          automation_id: automationId
        },
        tags: ['success_pattern', 'automation_completed', `${successfulSteps.length}_steps`],
        priority: 6,
        source_type: 'automation_execution'
      };

      await supabase
        .from('universal_knowledge_store')
        .insert(successInsight);
    }

    console.log(`Stored execution insights for automation ${automationId}`);
  } catch (error) {
    console.error('Failed to store execution insights:', error);
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
    timeout: 30000,
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
    timeout: 30000,
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

const getDynamicMethodConfig = (
  platformName: string,
  methodName: string,
  platformsConfig: PlatformConfig[]
): PlatformMethod | null => {
  const platformConfig = platformsConfig?.find(
    (config) => config.name.toLowerCase() === platformName.toLowerCase()
  );

  if (!platformConfig) {
    return null;
  }

  return platformConfig.api_config.methods[methodName] || null;
};

const buildDynamicURL = (
  baseURL: string,
  endpoint: string,
  parameters: Record<string, any>,
  requiredParams: string[]
): string => {
  let url = `${baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  Object.keys(parameters).forEach(key => {
    url = url.replace(`{${key}}`, encodeURIComponent(parameters[key]));
  });

  const queryParams = new URLSearchParams();
  Object.keys(parameters).forEach(key => {
    if (!url.includes(`{${key}}`) && !requiredParams.includes(key)) {
      queryParams.append(key, parameters[key]);
    }
  });

  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { automationId, userId, triggerData = {} } = await req.json();

    if (!automationId || !userId) {
      throw new Error('Automation ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Executing automation ${automationId} for user ${userId}`);

    // Fetch automation with platforms_config
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*, platforms_config')
      .eq('id', automationId)
      .eq('user_id', userId)
      .single();

    if (automationError || !automation) {
      throw new Error(`Automation not found: ${automationError?.message}`);
    }

    if (!automation.automation_blueprint) {
      throw new Error('Automation blueprint not found');
    }

    // Get platform credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('platform_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (credentialsError) {
      throw new Error(`Failed to fetch credentials: ${credentialsError.message}`);
    }

    // Create automation run record
    const { data: runRecord, error: runError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: automationId,
        user_id: userId,
        status: 'running',
        trigger_data: triggerData,
        run_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (runError) {
      throw new Error(`Failed to create run record: ${runError.message}`);
    }

    const startTime = Date.now();
    const executionLog: any[] = [];
    const variables: Record<string, any> = { ...automation.automation_blueprint.variables };

    try {
      // Execute automation steps
      const steps = automation.automation_blueprint.steps || [];
      
      for (const step of steps) {
        console.log(`Executing step: ${step.name}`);
        const stepLog = { step_id: step.id, step_name: step.name, timestamp: new Date().toISOString() };

        try {
          if (step.type === 'action' && step.action) {
            const result = await executeAction(
              step.action,
              credentials,
              variables,
              automation.platforms_config // Pass the stored platforms config
            );
            stepLog.status = 'success';
            stepLog.result = result;
            
            // Store result in variables if output_variable is specified
            if (step.output_variable) {
              variables[step.output_variable] = result;
            }
          } else if (step.type === 'ai_agent_call' && step.ai_agent_call) {
            const result = await executeAIAgentCall(step.ai_agent_call, variables, supabase);
            stepLog.status = 'success';
            stepLog.result = result;
            
            if (step.ai_agent_call.output_variable) {
              variables[step.ai_agent_call.output_variable] = result;
            }
          } else {
            stepLog.status = 'skipped';
            stepLog.message = 'Unknown step type or missing configuration';
          }
        } catch (error) {
          stepLog.status = 'error';
          stepLog.error = error.message;
          console.error(`Step ${step.name} failed:`, error);
        }

        executionLog.push(stepLog);
      }

      // Update run record with success
      const duration = Date.now() - startTime;
      const finalStatus = executionLog.some(log => log.status === 'error') ? 'failed' : 'completed';
      
      await supabase
        .from('automation_runs')
        .update({
          status: finalStatus,
          duration_ms: duration,
          details_log: executionLog
        })
        .eq('id', runRecord.id);

      // Store execution insights for learning (async, don't await)
      storeExecutionInsights(automationId, executionLog, finalStatus, supabase);

      return new Response(JSON.stringify({
        success: true,
        runId: runRecord.id,
        duration: duration,
        executionLog: executionLog
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Update run record with failure
      const duration = Date.now() - startTime;
      await supabase
        .from('automation_runs')
        .update({
          status: 'failed',
          duration_ms: duration,
          details_log: [...executionLog, { error: error.message, timestamp: new Date().toISOString() }]
        })
        .eq('id', runRecord.id);

      // Store execution insights for learning (async, don't await)
      storeExecutionInsights(automationId, executionLog, 'failed', supabase);

      throw error;
    }

  } catch (error) {
    console.error('Automation execution failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeAction(
  action: any,
  credentials: any[],
  variables: Record<string, any>,
  platformsConfig: PlatformConfig[]
) {
  const { integration, method, parameters, platform_credential_id } = action;

  // Find platform credentials
  const platformCreds = credentials.find(cred => 
    cred.platform_name.toLowerCase() === integration.toLowerCase() ||
    cred.id === platform_credential_id
  );

  if (!platformCreds) {
    throw new Error(`No credentials found for platform: ${integration}`);
  }

  let parsedCredentials: Record<string, string>;
  try {
    parsedCredentials = typeof platformCreds.credentials === 'string' 
      ? JSON.parse(platformCreds.credentials) 
      : platformCreds.credentials;
  } catch (error) {
    throw new Error(`Invalid credentials format for platform: ${integration}`);
  }

  // Build dynamic platform configuration
  const platformConfig = buildDynamicPlatformConfig(integration, platformsConfig, parsedCredentials);
  
  // Get method configuration
  const methodConfig = getDynamicMethodConfig(integration, method, platformsConfig);
  
  // Replace variables in parameters
  const processedParameters = replaceVariables(parameters, variables);

  // Build URL
  let url: string;
  if (methodConfig) {
    url = buildDynamicURL(
      platformConfig.baseURL,
      methodConfig.endpoint,
      processedParameters,
      methodConfig.required_params
    );
  } else {
    // Fallback URL construction
    url = `${platformConfig.baseURL}/${method}`;
  }

  // Determine HTTP method
  const httpMethod = methodConfig?.http_method || 'POST';

  // Make API request
  const requestOptions: any = {
    method: httpMethod,
    headers: platformConfig.headers,
    timeout: platformConfig.timeout || 30000,
  };

  if (httpMethod !== 'GET' && Object.keys(processedParameters).length > 0) {
    requestOptions.body = JSON.stringify(processedParameters);
  }

  console.log(`Making ${httpMethod} request to: ${url}`);
  console.log('Request options:', requestOptions);

  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const responseData = await response.json();
  console.log('API response:', responseData);
  
  return responseData;
}

async function executeAIAgentCall(aiAgentCall: any, variables: Record<string, any>, supabase: any) {
  const { agent_id, input_prompt } = aiAgentCall;

  // Get AI agent configuration
  const { data: agent, error: agentError } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', agent_id)
    .single();

  if (agentError || !agent) {
    throw new Error(`AI agent not found: ${agentError?.message}`);
  }

  // Replace variables in input prompt
  const processedPrompt = replaceVariables(input_prompt, variables);

  // Make request to chat-ai function
  const chatResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/chat-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({
      message: processedPrompt,
      agentConfig: {
        role: agent.agent_role,
        goal: agent.agent_goal,
        rules: agent.agent_rules,
        memory: agent.agent_memory
      },
      llmProvider: agent.llm_provider || 'OpenAI',
      model: agent.model || 'gpt-4o-mini',
      apiKey: agent.api_key
    }),
  });

  if (!chatResponse.ok) {
    throw new Error(`AI agent call failed: ${chatResponse.status}`);
  }

  const result = await chatResponse.json();
  return result.response;
}

function replaceVariables(obj: any, variables: Record<string, any>): any {
  if (typeof obj === 'string') {
    return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  } else if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, variables));
  } else if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = replaceVariables(value, variables);
    }
    return result;
  }
  return obj;
}
