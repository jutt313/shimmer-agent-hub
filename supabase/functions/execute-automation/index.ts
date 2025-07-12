import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AUTOMATION-SPECIFIC CREDENTIAL EXECUTOR - CONNECTED TO UNIVERSAL INTEGRATOR
class AutomationSpecificExecutor {
  private context: any;
  private blueprint: any;
  private automationCredentials: Record<string, Record<string, string>> = {};
  private supabaseClient: any;
  private universalIntegrator: any;

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
    
    // 🎯 CRITICAL FIX: Initialize REAL Universal Platform Integrator
    this.universalIntegrator = new UniversalPlatformIntegrator();
    console.log('🌍 AutomationSpecificExecutor now using UNIVERSAL PLATFORM INTEGRATOR');
  }

  async execute(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      console.log('🚀 Starting AUTOMATION-SPECIFIC credential execution for blueprint:', this.blueprint.description);
      
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
      
      console.log('✅ AUTOMATION-SPECIFIC execution completed successfully');
      return { success: true, result: this.context.variables };
      
    } catch (error: any) {
      console.error('💥 Automation execution failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async loadAutomationCredentials(): Promise<void> {
    console.log('🔑 Loading AUTOMATION-SPECIFIC credentials...');
    
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
        console.log(`✅ Loaded AUTOMATION-SPECIFIC credentials for: ${cred.platform_name}`);
      } catch (e) {
        console.error(`Failed to parse credentials for ${cred.platform_name}:`, e);
      }
    });

    console.log('🔑 Loaded AUTOMATION-SPECIFIC credentials for platforms:', Object.keys(this.automationCredentials));
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

  // 🎯 CRITICAL: AUTOMATION-SPECIFIC CREDENTIAL USAGE WITH UNIVERSAL DISCOVERY
  private async executeUniversalAction(step: any): Promise<void> {
    const { action } = step;
    if (!action) throw new Error('Action configuration missing');

    const platformName = action.integration.toLowerCase();
    const method = action.method;
    const parameters = this.resolveVariables(action.parameters);

    console.log(`🌍 UNIVERSAL AUTOMATION EXECUTION: ${platformName}.${method}`, parameters);

    // Use AUTOMATION-SPECIFIC credentials
    const platformCreds = this.automationCredentials[platformName];
    if (!platformCreds) {
      throw new Error(`No AUTOMATION-SPECIFIC credentials found for platform: ${platformName}`);
    }

    console.log(`🔐 Using AUTOMATION-SPECIFIC credentials for ${platformName} with UNIVERSAL discovery`);

    try {
      // 🎯 CRITICAL FIX: Use UNIVERSAL platform integrator instead of hardcoded logic
      const result = await this.universalIntegrator.callPlatformAPI(
        platformName,
        method,
        parameters,
        platformCreds
      );

      console.log(`✅ UNIVERSAL AUTOMATION API CALL SUCCESS for ${platformName}.${method}:`, result);

      // Store result in output variable if specified
      if (action.output_variable) {
        this.context.variables[action.output_variable] = result;
      }

    } catch (error: any) {
      console.error(`❌ UNIVERSAL AUTOMATION API CALL FAILED for ${platformName}.${method}:`, error);
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

// 🌍 UNIVERSAL PLATFORM INTEGRATOR - EMBEDDED FOR AUTOMATION EXECUTION
class UniversalPlatformIntegrator {
  private platformConfigs = new Map<string, any>();

  async discoverPlatform(platformName: string): Promise<any> {
    console.log(`🔍 AUTOMATION: Discovering platform: ${platformName}`);

    // Try to fetch OpenAPI spec from common locations
    const possibleUrls = [
      `https://api.${platformName.toLowerCase()}.com/openapi.json`,
      `https://api.${platformName.toLowerCase()}.com/swagger.json`,
      `https://${platformName.toLowerCase()}.com/api/docs/openapi.json`,
      `https://developers.${platformName.toLowerCase()}.com/openapi.json`
    ];

    for (const url of possibleUrls) {
      try {
        console.log(`📡 AUTOMATION: Attempting to fetch API spec from: ${url}`);
        const response = await fetch(url);
        
        if (response.ok) {
          const spec = await response.json();
          const config = this.parseOpenAPISpec(platformName, spec);
          this.platformConfigs.set(platformName.toLowerCase(), config);
          
          console.log(`✅ AUTOMATION: Platform ${platformName} discovered dynamically`);
          return config;
        }
      } catch (error: any) {
        console.log(`⚠️ AUTOMATION: Failed to fetch from ${url}:`, error.message);
      }
    }

    console.log(`🔧 AUTOMATION: Creating intelligent fallback for ${platformName}`);
    return this.createIntelligentConfig(platformName);
  }

  private parseOpenAPISpec(platformName: string, spec: any): any {
    const baseUrl = spec.servers?.[0]?.url || this.getBaseUrlForPlatform(platformName);
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

  private createIntelligentConfig(platformName: string): any {
    return {
      name: platformName,
      base_url: this.getBaseUrlForPlatform(platformName),
      auth_config: this.getAuthConfigForPlatform(platformName),
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

  private getBaseUrlForPlatform(platformName: string): string {
    const lowerPlatform = platformName.toLowerCase();
    
    const platformUrls: Record<string, string> = {
      'slack': 'https://slack.com/api',
      'gmail': 'https://www.googleapis.com/gmail/v1',
      'google sheets': 'https://sheets.googleapis.com/v4',
      'google_sheets': 'https://sheets.googleapis.com/v4',
      'googlesheets': 'https://sheets.googleapis.com/v4',
      'trello': 'https://api.trello.com/1',
      'notion': 'https://api.notion.com/v1',
      'openai': 'https://api.openai.com/v1'
    };

    return platformUrls[lowerPlatform] || `https://api.${lowerPlatform}.com`;
  }

  private getAuthConfigForPlatform(platformName: string): any {
    const lowerPlatform = platformName.toLowerCase();
    
    const authConfigs: Record<string, any> = {
      'slack': {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {bot_token}'
      },
      'gmail': {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}'
      },
      'google sheets': {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}'
      },
      'google_sheets': {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}'
      },
      'googlesheets': {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {access_token}'
      }
    };

    return authConfigs[lowerPlatform] || {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {token}'
    };
  }

  async callPlatformAPI(platformName: string, endpointName: string, parameters: Record<string, any>, credentials: Record<string, string>): Promise<any> {
    console.log(`🚀 AUTOMATION: UNIVERSAL API CALL: ${platformName}.${endpointName}`);

    let config = this.platformConfigs.get(platformName.toLowerCase());
    
    if (!config) {
      console.log(`🔍 AUTOMATION: Platform ${platformName} not configured, discovering...`);
      config = await this.discoverPlatform(platformName);
    }

    const endpoint = config.endpoints[endpointName] || config.endpoints['universal_call'];
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointName} not found for platform ${platformName}`);
    }

    const baseUrl = config.base_url;
    let url = baseUrl + endpoint.path;

    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    const headers = await this.buildAuthHeaders(config.auth_config, credentials);

    const requestOptions: RequestInit = {
      method: endpoint.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      requestOptions.body = JSON.stringify(parameters);
    } else if (endpoint.method === 'GET') {
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

    console.log(`📡 AUTOMATION: Making UNIVERSAL ${endpoint.method} request to: ${url}`);

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AUTOMATION UNIVERSAL API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ AUTOMATION: UNIVERSAL API call successful for ${platformName}`);
    
    return result;
  }

  private async buildAuthHeaders(authConfig: any, credentials: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Universal-Automation/2.0'
    };

    switch (authConfig.type) {
      case 'bearer':
        const token = credentials.access_token || credentials.token || credentials.api_key || credentials.bot_token;
        if (token) {
          headers[authConfig.parameter_name] = authConfig.format
            .replace('{token}', token)
            .replace('{access_token}', token)
            .replace('{api_key}', token)
            .replace('{bot_token}', token);
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey) {
          if (authConfig.location === 'header') {
            headers[authConfig.parameter_name] = authConfig.format.replace('{api_key}', apiKey).replace('{token}', apiKey);
          }
        }
        break;
        
      case 'basic':
        const username = credentials.username;
        const password = credentials.password;
        if (username && password) {
          const basicAuth = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
        }
        break;
    }

    return headers;
  }

  // Helper methods
  private generateEndpointName(path: string, method: string): string {
    return `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')}`;
  }

  private extractRequiredParams(parameters: any[]): string[] {
    return parameters.filter(p => p.required).map(p => p.name);
  }

  private extractOptionalParams(parameters: any[]): string[] {
    return parameters.filter(p => !p.required).map(p => p.name);
  }

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
      } else if (firstScheme?.type === 'apiKey') {
        return {
          type: 'api_key',
          location: firstScheme.in,
          parameter_name: firstScheme.name,
          format: '{token}'
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { automation_id, trigger_data } = await req.json()

    if (!automation_id) {
      return new Response(
        JSON.stringify({ error: 'Missing automation_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: automation, error: automationError } = await supabaseClient
      .from('automations')
      .select('id, title, user_id, automation_blueprint')
      .eq('id', automation_id)
      .single()

    if (automationError || !automation) {
      console.error('Error fetching automation:', automationError)
      return new Response(
        JSON.stringify({ error: 'Automation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!automation.automation_blueprint) {
      return new Response(
        JSON.stringify({ error: 'Automation blueprint not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const runId = crypto.randomUUID()
    const startTime = new Date()

    try {
      await supabaseClient.functions.invoke('create-notification', {
        body: {
          userId: automation.user_id,
          title: 'Automation Started',
          message: `Your automation "${automation.title}" has started running with UNIVERSAL PLATFORM INTEGRATION.`,
          type: 'automation_status',
          category: 'execution',
          metadata: { automation_id: automation.id, run_id: runId, universal_integration: true }
        }
      });

      const { data: run, error: runError } = await supabaseClient
        .from('automation_runs')
        .insert([
          {
            id: runId,
            automation_id: automation_id,
            user_id: automation.user_id,
            status: 'running',
            trigger_data: trigger_data || {},
            run_timestamp: startTime.toISOString(),
            details_log: {
              started_at: startTime.toISOString(),
              steps: []
            }
          }
        ])
        .select()
        .single()

      if (runError) {
        console.error('Error creating automation run:', runError)
        throw runError
      }

      console.log(`🚀 Starting UNIVERSAL AUTOMATION execution for: ${automation.title}`)
      
      // 🎯 CRITICAL: USING UNIVERSAL PLATFORM INTEGRATION
      const executor = new AutomationSpecificExecutor(
        automation.automation_blueprint,
        runId,
        automation.user_id,
        automation.id,
        supabaseClient
      );

      const executionResult = await executor.execute();
      
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      if (executionResult.success) {
        await supabaseClient
          .from('automation_runs')
          .update({
            status: 'completed',
            duration_ms: duration,
            details_log: {
              started_at: startTime.toISOString(),
              completed_at: endTime.toISOString(),
              result: executionResult.result,
              success: true,
              execution_type: 'UNIVERSAL PLATFORM INTEGRATION'
            }
          })
          .eq('id', runId)

        await supabaseClient.functions.invoke('create-notification', {
          body: {
            userId: automation.user_id,
            title: 'Automation Completed',
            message: `Your automation "${automation.title}" completed successfully with universal platform integration.`,
            type: 'automation_status',
            category: 'execution',
            metadata: { automation_id: automation.id, run_id: runId, duration_ms: duration, universal_integration: true }
          }
        });

        console.log(`✅ UNIVERSAL AUTOMATION execution completed: ${automation.title}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            run_id: runId,
            status: 'completed',
            duration_ms: duration,
            automation_title: automation.title,
            execution_result: executionResult.result,
            execution_type: 'UNIVERSAL PLATFORM INTEGRATION'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        throw new Error(executionResult.error || 'Unknown execution error');
      }

    } catch (executionError) {
      console.error('💥 Error during UNIVERSAL AUTOMATION execution:', executionError)
      
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()
      
      await supabaseClient
        .from('automation_runs')
        .update({
          status: 'failed',
          duration_ms: duration,
          details_log: {
            started_at: startTime.toISOString(),
            failed_at: endTime.toISOString(),
            error: executionError.message,
            success: false,
            execution_type: 'UNIVERSAL PLATFORM INTEGRATION'
          }
        })
        .eq('id', runId)

      await supabaseClient.functions.invoke('create-notification', {
        body: {
          userId: automation.user_id,
          title: 'Automation Failed',
          message: `Your automation "${automation.title}" failed: ${executionError.message}`,
          type: 'automation_status',
          category: 'error',
          metadata: { automation_id: automation.id, run_id: runId, error: executionError.message }
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'UNIVERSAL AUTOMATION execution failed',
          run_id: runId,
          details: executionError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in execute-automation function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
