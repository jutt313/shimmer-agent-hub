
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
    type: 'action' | 'condition' | 'loop' | 'delay' | 'ai_agent_call' | 'retry' | 'fallback';

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

    retry?: {
      max_attempts: number;
      steps: AutomationBlueprint['steps'];
    };

    fallback?: {
      primary_steps: AutomationBlueprint['steps'];
      fallback_steps: AutomationBlueprint['steps'];
    };

    on_error?: 'continue' | 'stop' | 'retry';
  }>;

  variables?: Record<string, any>;
};

export type AutomationDiagramData = {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    sourcePosition?: string;
    targetPosition?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    type?: string;
    style?: Record<string, any>;
    label?: string;
    sourceHandle?: string;
    labelStyle?: Record<string, any>;
    labelBgStyle?: Record<string, any>;
  }>;
};
