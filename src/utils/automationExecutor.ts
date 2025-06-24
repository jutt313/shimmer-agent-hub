
import { AutomationBlueprint } from '@/types/automation';
import { buildDynamicPlatformConfig, getDynamicMethodConfig, buildDynamicURL } from './dynamicPlatformConfig';
import { supabase } from '@/integrations/supabase/client';

export interface ExecutionContext {
  variables: Record<string, any>;
  runId: string;
  userId: string;
  automationId: string;
  stepIndex: number;
  logs: Array<{
    step: string;
    status: 'running' | 'completed' | 'failed';
    timestamp: string;
    message?: string;
    error?: string;
    output?: any;
  }>;
}

export class AutomationExecutor {
  private context: ExecutionContext;
  private blueprint: AutomationBlueprint;
  private platformsConfig: any[];
  private credentials: Record<string, Record<string, string>> = {};

  constructor(
    blueprint: AutomationBlueprint,
    runId: string,
    userId: string,
    automationId: string,
    platformsConfig: any[] = []
  ) {
    this.blueprint = blueprint;
    this.platformsConfig = platformsConfig;
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
      console.log('🚀 Starting real automation execution');
      
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
            // Simple retry logic - could be enhanced
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
            // Default: stop on error
            this.logStep(step.id, 'failed', `Step failed: ${error.message}`, error.message);
            throw error;
          }
        }
      }
      
      console.log('✅ Automation execution completed successfully');
      return { success: true, result: this.context.variables };
      
    } catch (error: any) {
      console.error('💥 Automation execution failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async loadCredentials(): Promise<void> {
    const { data: credentials, error } = await supabase
      .from('platform_credentials')
      .select('*')
      .eq('user_id', this.context.userId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to load credentials:', error);
      return;
    }

    // Organize credentials by platform
    credentials?.forEach((cred) => {
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

    // Get platform credentials
    const platformCreds = this.credentials[platformName];
    if (!platformCreds) {
      throw new Error(`No credentials found for platform: ${platformName}`);
    }

    // Build platform configuration
    const config = buildDynamicPlatformConfig(platformName, this.platformsConfig, platformCreds);
    
    // Get method configuration
    const methodConfig = getDynamicMethodConfig(platformName, method, this.platformsConfig);
    
    if (!methodConfig) {
      // Fallback for platforms not in dynamic config
      await this.executeFallbackAction(platformName, method, parameters, config);
      return;
    }

    // Build the API URL
    const url = buildDynamicURL(config.baseURL, methodConfig.endpoint, parameters, methodConfig.required_params);
    
    // Make the API call
    const requestOptions: RequestInit = {
      method: methodConfig.http_method.toUpperCase(),
      headers: config.headers,
      ...config,
    };

    // Add body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(methodConfig.http_method.toUpperCase())) {
      requestOptions.body = JSON.stringify(parameters);
    }

    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    // Store result in variables if specified
    if (action.output_variable) {
      this.context.variables[action.output_variable] = result;
    }

    console.log(`✅ Action completed successfully:`, result);
  }

  private async executeFallbackAction(platformName: string, method: string, parameters: any, config: any): Promise<void> {
    // Simple fallback for common actions
    let url = config.baseURL;
    let httpMethod = 'POST';

    if (platformName.includes('slack') && method === 'send_message') {
      url = `${config.baseURL}/chat.postMessage`;
      httpMethod = 'POST';
    } else if (platformName.includes('gmail') && method === 'send_email') {
      url = `${config.baseURL}/users/me/messages/send`;
      httpMethod = 'POST';
    } else if (platformName.includes('trello') && method === 'create_card') {
      url = `${config.baseURL}/cards`;
      httpMethod = 'POST';
    }

    const response = await fetch(url, {
      method: httpMethod,
      headers: config.headers,
      body: JSON.stringify(parameters),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fallback API call failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Fallback action completed:`, result);
  }

  private async executeCondition(step: any): Promise<void> {
    const { condition } = step;
    if (!condition) throw new Error('Condition configuration missing');

    const expression = this.resolveVariables(condition.expression);
    const result = this.evaluateExpression(expression);

    console.log(`🔍 Condition evaluation: ${expression} = ${result}`);

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
      // Set loop variables
      this.context.variables['loop_item'] = arrayData[i];
      this.context.variables['loop_index'] = i;

      console.log(`🔄 Loop iteration ${i + 1}/${arrayData.length}`);

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

    // Get AI agent configuration
    const { data: agent, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error || !agent) {
      throw new Error(`AI agent not found: ${agentId}`);
    }

    // Make AI API call based on agent configuration
    const aiResponse = await this.callAIProvider(agent, inputPrompt);
    
    // Store the response in variables
    if (ai_agent_call.output_variable) {
      this.context.variables[ai_agent_call.output_variable] = aiResponse;
    }

    console.log(`🤖 AI agent response stored in: ${ai_agent_call.output_variable}`);
  }

  private async callAIProvider(agent: any, prompt: string): Promise<any> {
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
      // Replace variable placeholders like {{variable_name}}
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
    // Simple expression evaluation - could be enhanced with a proper parser
    try {
      // Safety check: only allow basic comparisons
      if (!/^[a-zA-Z0-9\s\.\[\]"'<>=!&|()]+$/.test(expression)) {
        throw new Error('Invalid expression format');
      }
      
      // Replace variable references with actual values
      let evaluableExpression = expression;
      for (const [varName, varValue] of Object.entries(this.context.variables)) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        evaluableExpression = evaluableExpression.replace(regex, JSON.stringify(varValue));
      }
      
      // Use Function constructor for safe evaluation
      return new Function(`return ${evaluableExpression}`)();
    } catch (error) {
      console.error('Expression evaluation failed:', error);
      return false;
    }
  }

  private logStep(stepId: string, status: 'running' | 'completed' | 'failed', message: string, error?: string, output?: any): void {
    const logEntry = {
      step: stepId,
      status,
      timestamp: new Date().toISOString(),
      message,
      error,
      output
    };
    
    this.context.logs.push(logEntry);
    console.log(`📝 Step log:`, logEntry);
  }

  private async updateRunProgress(): Promise<void> {
    // Update the automation run with current progress
    const { error } = await supabase
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
