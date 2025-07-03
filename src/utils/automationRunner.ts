
import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';

export interface AutomationExecutionResult {
  success: boolean;
  executionId: string;
  duration: number;
  results: any[];
  errors: string[];
}

export class AutomationRunner {
  private executionId: string;
  private startTime: number;
  private results: any[] = [];
  private errors: string[] = [];

  constructor() {
    this.executionId = crypto.randomUUID();
    this.startTime = Date.now();
  }

  async executeAutomation(
    automationId: string,
    blueprint: AutomationBlueprint,
    triggerData?: any
  ): Promise<AutomationExecutionResult> {
    console.log(`🚀 Starting automation execution: ${automationId}`);
    
    try {
      // Log the automation run start
      await this.logAutomationRun(automationId, 'running', triggerData);

      // Execute each step in the blueprint
      for (const step of blueprint.steps || []) {
        try {
          const stepResult = await this.executeStep(step, triggerData);
          this.results.push(stepResult);
          console.log(`✅ Step completed: ${step.id}`, stepResult);
        } catch (stepError: any) {
          const errorMessage = `Step ${step.id} failed: ${stepError.message}`;
          this.errors.push(errorMessage);
          console.error(`❌ Step failed: ${step.id}`, stepError);
          
          // Continue or stop based on step configuration
          if (step.stopOnError !== false) {
            break;
          }
        }
      }

      const duration = Date.now() - this.startTime;
      const success = this.errors.length === 0;
      const status = success ? 'completed' : 'failed';

      // Log the final result
      await this.logAutomationRun(automationId, status, triggerData, duration);

      return {
        success,
        executionId: this.executionId,
        duration,
        results: this.results,
        errors: this.errors
      };

    } catch (error: any) {
      const duration = Date.now() - this.startTime;
      this.errors.push(`Automation execution failed: ${error.message}`);
      
      await this.logAutomationRun(automationId, 'failed', triggerData, duration);
      
      return {
        success: false,
        executionId: this.executionId,
        duration,
        results: this.results,
        errors: this.errors
      };
    }
  }

  private async executeStep(step: any, context: any): Promise<any> {
    switch (step.type) {
      case 'api_call':
        return await this.executeApiCall(step, context);
      case 'ai_agent':
        return await this.executeAiAgent(step, context);
      case 'webhook':
        return await this.executeWebhook(step, context);
      case 'delay':
        return await this.executeDelay(step);
      case 'condition':
        return await this.executeCondition(step, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeApiCall(step: any, context: any): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = step.config;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeAiAgent(step: any, context: any): Promise<any> {
    // Call the AI agent via edge function
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: {
        message: step.config.prompt || 'Process the automation step',
        context: context
      }
    });

    if (error) {
      throw new Error(`AI agent failed: ${error.message}`);
    }

    return data;
  }

  private async executeWebhook(step: any, context: any): Promise<any> {
    const { url, method = 'POST', headers = {}, payload } = step.config;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload || context)
    });

    return {
      status: response.status,
      success: response.ok,
      response: response.ok ? await response.json() : await response.text()
    };
  }

  private async executeDelay(step: any): Promise<any> {
    const delay = step.config.duration || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { delayed: delay };
  }

  private async executeCondition(step: any, context: any): Promise<any> {
    // Simple condition evaluation
    const { condition, trueStep, falseStep } = step.config;
    
    // This is a simplified condition evaluator
    // In production, you'd want a more robust expression parser
    const result = this.evaluateCondition(condition, context);
    
    if (result && trueStep) {
      return await this.executeStep(trueStep, context);
    } else if (!result && falseStep) {
      return await this.executeStep(falseStep, context);
    }
    
    return { conditionResult: result };
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // Very basic condition evaluation
    // In production, use a proper expression parser
    try {
      // Replace context variables
      let evaluatedCondition = condition;
      Object.keys(context).forEach(key => {
        evaluatedCondition = evaluatedCondition.replace(
          new RegExp(`\\$\\{${key}\\}`, 'g'),
          JSON.stringify(context[key])
        );
      });
      
      // This is unsafe in production - use a proper expression evaluator
      return new Function('return ' + evaluatedCondition)();
    } catch {
      return false;
    }
  }

  private async logAutomationRun(
    automationId: string,
    status: string,
    triggerData?: any,
    duration?: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('automation_runs').upsert({
        id: this.executionId,
        automation_id: automationId,
        user_id: user?.id,
        status,
        trigger_data: triggerData || {},
        duration_ms: duration,
        details_log: {
          results: this.results,
          errors: this.errors,
          execution_time: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log automation run:', error);
    }
  }
}

// Export singleton for easy use
export const automationRunner = new AutomationRunner();
