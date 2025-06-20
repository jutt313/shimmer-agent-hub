
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExecutionContext {
  variables: Record<string, any>;
  automationId: string;
  runId: string;
  startTime: number;
}

interface PlatformCredential {
  id: string;
  platform_name: string;
  credentials: string; // JSON string containing all credential fields
}

interface AIAgent {
  id: string;
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  agent_rules: string;
  agent_memory: any;
  llm_provider: string;
  model: string;
  api_key: string;
}

class AutomationExecutor {
  private context: ExecutionContext;
  private platformCredentials: Map<string, any> = new Map();
  private aiAgents: Map<string, AIAgent> = new Map();
  private automationBlueprint: any;

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  async initialize(automationId: string): Promise<boolean> {
    try {
      console.log(`🚀 Initializing automation ${automationId}`);

      // Fetch automation blueprint
      const { data: automation, error: automationError } = await supabase
        .from('automations')
        .select('automation_blueprint, title')
        .eq('id', automationId)
        .single();

      if (automationError || !automation?.automation_blueprint) {
        throw new Error(`Failed to fetch automation blueprint: ${automationError?.message}`);
      }

      this.automationBlueprint = automation.automation_blueprint;
      console.log(`📋 Loaded blueprint with ${this.automationBlueprint.steps?.length || 0} steps`);

      // Fetch all platform credentials referenced in the blueprint
      await this.loadPlatformCredentials();

      // Fetch all AI agents referenced in the blueprint
      await this.loadAIAgents();

      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      await this.logError('initialization', error.message);
      return false;
    }
  }

  private async loadPlatformCredentials(): Promise<void> {
    const credentialIds = new Set<string>();
    
    // Extract all platform_credential_id from blueprint steps
    this.automationBlueprint.steps?.forEach((step: any) => {
      if (step.action?.platform_credential_id) {
        credentialIds.add(step.action.platform_credential_id);
      }
    });

    if (credentialIds.size === 0) return;

    const { data: credentials, error } = await supabase
      .from('platform_credentials')
      .select('*')
      .in('id', Array.from(credentialIds));

    if (error) {
      throw new Error(`Failed to fetch platform credentials: ${error.message}`);
    }

    credentials?.forEach((cred: PlatformCredential) => {
      try {
        const parsedCredentials = JSON.parse(cred.credentials);
        this.platformCredentials.set(cred.id, {
          platform_name: cred.platform_name,
          ...parsedCredentials
        });
        console.log(`🔑 Loaded credentials for ${cred.platform_name}`);
      } catch (parseError) {
        console.error(`Failed to parse credentials for ${cred.platform_name}:`, parseError);
      }
    });
  }

  private async loadAIAgents(): Promise<void> {
    const agentIds = new Set<string>();
    
    // Extract all agent_id from blueprint steps
    this.automationBlueprint.steps?.forEach((step: any) => {
      if (step.ai_agent_call?.agent_id) {
        agentIds.add(step.ai_agent_call.agent_id);
      }
    });

    if (agentIds.size === 0) return;

    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('*')
      .in('id', Array.from(agentIds));

    if (error) {
      throw new Error(`Failed to fetch AI agents: ${error.message}`);
    }

    agents?.forEach((agent: any) => {
      this.aiAgents.set(agent.id, {
        id: agent.id,
        agent_name: agent.agent_name,
        agent_role: agent.agent_role,
        agent_goal: agent.agent_goal,
        agent_rules: agent.agent_rules,
        agent_memory: agent.agent_memory,
        llm_provider: agent.llm_provider || 'OpenAI',
        model: agent.model || 'gpt-4o-mini',
        api_key: agent.api_key
      });
      console.log(`🤖 Loaded AI agent: ${agent.agent_name} (${agent.llm_provider}/${agent.model})`);
    });
  }

