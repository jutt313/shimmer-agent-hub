import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AI-POWERED EXECUTION INTEGRATOR
class AIExecutionIntegrator {
  private supabase: any;
  private configCache = new Map<string, any>();

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  // Get AI-generated platform configuration for execution
  async getAIExecutionConfig(platformName: string): Promise<any> {
    console.log(`🤖 Getting AI execution config for ${platformName}`);

    // Check cache first
    const cached = this.configCache.get(platformName.toLowerCase());
    if (cached) {
      console.log(`⚡ Using cached execution config for ${platformName}`);
      return cached;
    }

    try {
      const { data, error } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate complete execution configuration for ${platformName} platform including: API endpoints, methods, parameters, authentication, error handling, and execution flow patterns. Focus on automation execution requirements.`,
          messages: [],
          requestType: 'execution_config_generation'
        }
      });

      if (error) {
        console.error('❌ Failed to get AI execution config:', error);
        return null;
      }

      const aiConfig = data?.api_configurations?.[platformName.toLowerCase()] || 
                      data?.api_configurations?.[0];

      if (aiConfig) {
        this.configCache.set(platformName.toLowerCase(), aiConfig);
        console.log(`✅ Got AI execution config for ${platformName}`);
        return aiConfig;
      }

      return null;
    } catch (error) {
      console.error(`💥 Error getting AI execution config for ${platformName}:`, error);
      return null;
    }
  }

  // AI-powered API call execution
  async callPlatformAPI(
    platformName: string, 
    endpointName: string, 
    parameters: Record<string, any>, 
    credentials: Record<string, string>
  ): Promise<any> {
    console.log(`🚀 AI-POWERED EXECUTION: ${platformName}.${endpointName}`);

    // Get AI-generated execution configuration
    const aiConfig = await this.getAIExecutionConfig(platformName);
    
    if (!aiConfig) {
      console.log(`⚠️ No AI config for ${platformName}, using intelligent fallback`);
      return await this.intelligentFallbackExecution(platformName, endpointName, parameters, credentials);
    }

    const baseUrl = aiConfig.base_url || this.inferBaseUrl(platformName);
    const endpoint = aiConfig.endpoints?.[endpointName] || this.createDefaultEndpoint(endpointName);
    
    // Build request URL
    let url = baseUrl + endpoint.path;
    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    // Build headers with AI-generated authentication
    const headers = await this.buildAIHeaders(aiConfig, credentials);

    // Build request options
    const requestOptions: RequestInit = {
      method: endpoint.method,
      headers,
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      requestOptions.body = JSON.stringify(parameters);
    } else if (endpoint.method === 'GET') {
      // Add query parameters for GET requests
      const queryParams = new URLSearchParams();
      Object.entries(parameters).forEach(([key, value]) => {
        if (!url.includes(`{${key}}`)) {
          queryParams.append(key, String(value));
        }
      });
      if (queryParams.toString()) {
        url += '?' + queryParams.toString();
      }
    }

    console.log(`📡 Making AI-powered ${endpoint.method} request to: ${url}`);

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI-powered API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ AI-powered execution successful for ${platformName}.${endpointName}`);
      
      return result;
    } catch (error) {
      console.error(`❌ AI-powered execution failed:`, error);
      throw error;
    }
  }

  private async intelligentFallbackExecution(
    platformName: string, 
    endpointName: string, 
    parameters: Record<string, any>, 
    credentials: Record<string, string>
  ): Promise<any> {
    console.log(`🔧 Intelligent fallback execution for ${platformName}.${endpointName}`);
    
    const baseUrl = this.inferBaseUrl(platformName);
    const url = `${baseUrl}/api/v1/${endpointName}`;
    
    const headers = this.buildFallbackHeaders(credentials);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(parameters)
      });

      if (!response.ok) {
        throw new Error(`Fallback execution failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Fallback execution failed:`, error);
      throw error;
    }
  }

  private async buildAIHeaders(aiConfig: any, credentials: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-AI-Execution/4.0'
    };

    const authConfig = aiConfig.auth_config || aiConfig.authentication || {};
    
    switch (authConfig.type?.toLowerCase()) {
      case 'bearer':
        const token = credentials.access_token || credentials.token || credentials.api_key;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        break;
        
      case 'oauth2':
        const accessToken = credentials.access_token;
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        break;
    }

    return headers;
  }

  private buildFallbackHeaders(credentials: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Fallback-Execution/1.0'
    };

    if (credentials.access_token) {
      headers['Authorization'] = `Bearer ${credentials.access_token}`;
    } else if (credentials.api_key) {
      headers['Authorization'] = `Bearer ${credentials.api_key}`;
      headers['X-API-Key'] = credentials.api_key;
    }

    return headers;
  }

  private inferBaseUrl(platformName: string): string {
    return `https://api.${platformName.toLowerCase()}.com`;
  }

  private createDefaultEndpoint(endpointName: string): any {
    return {
      method: 'POST',
      path: `/api/v1/${endpointName}`,
      required_params: [],
      optional_params: []
    };
  }
}

