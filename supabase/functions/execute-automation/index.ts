import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// TRUE UNIVERSAL PLATFORM INTEGRATOR FOR AUTOMATION EXECUTION
class TrueUniversalExecutionIntegrator {
  private platformConfigs = new Map<string, any>();

  async discoverPlatform(platformName: string): Promise<any> {
    console.log(`🔍 EXECUTION: TRUE UNIVERSAL DISCOVERY for ${platformName}`);

    // Real OpenAPI spec discovery
    const possibleUrls = [
      `https://api.${platformName.toLowerCase()}.com/openapi.json`,
      `https://api.${platformName.toLowerCase()}.com/swagger.json`,
      `https://${platformName.toLowerCase()}.com/api/docs/openapi.json`,
      `https://developers.${platformName.toLowerCase()}.com/openapi.json`
    ];

    for (const url of possibleUrls) {
      try {
        console.log(`📡 EXECUTION: Fetching API spec from: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          const spec = await response.json();
          const config = this.parseOpenAPISpec(platformName, spec);
          this.platformConfigs.set(platformName.toLowerCase(), config);
          
          console.log(`✅ EXECUTION: Platform ${platformName} discovered via OpenAPI`);
          return config;
        }
      } catch (error: any) {
        console.log(`⚠️ EXECUTION: Failed to fetch from ${url}:`, error.message);
      }
    }

    console.log(`🔧 EXECUTION: Creating zero-hardcode config for ${platformName}`);
    return this.createZeroHardcodeConfig(platformName);
  }

  private parseOpenAPISpec(platformName: string, spec: any): any {
    const baseUrl = spec.servers?.[0]?.url || this.inferBaseUrl(platformName);
    const endpoints: Record<string, any> = {};

    Object.entries(spec.paths || {}).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        const endpointName = this.generateEndpointName(path, method);
        endpoints[endpointName] = {
          method: method.toUpperCase(),
          path: path,
          required_params: this.extractRequiredParams(details.parameters || []),
          optional_params: this.extractOptionalParams(details.parameters || []),
          response_schema: details.responses?.['200'] || {}
        };
      });
    });

    return {
      name: platformName,
      base_url: baseUrl,
      auth_config: this.detectAuthConfig(spec),
      endpoints
    };
  }

  private createZeroHardcodeConfig(platformName: string): any {
    return {
      name: platformName,
      base_url: this.inferBaseUrl(platformName),
      auth_config: this.inferAuthConfig(platformName),
      endpoints: {
        'universal_call': {
          method: 'POST',
          path: '/api/v1/execute',
          required_params: [],
          optional_params: [],
          response_schema: {}
        }
      }
    };
  }

  private inferBaseUrl(platformName: string): string {
    return `https://api.${platformName.toLowerCase()}.com`;
  }

  private inferAuthConfig(platformName: string): any {
    return {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {access_token}'
    };
  }

  async callPlatformAPI(
    platformName: string, 
    endpointName: string, 
    parameters: Record<string, any>, 
    credentials: Record<string, string>
  ): Promise<any> {
    console.log(`🚀 EXECUTION: TRUE UNIVERSAL API CALL: ${platformName}.${endpointName}`);

    let config = this.platformConfigs.get(platformName.toLowerCase());
    
    if (!config) {
      console.log(`🔍 EXECUTION: Platform ${platformName} not configured, discovering...`);
      config = await this.discoverPlatform(platformName);
    }

    const endpoint = config.endpoints[endpointName] || config.endpoints['universal_call'];
    const baseUrl = config.base_url;
    
    // Build request URL
    let url = baseUrl + endpoint.path;

    // Replace path parameters
    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    // Build headers with authentication
    const headers = await this.buildAuthHeaders(config.auth_config, credentials);

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

    console.log(`📡 EXECUTION: Making ${endpoint.method} request to: ${url}`);

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TRUE UNIVERSAL API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ EXECUTION: TRUE UNIVERSAL API call successful for ${platformName}`);
      
      return result;
    } catch (error) {
      console.error(`❌ EXECUTION: TRUE UNIVERSAL API call failed:`, error);
      throw error;
    }
  }

  private async buildAuthHeaders(authConfig: any, credentials: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-True-Universal-Execution/3.0'
    };

    switch (authConfig.type) {
      case 'bearer':
        const token = credentials.access_token || credentials.token || credentials.api_key;
        if (token) {
          headers[authConfig.parameter_name] = authConfig.format
            .replace('{token}', token)
            .replace('{access_token}', token)
            .replace('{api_key}', token);
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey && authConfig.location === 'header') {
          headers[authConfig.parameter_name] = authConfig.format
            .replace('{api_key}', apiKey)
            .replace('{token}', apiKey);
        }
        break;
    }

    return headers;
  }

  // Helper methods
  private detectAuthConfig(spec: any): any {
    const securitySchemes = spec.components?.securitySchemes;
    
    if (securitySchemes) {
      const firstScheme = Object.values(securitySchemes)[0] as any;
      
      if (firstScheme?.type === 'http' && firstScheme?.scheme === 'bearer') {
        return {
          type: 'bearer',
          location: 'header',
          parameter_name: 'Authorization',
          format: 'Bearer {token}'
        };
      }
    }

    return {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {token}'
    };
  }

  private generateEndpointName(path: string, method: string): string {
    return `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`;
  }

  private extractRequiredParams(parameters: any[]): string[] {
    return parameters.filter(p => p.required).map(p => p.name);
  }

  private extractOptionalParams(parameters: any[]): string[] {
    return parameters.filter(p => !p.required).map(p => p.name);
  }
}

// CLEAN AUTOMATION EXECUTOR - NO HARDCODED PLATFORM LOGIC
class CleanAutomationExecutor {
  private context: any;
  private blueprint: any;
  private automationCredentials: Record<string, Record<string, string>> = {};
  private supabaseClient: any;
  private universalIntegrator: TrueUniversalExecutionIntegrator;

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
    
    this.universalIntegrator = new TrueUniversalExecutionIntegrator();
    console.log('🌍 CleanAutomationExecutor using TRUE UNIVERSAL PLATFORM INTEGRATOR');
  }

  async execute(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      console.log('🚀 Starting CLEAN automation execution:', this.blueprint.description);
      
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
      
      console.log('✅ CLEAN automation execution completed successfully');
      return { success: true, result: this.context.variables };
      
    } catch (error: any) {
      console.error('💥 Clean automation execution failed:', error);
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
        await this.executeUniversalAction(step);
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

  // 100% ROUTING THROUGH TRUE UNIVERSAL INTEGRATOR
  private async executeUniversalAction(step: any): Promise<void> {
    const { action } = step;
    if (!action) throw new Error('Action configuration missing');

    const platformName = action.integration.toLowerCase();
    const method = action.method;
    const parameters = this.resolveVariables(action.parameters);

    console.log(`🌍 TRUE UNIVERSAL EXECUTION: ${platformName}.${method}`, parameters);

    const platformCreds = this.automationCredentials[platformName];
    if (!platformCreds) {
      throw new Error(`No credentials found for platform: ${platformName}`);
    }

    console.log(`🔐 Using credentials for ${platformName} with TRUE UNIVERSAL discovery`);

    try {
      // 100% ROUTING THROUGH TRUE UNIVERSAL INTEGRATOR
      const result = await this.universalIntegrator.callPlatformAPI(
        platformName,
        method,
        parameters,
        platformCreds
      );

      console.log(`✅ TRUE UNIVERSAL API SUCCESS for ${platformName}.${method}:`, result);

      if (action.output_variable) {
        this.context.variables[action.output_variable] = result;
      }

    } catch (error: any) {
      console.error(`❌ TRUE UNIVERSAL API FAILED for ${platformName}.${method}:`, error);
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
          variables: this.context.variables
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

    console.log('🚀 CLEAN AUTOMATION EXECUTION started:', { automation_id, user_id });

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

    // Execute automation with CLEAN executor
    const executor = new CleanAutomationExecutor(
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
          execution_type: 'clean_universal'
        }
      })
      .eq('id', run.id);

    console.log('✅ CLEAN AUTOMATION EXECUTION completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ CLEAN AUTOMATION EXECUTION failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        execution_type: 'clean_universal'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});