  async executeAutomation(): Promise<void> {
    const timeout = setTimeout(() => {
      throw new Error('Automation execution timeout (5 minutes)');
    }, 5 * 60 * 1000); // 5 minutes

    try {
      await this.updateRunStatus('running', { message: 'Automation execution started' });

      for (let i = 0; i < this.automationBlueprint.steps.length; i++) {
        const step = this.automationBlueprint.steps[i];
        console.log(`⚡ Executing step ${i + 1}: ${step.name} (${step.type})`);

        await this.executeStep(step);
      }

      clearTimeout(timeout);
      await this.updateRunStatus('completed', { 
        message: 'Automation completed successfully',
        duration_ms: Date.now() - this.context.startTime,
        final_variables: this.context.variables
      });

      console.log('✅ Automation completed successfully');

    } catch (error) {
      clearTimeout(timeout);
      console.error('❌ Automation execution failed:', error);
      await this.updateRunStatus('failed', { 
        error: error.message,
        duration_ms: Date.now() - this.context.startTime
      });
      throw error;
    }
  }

  private async executeStep(step: any): Promise<void> {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        switch (step.type) {
          case 'action':
            await this.executeAction(step);
            break;
          case 'ai_agent_call':
            await this.executeAIAgentCall(step);
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
          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }
        
        console.log(`✅ Step completed: ${step.name}`);
        return; // Success, exit retry loop

      } catch (error) {
        console.error(`❌ Step failed (attempt ${retryCount + 1}): ${step.name}`, error);

        if (step.on_error === 'continue' && retryCount === 0) {
          console.log(`⏭️ Continuing despite error in step: ${step.name}`);
          return;
        }

        if (step.on_error === 'stop' || retryCount >= maxRetries) {
          throw error;
        }

        if (step.on_error === 'retry' || !step.on_error) {
          retryCount++;
          const delay = Math.pow(2, retryCount - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`🔄 Retrying step in ${delay}ms: ${step.name}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  private async executeAction(step: any): Promise<void> {
    const { integration, method, parameters, platform_credential_id } = step.action;
    
    if (!platform_credential_id || !this.platformCredentials.has(platform_credential_id)) {
      throw new Error(`Platform credentials not found for step: ${step.name}`);
    }

    const credentials = this.platformCredentials.get(platform_credential_id);
    const resolvedParams = this.resolveVariables(parameters);

    console.log(`🔌 Executing ${integration}.${method} with credentials for ${credentials.platform_name}`);

    // Dynamic platform API call based on integration and method
    const result = await this.callPlatformAPI(integration, method, resolvedParams, credentials);
    
    // Store result in context variables
    this.context.variables[`${step.id}_result`] = result;
    
    await this.logStepExecution(step, { 
      input: resolvedParams, 
      output: result,
      platform: credentials.platform_name
    });
  }

  private async executeAIAgentCall(step: any): Promise<void> {
    const { agent_id, input_prompt, output_variable } = step.ai_agent_call;
    
    if (!this.aiAgents.has(agent_id)) {
      throw new Error(`AI Agent not found: ${agent_id}`);
    }

    const agent = this.aiAgents.get(agent_id)!;
    const resolvedPrompt = this.resolveVariables(input_prompt);

    console.log(`🤖 Executing AI agent: ${agent.agent_name} (${agent.llm_provider}/${agent.model})`);

    // Build system prompt with agent configuration
    const systemPrompt = this.buildAgentSystemPrompt(agent);

    // Call AI agent via chat-ai function
    const agentResponse = await this.callAIAgent(agent, systemPrompt, resolvedPrompt);

    // Store agent response in context
    this.context.variables[output_variable] = agentResponse;

    // Update agent memory (append/merge strategy)
    await this.updateAgentMemory(agent, resolvedPrompt, agentResponse);

    await this.logStepExecution(step, {
      agent_name: agent.agent_name,
      llm_provider: agent.llm_provider,
      model: agent.model,
      input_prompt: resolvedPrompt,
      output: agentResponse
    });
  }

  private async executeCondition(step: any): Promise<void> {
    const { expression, if_true, if_false } = step.condition;
    const resolvedExpression = this.resolveVariables(expression);
    
    // Simple expression evaluation (can be enhanced for complex conditions)
    const conditionResult = this.evaluateCondition(resolvedExpression);
    
    console.log(`🔀 Condition evaluated: ${conditionResult}`);

    const nextSteps = conditionResult ? if_true : if_false;
    
    if (nextSteps && nextSteps.length > 0) {
      for (const nestedStep of nextSteps) {
        await this.executeStep(nestedStep);
      }
    }

    await this.logStepExecution(step, {
      expression: resolvedExpression,
      result: conditionResult,
      executed_branch: conditionResult ? 'if_true' : 'if_false'
    });
  }

  private async executeLoop(step: any): Promise<void> {
    const { array_source, steps: loopSteps } = step.loop;
    const arrayData = this.resolveVariables(array_source);

    if (!Array.isArray(arrayData)) {
      throw new Error(`Loop source is not an array: ${array_source}`);
    }

    console.log(`🔄 Executing loop for ${arrayData.length} items`);

    for (let i = 0; i < arrayData.length; i++) {
      console.log(`🔄 Loop iteration ${i + 1}/${arrayData.length}`);
      
      // Set current loop item in context
      this.context.variables['loop_current_item'] = arrayData[i];
      this.context.variables['loop_current_index'] = i;

      for (const loopStep of loopSteps) {
        await this.executeStep(loopStep);
      }
    }

    await this.logStepExecution(step, {
      array_length: arrayData.length,
      completed_iterations: arrayData.length
    });
  }

  private async executeDelay(step: any): Promise<void> {
    const { duration_seconds } = step.delay;
    console.log(`⏰ Delaying execution for ${duration_seconds} seconds`);
    
    await new Promise(resolve => setTimeout(resolve, duration_seconds * 1000));
    
    await this.logStepExecution(step, {
      duration_seconds
    });
  }

  private async callPlatformAPI(integration: string, method: string, parameters: any, credentials: any): Promise<any> {
    // Dynamic API call construction based on platform
    const apiConfig = this.buildPlatformAPIConfig(integration, method, parameters, credentials);
    
    const response = await fetch(apiConfig.url, {
      method: apiConfig.method,
      headers: apiConfig.headers,
      body: apiConfig.body ? JSON.stringify(apiConfig.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Platform API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private buildPlatformAPIConfig(integration: string, method: string, parameters: any, credentials: any): any {
    // Dynamic platform API configuration
    // This builds the appropriate API call based on the platform and method
    const platformConfigs: Record<string, any> = {
      slack: {
        baseUrl: 'https://slack.com/api',
        getAuthHeader: (token: string) => ({ 'Authorization': `Bearer ${token}` }),
        methods: {
          send_message: {
            endpoint: 'chat.postMessage',
            method: 'POST',
            body: parameters // parameters should include { channel: 'CHANNEL_ID', text: 'message' }
          }
        }
      },
      gmail: {
        baseUrl: 'https://gmail.googleapis.com/gmail/v1',
        getAuthHeader: (accessToken: string) => ({ 'Authorization': `Bearer ${accessToken}` }),
        methods: {
          send_email: {
            endpoint: 'users/me/messages/send',
            method: 'POST',
            body: parameters // parameters should be a raw email message in base64url format
          }
        }
      },
      asana: {
        baseUrl: 'https://app.asana.com/api/1.0',
        getAuthHeader: (personalAccessToken: string) => ({ 'Authorization': `Bearer ${personalAccessToken}` }),
        methods: {
          create_task: {
            endpoint: 'tasks',
            method: 'POST',
            body: {
              data: {
                ...parameters,
                // Add default values for required fields like workspace if not in blueprint parameters
                // e.g., workspace: credentials.workspace_id,
              }
            }
          }
        }
      },
      trello: {
        baseUrl: 'https://api.trello.com/1',
        getAuthHeader: (apiKey: string, apiToken: string) => ({ 'key': apiKey, 'token': apiToken }), // Trello uses key and token in query params or headers
        methods: {
          create_card: {
            endpoint: 'cards',
            method: 'POST',
            body: parameters // parameters should include { name: 'Card Name', idList: 'LIST_ID', idBoard: 'BOARD_ID' }
          }
        }
      },
      microsoft_teams: { // Assuming webhook method for simplicity as per common use case
        // No base URL needed if using direct webhook_url
        getAuthHeader: () => ({}), // Webhooks usually don't need auth headers
        methods: {
          send_message: {
            // endpoint is the full webhook_url itself
            method: 'POST',
            body: parameters // parameters should be { text: 'message' } for simple messages
          }
        }
      },
      help_scout: {
        baseUrl: 'https://api.helpscout.net/v2',
        getAuthHeader: (accessToken: string) => ({ 'Authorization': `Bearer ${accessToken}` }),
        methods: {
          add_label_to_ticket: { // Example method
            endpoint: (ticketId: string) => `conversations/${ticketId}/tags`, // Dynamic endpoint
            method: 'POST',
            body: parameters // parameters might be { tag: 'LABEL_NAME' }
          },
          monitor_new_ticket: { // Trigger, not action, but placeholder for API
            endpoint: 'conversations',
            method: 'GET', // Or listen to webhooks
          }
        }
      }
      // Add more platforms dynamically based on user needs
    };

    const config = platformConfigs[integration];
    if (!config) {
      throw new Error(`Platform integration not configured: ${integration}`);
    }

    const methodConfig = config.methods[method];
    if (!methodConfig) {
      throw new Error(`Method not configured for ${integration}: ${method}`);
    }

    // Resolve URL for dynamic endpoints like Help Scout ticket tags
    let url = `${config.baseUrl}/${methodConfig.endpoint}`;
    if (typeof methodConfig.endpoint === 'function') {
      url = `${config.baseUrl}/${methodConfig.endpoint(parameters.id || parameters.ticket_id)}`; // Pass ID to dynamic endpoint
      delete parameters.id; // Remove ID from body if already used in URL
      delete parameters.ticket_id;
    } else if (integration === 'microsoft_teams') {
      url = credentials.webhook_url; // For Teams, webhook_url is the endpoint
    }

    // Determine headers including authentication
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.getAuthHeader) {
        // Trello needs key/token directly in headers or query params, not standard Authorization header
        if (integration === 'trello') {
            headers = {
                ...headers,
                'key': credentials.api_key,
                'token': credentials.api_token,
            };
        } else if (credentials.access_token) { // Use access_token for standard bearer auth
            headers = {
                ...headers,
                ...config.getAuthHeader(credentials.access_token)
            };
        } else if (credentials.bot_token) { // For Slack bot_token
            headers = {
                ...headers,
                ...config.getAuthHeader(credentials.bot_token)
            };
        } else if (credentials.personal_access_token) { // For Asana
            headers = {
                ...headers,
                ...config.getAuthHeader(credentials.personal_access_token)
            };
        } else if (credentials.api_key && integration !== 'trello') { // Generic API key if not Trello
            headers = {
                ...headers,
                ...config.getAuthHeader(credentials.api_key)
            };
        }
    }

    return {
      url: url,
      method: methodConfig.method,
      headers: headers,
      body: methodConfig.body // Body is already resolved parameters
    };
  }

  private async callAIAgent(agent: AIAgent, systemPrompt: string, userPrompt: string): Promise<string> {
    const payload = {
      message: userPrompt,
      messages: [], // No conversation history for agent calls
      agentConfig: {
        role: agent.agent_role,
        goal: agent.agent_goal,
        rules: agent.agent_rules,
        memory: agent.agent_memory
      },
      llmProvider: agent.llm_provider,
      model: agent.model,
      apiKey: agent.api_key
    };

    const { data, error } = await supabase.functions.invoke('chat-ai', { body: payload });

    if (error) {
      throw new Error(`AI Agent call failed: ${error.message}`);
    }

    return data.response;
  }

  private buildAgentSystemPrompt(agent: AIAgent): string {
    return `You are ${agent.agent_name}, an AI agent with the following configuration:

Role: ${agent.agent_role}
Goal: ${agent.agent_goal}
Rules: ${agent.agent_rules}
Memory Context: ${JSON.stringify(agent.agent_memory)}

You are part of an automation workflow. Provide precise, actionable responses that help achieve the automation's objectives.`;
  }

  private async updateAgentMemory(agent: AIAgent, input: string, output: string): Promise<void> {
    // Append/merge memory strategy
    const currentMemory = agent.agent_memory || {};
    const newMemoryEntry = {
      timestamp: new Date().toISOString(),
      input,
      output,
      context: 'automation_execution'
    };

    // Merge with existing memory
    const updatedMemory = {
      ...currentMemory,
      recent_interactions: [
        ...(currentMemory.recent_interactions || []),
        newMemoryEntry
      ].slice(-50) // Keep last 50 interactions
    };

    await supabase
      .from('ai_agents')
      .update({ agent_memory: updatedMemory })
      .eq('id', agent.id);

    // Update local copy
    agent.agent_memory = updatedMemory;
  }

  private resolveVariables(input: any): any {
    if (typeof input === 'string') {
      return input.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        const value = this.context.variables[varName.trim()];
        return value !== undefined ? String(value) : match;
      });
    }
    
    if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        return input.map(item => this.resolveVariables(item));
      }
      
