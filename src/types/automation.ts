export type AutomationBlueprint = {
  version: string;
  description?: string;

  trigger: {
    type: 'manual' | 'scheduled' | 'webhook' | 'platform'; // Added 'platform' for explicit platform triggers
    cron_expression?: string; // For 'scheduled'
    webhook_endpoint?: string; // For 'webhook'
    webhook_secret?: string; // For 'webhook'
    platform?: string; // For 'platform' triggers
    integration?: string; // Alias for platform
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

    // MODIFIED: 'condition' now supports multiple 'cases' with labels and steps
    condition?: {
      expression?: string; // General expression for condition, if any
      cases: Array<{
        label: string; // The label for this specific branch (e.g., "Email is Gmail/Yahoo")
        expression: string; // The specific condition expression for this case
        steps: AutomationBlueprint['steps']; // Steps for this branch
      }>;
      default_steps?: AutomationBlueprint['steps']; // Optional steps if no cases match
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
      is_recommended?: boolean;
    };

    retry?: {
      max_attempts: number;
      steps: AutomationBlueprint['steps']; // Steps to retry
      on_retry_fail_steps?: AutomationBlueprint['steps']; // NEW: Steps to execute if all retries fail
    };

    fallback?: {
      primary_steps: AutomationBlueprint['steps'];
      fallback_steps: AutomationBlueprint['steps'];
    };

    on_error?: 'continue' | 'stop' | 'retry';
    ai_recommended?: boolean; // For marking AI-recommended steps
  }>;

  variables?: Record<string, any>;
};

export type AutomationDiagramData = {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>; // Contains label, explanation, icon, and specific step details
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
    label?: string; // Label for the edge (e.g., "True", "Email is Gmail")
    sourceHandle?: string; // Connects to specific handle on source node
    labelStyle?: Record<string, any>;
    labelBgStyle?: Record<string, any>;
  }>;
};