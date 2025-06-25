import { AutomationBlueprint } from '@/types/automation';
import { buildDynamicPlatformConfig, getDynamicMethodConfig, buildDynamicURL } from './dynamicPlatformConfig';
import { supabase } from '@/integrations/supabase/client';
import { SecureExpressionParser } from './secureExpressionParser';
import { 
  RetryHandler, 
  CircuitBreaker, 
  globalErrorLogger, 
  DEFAULT_RETRY_CONFIG, 
  DEFAULT_CIRCUIT_BREAKER_CONFIG 
} from './errorHandler';
import { globalRateLimiter } from './rateLimiter';

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
  private expressionParser: SecureExpressionParser;
  private retryHandler: RetryHandler;
  private circuitBreakers = new Map<string, CircuitBreaker>();

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
    
    this.expressionParser = new SecureExpressionParser();
    this.retryHandler = new RetryHandler(DEFAULT_RETRY_CONFIG);
    
    globalErrorLogger.log('INFO', 'AutomationExecutor initialized with secure parser', {
      automationId,
      runId,
      stepsCount: blueprint.steps.length
    }, undefined, automationId, runId);
  }

  async execute(): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      globalErrorLogger.log('INFO', '🚀 Starting real automation execution', {
        description: this.blueprint.description
      }, undefined, this.context.automationId, this.context.runId);
      
      // Load platform credentials
      await this.loadCredentials();
      
      // Execute all steps
      for (let i = 0; i < this.blueprint.steps.length; i++) {
        this.context.stepIndex = i;
        const step = this.blueprint.steps[i];
        
        globalErrorLogger.log('INFO', `📍 Executing step ${i + 1}: ${step.name} (${step.type})`, {
          stepId: step.id,
          stepType: step.type
        }, step.id, this.context.automationId, this.context.runId);
        
        try {
          await this.executeStep(step);
          await this.updateRunProgress();
        } catch (error: any) {
          globalErrorLogger.log('ERROR', `❌ Step ${i + 1} failed`, {
            error: error.message,
            stack: error.stack
          }, step.id, this.context.automationId, this.context.runId);
          
          if (step.on_error === 'continue') {
            this.logStep(step.id, 'failed', `Step failed but continuing: ${error.message}`, error.message);
            continue;
          } else if (step.on_error === 'retry') {
            try {
              globalErrorLogger.log('INFO', `🔄 Retrying step ${i + 1}`, {}, step.id, this.context.automationId, this.context.runId);
              await this.executeStep(step);
              await this.updateRunProgress();
            } catch (retryError: any) {
              this.logStep(step.id, 'failed', `Step failed after retry: ${retryError.message}`, retryError.message);
              throw retryError;
            }
          } else {
            this.logStep(step.id, 'failed', `Step failed: ${error.message}`, error.message);
            throw error;
          }
        }
      }
      
      globalErrorLogger.log('INFO', '✅ Automation execution completed successfully', {
        finalVariables: this.context.variables
      }, undefined, this.context.automationId, this.context.runId);
      
      return { success: true, result: this.context.variables };
      
    } catch (error: any) {
      globalErrorLogger.log('CRITICAL', '💥 Automation execution failed', {
        error: error.message,
        stack: error.stack
      }, undefined, this.context.automationId, this.context.runId);
      
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
      globalErrorLogger.log('ERROR', 'Failed to load credentials', { error }, undefined, this.context.automationId, this.context.runId);
      return;
    }

    credentials?.forEach((cred) => {
      try {
        const decryptedCreds = JSON.parse(cred.credentials);
        this.credentials[cred.platform_name.toLowerCase()] = decryptedCreds;
      } catch (e) {
        globalErrorLogger.log('ERROR', `Failed to parse credentials for ${cred.platform_name}`, { error: e }, undefined, this.context.automationId, this.context.runId);
      }
    });

    globalErrorLogger.log('INFO', '🔑 Loaded credentials for platforms', {
      platforms: Object.keys(this.credentials)
    }, undefined, this.context.automationId, this.context.runId);
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

    globalErrorLogger.log('INFO', `🔧 Executing action: ${platformName}.${method}`, {
      parameters
    }, step.id, this.context.automationId, this.context.runId);

    // Check rate limit
    const canProceed = await globalRateLimiter.checkRateLimit(platformName);
    if (!canProceed) {
      await globalRateLimiter.waitForRateLimit(platformName);
    }

    const platformCreds = this.credentials[platformName];
    if (!platformCreds) {
      throw new Error(`No credentials found for platform: ${platformName}`);
    }

    // Get or create circuit breaker for this platform
    if (!this.circuitBreakers.has(platformName)) {
      this.circuitBreakers.set(platformName, new CircuitBreaker(DEFAULT_CIRCUIT_BREAKER_CONFIG));
    }
    const circuitBreaker = this.circuitBreakers.get(platformName)!;

    const config = buildDynamicPlatformConfig(platformName, this.platformsConfig, platformCreds);
    const methodConfig = getDynamicMethodConfig(platformName, method, this.platformsConfig);
    
    const operation = async () => {
      if (!methodConfig) {
        return await this.executeFallbackAction(platformName, method, parameters, config);
      }

      const url = buildDynamicURL(config.baseURL, methodConfig.endpoint, parameters, methodConfig.required_params);
      
      const requestOptions: RequestInit = {
        method: methodConfig.http_method.toUpperCase(),
        headers: config.headers,
        ...config,
      };

      if (['POST', 'PUT', 'PATCH'].includes(methodConfig.http_method.toUpperCase())) {
        requestOptions.body = JSON.stringify(parameters);
      }

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    };

    try {
      const result = await this.retryHandler.executeWithRetry(
        operation,
        `${platformName}.${method}`,
        circuitBreaker
      );
      
      if (action.output_variable) {
        this.context.variables[action.output_variable] = result;
      }

      globalErrorLogger.log('INFO', `✅ Action completed successfully`, {
        result
      }, step.id, this.context.automationId, this.context.runId);
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Action execution failed', {
        platformName,
        method,
        error: error.message,
        circuitBreakerState: circuitBreaker.getState()
      }, step.id, this.context.automationId, this.context.runId);
      throw error;
    }
  }

  private async executeFallbackAction(platformName: string, method: string, parameters: any, config: any): Promise<void> {
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
    globalErrorLogger.log('INFO', `✅ Fallback action completed`, { result }, undefined, this.context.automationId, this.context.runId);
  }

  private async executeCondition(step: any): Promise<void> {
    const { condition } = step;
    if (!condition) throw new Error('Condition configuration missing');

    try {
      const result = this.expressionParser.evaluateExpression(condition.expression, this.context.variables);

      globalErrorLogger.log('INFO', `🔍 Secure condition evaluation: ${condition.expression} = ${result}`, {
        expression: condition.expression,
        result,
        variables: this.context.variables,
        secureEvaluation: true
      }, step.id, this.context.automationId, this.context.runId);

      if (result && condition.if_true) {
        for (const subStep of condition.if_true) {
          await this.executeStep(subStep);
        }
      } else if (!result && condition.if_false) {
        for (const subStep of condition.if_false) {
          await this.executeStep(subStep);
        }
      }
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Secure condition evaluation failed', {
        expression: condition.expression,
        error: error.message,
        securityNote: 'Using secure AST-based evaluation'
      }, step.id, this.context.automationId, this.context.runId);
      throw error;
    }
  }

  private async executeLoop(step: any): Promise<void> {
    const { loop } = step;
    if (!loop) throw new Error('Loop configuration missing');

    const arrayData = this.resolveVariables(loop.array_source);
    if (!Array.isArray(arrayData)) {
      throw new Error('Loop array source is not an array');
    }

    globalErrorLogger.log('INFO', `🔄 Starting loop with ${arrayData.length} iterations`, {
      arrayLength: arrayData.length
    }, step.id, this.context.automationId, this.context.runId);

    for (let i = 0; i < arrayData.length; i++) {
      this.context.variables['loop_item'] = arrayData[i];
      this.context.variables['loop_index'] = i;

      globalErrorLogger.log('INFO', `🔄 Loop iteration ${i + 1}/${arrayData.length}`, {
        currentItem: arrayData[i]
      }, step.id, this.context.automationId, this.context.runId);

      for (const subStep of loop.steps) {
        await this.executeStep(subStep);
      }
    }
  }

  private async executeDelay(step: any): Promise<void> {
    const { delay } = step;
    if (!delay) throw new Error('Delay configuration missing');

    const seconds = delay.duration_seconds;
    globalErrorLogger.log('INFO', `⏱️ Delaying for ${seconds} seconds`, {
      duration: seconds
    }, step.id, this.context.automationId, this.context.runId);

    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  private async executeAIAgentCall(step: any): Promise<void> {
    const { ai_agent_call } = step;
    if (!ai_agent_call) throw new Error('AI agent call configuration missing');

    const agentId = ai_agent_call.agent_id;
    const inputPrompt = this.resolveVariables(ai_agent_call.input_prompt);

    globalErrorLogger.log('INFO', `🤖 Calling AI agent: ${agentId}`, {
      agentId,
      promptLength: inputPrompt.length
    }, step.id, this.context.automationId, this.context.runId);

    const { data: agent, error } = await supabase
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

    globalErrorLogger.log('INFO', `🤖 AI agent response stored`, {
      outputVariable: ai_agent_call.output_variable,
      responseLength: aiResponse.length
    }, step.id, this.context.automationId, this.context.runId);
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
    
    const logLevel = status === 'failed' ? 'ERROR' : 'INFO';
    globalErrorLogger.log(logLevel, `📝 Step log: ${message}`, {
      stepId,
      status,
      error,
      output
    }, stepId, this.context.automationId, this.context.runId);
  }

  private async updateRunProgress(): Promise<void> {
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
      globalErrorLogger.log('ERROR', 'Failed to update run progress', { error }, undefined, this.context.automationId, this.context.runId);
    }
  }
}