      const resolved: any = {};
      for (const [key, value] of Object.entries(input)) {
        resolved[key] = this.resolveVariables(value);
      }
      return resolved;
    }
    
    return input;
  }

  private evaluateCondition(expression: string): boolean {
    // Simple condition evaluation - can be enhanced for complex expressions
    try {
      // Basic comparison operators
      if (expression.includes('===')) {
        const [left, right] = expression.split('===').map(s => s.trim());
        return String(left) === String(right);
      }
      if (expression.includes('!==')) {
        const [left, right] = expression.split('!==').map(s => s.trim());
        return String(left) !== String(right);
      }
      if (expression.includes('>=')) {
        const [left, right] = expression.split('>=').map(s => s.trim());
        return parseFloat(left) >= parseFloat(right);
      }
      if (expression.includes('<=')) {
        const [left, right] = expression.split('<=').map(s => s.trim());
        return parseFloat(left) <= parseFloat(right);
      }
      if (expression.includes('>')) {
        const [left, right] = expression.split('>').map(s => s.trim());
        return parseFloat(left) > parseFloat(right);
      }
      if (expression.includes('<')) {
        const [left, right] = expression.split('<').map(s => s.trim());
        return parseFloat(left) < parseFloat(right);
      }
      
      // Boolean evaluation
      return Boolean(expression);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  private async updateRunStatus(status: string, details: any): Promise<void> {
    await supabase
      .from('automation_runs')
      .update({
        status,
        details_log: details,
        ...(status === 'completed' || status === 'failed' ? { duration_ms: details.duration_ms } : {})
      })
      .eq('id', this.context.runId);
  }

  private async logStepExecution(step: any, details: any): Promise<void> {
    console.log(`📝 Logging step execution: ${step.name}`, details);
  }

  private async logError(stage: string, error: string): Promise<void> {
    await this.updateRunStatus('failed', {
      error,
      stage,
      duration_ms: Date.now() - this.context.startTime
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { automation_id, trigger_data = {} } = await req.json();

    if (!automation_id) {
      throw new Error('automation_id is required');
    }

    console.log(`🚀 Starting automation execution: ${automation_id}`);

    // Create automation run record
    const { data: runData, error: runError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id,
        status: 'running',
        trigger_data,
        details_log: { message: 'Execution started' }
      })
      .select()
      .single();

    if (runError) {
      throw new Error(`Failed to create automation run: ${runError.message}`);
    }

    const context: ExecutionContext = {
      variables: { ...trigger_data },
      automationId: automation_id,
      runId: runData.id,
      startTime: Date.now()
    };

    const executor = new AutomationExecutor(context);
    
    // Initialize and execute automation
    const initialized = await executor.initialize(automation_id);
    if (!initialized) {
      throw new Error('Failed to initialize automation executor');
    }

    // Execute in background to avoid timeout
    EdgeRuntime.waitUntil(executor.executeAutomation());

    return new Response(JSON.stringify({ 
      success: true, 
      run_id: runData.id,
      message: 'Automation execution started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Automation execution error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
