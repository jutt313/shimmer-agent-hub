
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import the automation execution logic
class AutomationExecutor {
  private context: any;
  private blueprint: any;
  private platformsConfig: any[];
  private credentials: Record<string, Record<string, string>> = {};
  private supabaseClient: any;

  constructor(blueprint: any, runId: string, userId: string, automationId: string, platformsConfig: any[] = [], supabaseClient: any) {
    this.blueprint = blueprint;
    this.platformsConfig = platformsConfig;
    this.supabaseClient = supabaseClient;
    this.context = {
      variables: blueprint.variables || {},
      runId,
      userId,
      automationId,
      stepIndex: 0,
      logs: []
    };
  }

  async execute(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      console.log('🚀 Starting real automation execution for blueprint:', this.blueprint.description);
      
      // Load platform credentials
      await this.loadCredentials();
      
      // Execute all steps
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
      
      console.log('✅ Real automation execution completed successfully');
      return { success: true, result: this.context.variables };
      
    } catch (error: any) {
      console.error('💥 Automation execution failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async loadCredentials(): Promise<void> {
    const { data: credentials, error } = await this.supabaseClient
      .from('platform_credentials')
      .select('*')
      .eq('user_id', this.context.userId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to load credentials:', error);
      return;
    }

    credentials?.forEach((cred: any) => {
      try {
        const decryptedCreds = JSON.parse(cred.credentials);
        this.credentials[cred.platform_name.toLowerCase()] = decryptedCreds;
      } catch (e) {
        console.error(`Failed to parse credentials for ${cred.platform_name}:`, e);
      }
    });

    console.log('🔑 Loaded credentials for platforms:', Object.keys(this.credentials));
  }

  private async executeStep(step: any): Promise<void> {
    this.logStep(step.id, 'running', `Starting step: ${step.name}`);

    switch (step.type) {
      case 'action':
        await this.executeAction(step);
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

  private async executeAction(step: any): Promise<void> {
    const { action } = step;
    if (!action) throw new Error('Action configuration missing');

    const platformName = action.integration.toLowerCase();
    const method = action.method;
    const parameters = this.resolveVariables(action.parameters);

    console.log(`🔧 Executing action: ${platformName}.${method}`, parameters);

    const platformCreds = this.credentials[platformName];
    if (!platformCreds) {
      throw new Error(`No credentials found for platform: ${platformName}`);
    }

    // Build API configuration based on platform
    const config = this.buildPlatformConfig(platformName, platformCreds);
    
    // Execute the API call
    await this.makeAPICall(platformName, method, parameters, config);
  }

  private buildPlatformConfig(platformName: string, credentials: any): any {
    const config: any = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'YusrAI-Automation/1.0',
      },
      timeout: 30000,
    };

    // Platform-specific configurations
    switch (platformName) {
      case 'slack':
        config.baseURL = 'https://slack.com/api';
        if (credentials.bot_token) {
          config.headers['Authorization'] = `Bearer ${credentials.bot_token}`;
        }
        break;
      case 'gmail':
      case 'google':
        config.baseURL = 'https://www.googleapis.com/gmail/v1';
        if (credentials.access_token) {
          config.headers['Authorization'] = `Bearer ${credentials.access_token}`;
        }
        break;
      case 'trello':
        config.baseURL = 'https://api.trello.com/1';
        break;
      case 'openai':
        config.baseURL = 'https://api.openai.com/v1';
        if (credentials.api_key) {
          config.headers['Authorization'] = `Bearer ${credentials.api_key}`;
        }
        break;
      default:
        config.baseURL = `https://api.${platformName}.com`;
        if (credentials.api_key) {
          config.headers['Authorization'] = `Bearer ${credentials.api_key}`;
        }
    }

    return config;
  }

  private async makeAPICall(platformName: string, method: string, parameters: any, config: any): Promise<any> {
    let url = config.baseURL;
    let httpMethod = 'POST';

    // Map method names to actual API endpoints
    switch (platformName) {
      case 'slack':
        if (method === 'send_message') {
          url = `${config.baseURL}/chat.postMessage`;
        }
        break;
      case 'gmail':
        if (method === 'send_email') {
          url = `${config.baseURL}/users/me/messages/send`;
        }
        break;
      case 'trello':
        if (method === 'create_card') {
          url = `${config.baseURL}/cards`;
        }
        break;
      case 'openai':
        if (method === 'chat_completion') {
          url = `${config.baseURL}/chat/completions`;
        }
        break;
    }

    const response = await fetch(url, {
      method: httpMethod,
      headers: config.headers,
      body: JSON.stringify(parameters),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ API call successful:`, result);
    return result;
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
    const model = agent.model || 'gpt-3.5-turbo';
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
    return new Response('ok', {heads: corsHeaders })
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

    // Get automation details
    const { data: automation, error: automationError } = await supabaseClient
      .from('automations')
      .select('id, title, user_id, automation_blueprint, platforms_config')
      .eq('id', automation_id)
      .single()

    if (automationError || !automation) {
      console.error('Error fetching automation:', automationError)
      return new Response(
        JSON.stringify({ error: 'Automation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate blueprint exists
    if (!automation.automation_blueprint) {
      return new Response(
        JSON.stringify({ error: 'Automation blueprint not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create automation run record
    const runId = crypto.randomUUID()
    const startTime = new Date()

    try {
      // Create notification for automation run started
      await supabaseClient.functions.invoke('create-notification', {
        body: {
          userId: automation.user_id,
          title: 'Automation Started',
          message: `Your automation "${automation.title}" has started running.`,
          type: 'automation_status',
          category: 'execution',
          metadata: { automation_id: automation.id, run_id: runId }
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

      // 🚀 REAL EXECUTION STARTS HERE
      console.log(`🚀 Starting REAL automation execution for: ${automation.title}`)
      
      // Create and execute the automation
      const executor = new AutomationExecutor(
        automation.automation_blueprint,
        runId,
        automation.user_id,
        automation.id,
        automation.platforms_config || [],
        supabaseClient
      );

      const executionResult = await executor.execute();
      
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      if (executionResult.success) {
        // Update run status to completed
        await supabaseClient
          .from('automation_runs')
          .update({
            status: 'completed',
            duration_ms: duration,
            details_log: {
              started_at: startTime.toISOString(),
              completed_at: endTime.toISOString(),
              result: executionResult.result,
              success: true
            }
          })
          .eq('id', runId)

        // Create notification for successful completion
        await supabaseClient.functions.invoke('create-notification', {
          body: {
            userId: automation.user_id,
            title: 'Automation Completed',
            message: `Your automation "${automation.title}" has completed successfully.`,
            type: 'automation_status',
            category: 'execution',
            metadata: { automation_id: automation.id, run_id: runId, duration_ms: duration }
          }
        });

        console.log(`✅ REAL automation execution completed: ${automation.title}`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            run_id: runId,
            status: 'completed',
            duration_ms: duration,
            automation_title: automation.title,
            execution_result: executionResult.result
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
      console.error('💥 Error during REAL automation execution:', executionError)
      
      // Update run status to failed
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
            success: false
          }
        })
        .eq('id', runId)

      // Create notification for failed execution
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
          error: 'Real automation execution failed',
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
