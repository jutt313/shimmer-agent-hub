
export type AutomationBlueprint = {
  version: string;
  description?: string;

  trigger: {
    type: 'manual' | 'scheduled' | 'webhook';
    cron_expression?: string; // For 'scheduled'
    webhook_endpoint?: string; // For 'webhook'
    webhook_secret?: string; // For 'webhook'
  };

  steps: Array<{
    id: string;
    name: string;
    type: 'action' | 'condition' | 'loop' | 'delay' | 'ai_agent_call';

    action?: {
      integration: string;
      method: string;
      parameters: Record<string, any>;
      platform_credential_id?: string;
    };

    condition?: {
      expression: string;
      if_true: AutomationBlueprint['steps'];
      if_false?: AutomationBlueprint['steps'];
    };

    loop?: {
      array_source: string;
      steps: AutomationBlueprint['steps'];
    };

    delay?: {
      duration_seconds: number;
    };

    ai_agent_call?: {
      agent_id: string;
      input_prompt: string;
      output_variable: string;
    };

    on_error?: 'continue' | 'stop' | 'retry';
  }>;

  variables?: Record<string, any>;
};