// AI-POWERED AUTOMATION EXECUTOR
class AIAutomationExecutor {
  private context: any;
  private blueprint: any;
  private automationCredentials: Record<string, Record<string, string>> = {};
  private supabaseClient: any;
  private aiExecutionIntegrator: AIExecutionIntegrator;

  constructor(blueprint: any, runId: string, userId: string, automationId: string, supabaseClient: any) {
    this.blueprint = blueprint;
    this.supabaseClient = supabaseClient;
    this.context = {
      variables: blueprint.variables || {},
      runId,
      userId,
      automationId,
      stepIndex: 0,
      logs: []
    };
    
    this.aiExecutionIntegrator = new AIExecutionIntegrator(supabaseClient);
    console.log('🤖 AI Automation Executor using AI-powered platform integration');
  }

  async execute(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      console.log('🚀 Starting AI-powered automation execution:', this.blueprint.description);
      
      await this.loadAutomationCredentials();
      
      for (let i = 0; i < this.blueprint.steps.length; i++) {
        this.context.stepIndex = i;
        const step = this.blueprint.steps[i];
        
        console.log(`📍 Executing step ${i + 1}: ${step.name} (${step.type})`);
        
        try {
          await this.executeStep(step);
          await this.updateRunProgress();
        } catch (error: any) {
          console.error(`❌ Step ${i + 1} failed:`, error);
          
          if (step.on_error === 'continue') {
            this.logStep(step.id, 'failed', `Step failed but continuing: ${error.message}`, error.message);
            continue;
          } else if (step.on_error === 'retry') {
            try {
              console.log(`🔄 Retrying step ${i + 1}`);
              await this.executeStep(step);
              await this.updateRunProgress();
            } catch (retryError: any) {
              this.logStep(step.id, 'failed', `Step failed after retry: ${retryError.message}`, retryError.message);
              if (step.on_error !== 'continue') {
                throw retryError;
              }
            }
          } else {
            this.logStep(step.id, 'failed', `Step failed: ${error.message}`, error.message);
            throw error;
          }
        }
      }
      
      console.log('✅ AI-powered automation execution completed successfully');
      return { success: true, result: this.context.variables };
      
    } catch (error: any) {
      console.error('💥 AI-powered automation execution failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async loadAutomationCredentials(): Promise<void> {
    console.log('🔑 Loading automation credentials...');
    
    const { data: credentials, error } = await this.supabaseClient
      .from('automation_platform_credentials')
      .select('*')
      .eq('automation_id', this.context.automationId)
      .eq('user_id', this.context.userId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to load automation credentials:', error);
      return;
    }

    credentials?.forEach((cred: any) => {
      try {
        const decryptedCreds = JSON.parse(cred.credentials);
        this.automationCredentials[cred.platform_name.toLowerCase()] = decryptedCreds;
        console.log(`✅ Loaded credentials for: ${cred.platform_name}`);
      } catch (e) {
        console.error(`Failed to parse credentials for ${cred.platform_name}:`, e);
      }
    });

    console.log('🔑 Loaded credentials for platforms:', Object.keys(this.automationCredentials));
  }

  private async executeStep(step: any): Promise<void> {
    this.logStep(step.id, 'running', `Starting step: ${step.name}`);

    switch (step.type) {
      case 'action':
        await this.executeAIUniversalAction(step);
        break;
      case 'condition':
        await this.executeCondition(step);
        break;
      case 'loop':
        await this.executeLoop(step);
        break;
      case 'delay':
        await this.executeDelay(step);
        break;
      case 'ai_agent_call':
        await this.executeAIAgentCall(step);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }

    this.logStep(step.id, 'completed', `Completed step: ${step.name}`);
  }

  // 100% AI-POWERED EXECUTION
  private async executeAIUniversalAction(step: any): Promise<void> {
    const { action } = step;
    if (!action) throw new Error('Action configuration missing');

    const platformName = action.integration.toLowerCase();
    const method = action.method;
    const parameters = this.resolveVariables(action.parameters);

    console.log(`🤖 AI-POWERED EXECUTION: ${platformName}.${method}`, parameters);

    const platformCreds = this.automationCredentials[platformName];
    if (!platformCreds) {
      throw new Error(`No credentials found for platform: ${platformName}`);
    }

    console.log(`🔐 Using credentials for ${platformName} with AI-powered execution`);

    try {
      // 100% ROUTING THROUGH AI-POWERED INTEGRATOR
      const result = await this.aiExecutionIntegrator.callPlatformAPI(
        platformName,
        method,
        parameters,
        platformCreds
      );

      console.log(`✅ AI-POWERED EXECUTION SUCCESS for ${platformName}.${method}:`, result);

      if (action.output_variable) {
        this.context.variables[action.output_variable] = result;
      }

    } catch (error: any) {
      console.error(`❌ AI-POWERED EXECUTION FAILED for ${platformName}.${method}:`, error);
      throw error;
    }
  }

  private async executeCondition(step: any): Promise<void> {
    const { condition } = step;
    if (!condition) throw new Error('Condition configuration missing');

    const result = this.evaluateExpression(condition.expression);
    console.log(`🔍 Condition evaluation result: ${result}`);

    if (result && condition.if_true) {
      for (const subStep of condition.if_true) {
        await this.executeStep(subStep);
      }
    } else if (!result && condition.if_false) {
      for (const subStep of condition.if_false) {
        await this.executeStep(subStep);
      }
    }
  }

  private async executeLoop(step: any): Promise<void> {
    const { loop } = step;
    if (!loop) throw new Error('Loop configuration missing');

    const arrayData = this.resolveVariables(loop.array_source);
    if (!Array.isArray(arrayData)) {
      throw new Error('Loop array source is not an array');
    }

    console.log(`🔄 Starting loop with ${arrayData.length} iterations`);

    for (let i = 0; i < arrayData.length; i++) {
      this.context.variables['loop_item'] = arrayData[i];
      this.context.variables['loop_index'] = i;

      for (const subStep of loop.steps) {
        await this.executeStep(subStep);
      }
    }
  }

  private async executeDelay(step: any): Promise<void> {
    const { delay } = step;
    if (!delay) throw new Error('Delay configuration missing');

    const seconds = delay.duration_seconds;
    console.log(`⏱️ Delaying for ${seconds} seconds`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  private async executeAIAgentCall(step: any): Promise<void> {
    const { ai_agent_call } = step;
    if (!ai_agent_call) throw new Error('AI agent call configuration missing');

    const agentId = ai_agent_call.agent_id;
    const inputPrompt = this.resolveVariables(ai_agent_call.input_prompt);

    console.log(`🤖 Calling AI agent: ${agentId}`);

    const { data: agent, error } = await this.supabaseClient
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      throw new Error(`AI agent not found: ${agentId}`);
    }

    const aiResponse = await this.callAIProvider(agent, inputPrompt);
    
    if (ai_agent_call.output_variable) {
      this.context.variables[ai_agent_call.output_variable] = aiResponse;
    }
  }

  private async callAIProvider(agent: any, prompt: string): Promise<string> {
    const provider = agent.llm_provider || 'openai';
    const model = agent.model || 'gpt-4o-mini';
    const apiKey = agent.api_key;

    if (!apiKey) {
      throw new Error(`No API key configured for AI agent: ${agent.agent_name}`);
    }

    if (provider.toLowerCase() === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: agent.agent_rules || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API call failed: ${response.status}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || '';
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  private resolveVariables(input: any): any {
    if (typeof input === 'string') {
      return input.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        return this.context.variables[varName.trim()] || match;
      });
    } else if (Array.isArray(input)) {
      return input.map(item => this.resolveVariables(item));
    } else if (typeof input === 'object' && input !== null) {
      const resolved: any = {};
      for (const [key, value] of Object.entries(input)) {
        resolved[key] = this.resolveVariables(value);
      }
      return resolved;
    }
    return input;
  }

  private evaluateExpression(expression: string): boolean {
    try {
      if (!/^[a-zA-Z0-9\s\.\[\]"'<>=!&|()]+$/.test(expression)) {
        throw new Error('Invalid expression format');
      }
      
      let evaluableExpression = expression;
      for (const [varName, varValue] of Object.entries(this.context.variables)) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(varValue));
      }
      
      return new Function(`return ${evaluableExpression}`)();
    } catch (error) {
      console.error('Expression evaluation failed:', error);
      return false;
    }
  }

  private logStep(stepId: string, status: string, message: string, error?: string): void {
    const logEntry = {
      step: stepId,
      status,
      timestamp: new Date().toISOString(),
      message,
      error
    };
    
    this.context.logs.push(logEntry);
    console.log(`📝 Step log:`, logEntry);
  }

  private async updateRunProgress(): Promise<void> {
    const { error } = await this.supabaseClient
      .from('automation_runs')
      .update({
        details_log: {
          started_at: this.context.logs[0]?.timestamp,
          current_step: this.context.stepIndex + 1,
          total_steps: this.blueprint.steps.length,
          steps: this.context.logs,
          variables: this.context.variables,
          ai_powered: true,
          execution_type: 'ai_universal'
        }
      })
      .eq('id', this.context.runId);

    if (error) {
      console.error('Failed to update run progress:', error);
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { automation_id, trigger_data, user_id } = await req.json();

    console.log('🚀 AI-POWERED AUTOMATION EXECUTION started:', { automation_id, user_id });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get automation blueprint
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automation_id)
      .eq('user_id', user_id)
      .single();

    if (automationError || !automation) {
      throw new Error(`Automation not found: ${automation_id}`);
    }

    // Create run record
    const { data: run, error: runError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: automation_id,
        user_id: user_id,
        status: 'running',
        trigger_data: trigger_data
      })
      .select()
      .single();

    if (runError || !run) {
      throw new Error(`Failed to create run record: ${runError?.message}`);
    }

    // Execute automation with AI-POWERED executor
    const executor = new AIAutomationExecutor(
      automation.automation_blueprint,
      run.id,
      user_id,
      automation_id,
      supabase
    );

    const result = await executor.execute();

    // Update run status
    await supabase
      .from('automation_runs')
      .update({
        status: result.success ? 'completed' : 'failed',
        details_log: {
          ...run.details_log,
          completed_at: new Date().toISOString(),
          final_result: result,
          ai_powered: true,
          execution_type: 'ai_universal'
        }
      })
      .eq('id', run.id);

    console.log('✅ AI-POWERED AUTOMATION EXECUTION completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ AI-POWERED AUTOMATION EXECUTION failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        ai_powered: true,
        execution_type: 'ai_universal'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
