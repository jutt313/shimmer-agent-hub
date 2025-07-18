
export interface YusrAIStructuredResponse {
  summary: string;
  steps: string[];
  platforms: Array<{
    name: string;
    credentials: Array<{
      field: string;
      why_needed: string;
      where_to_get?: string;
      link?: string;
      options?: string[];
      example?: string;
    }>;
  }>;
  clarification_questions: string[];
  agents: Array<{
    name: string;
    role: 'Decision Maker' | 'Data Processor' | 'Monitor' | 'Validator' | 'Responder' | 'Custom';
    rule: string;
    goal: string;
    memory: string;
    why_needed: string;
    custom_config?: any;
    test_scenarios: string[];
  }>;
  test_payloads: {
    [platform_name: string]: {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      endpoint: string;
      headers: Record<string, string>;
      body?: any;
      expected_response: Record<string, any>;
      error_patterns: Record<string, string>;
    };
  };
  execution_blueprint: {
    trigger: {
      type: 'webhook' | 'schedule' | 'manual' | 'event';
      configuration: any;
    };
    workflow: Array<{
      step: number;
      action: string;
      platform: string;
      method?: string;
      endpoint?: string;
      headers?: Record<string, string>;
      data_mapping?: Record<string, string>;
      success_condition?: string;
      error_handling?: {
        retry_attempts: number;
        fallback_action: string;
        on_failure: string;
      };
      next_step?: number;
      ai_agent_integration?: {
        agent_name: string;
        input_data: Record<string, any>;
        output_mapping: Record<string, any>;
      };
      description?: string;
    }>;
    error_handling: {
      retry_attempts: number;
      fallback_actions: string[];
      notification_rules: Array<any>;
      critical_failure_actions: string[];
    };
    performance_optimization: {
      rate_limit_handling: string;
      concurrency_limit: number;
      timeout_seconds_per_step: number;
    };
  };
}

export function parseYusrAIStructuredResponse(responseText: string): YusrAIStructuredResponse | null {
  try {
    console.log('🔍 Parsing YusrAI 7-section response');
    
    // First try direct JSON parse
    let parsed: YusrAIStructuredResponse;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in YusrAI response');
        return null;
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    // Validate all 7 mandatory sections
    const requiredSections = ['summary', 'steps', 'platforms', 'clarification_questions', 'agents', 'test_payloads', 'execution_blueprint'];
    const missing = requiredSections.filter(section => !parsed[section]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required YusrAI sections: ${missing.join(', ')}`);
      return null;
    }

    // Ensure proper structure
    if (!Array.isArray(parsed.steps) || parsed.steps.length < 3) {
      console.error('❌ Steps must be array with at least 3 items');
      return null;
    }

    if (!Array.isArray(parsed.platforms)) {
      console.error('❌ Platforms must be array');
      return null;
    }

    if (!Array.isArray(parsed.clarification_questions)) {
      console.error('❌ Clarification questions must be array');
      return null;
    }

    if (!Array.isArray(parsed.agents)) {
      console.error('❌ Agents must be array');
      return null;
    }

    if (typeof parsed.test_payloads !== 'object') {
      console.error('❌ Test payloads must be object');
      return null;
    }

    if (!parsed.execution_blueprint || !parsed.execution_blueprint.trigger || !Array.isArray(parsed.execution_blueprint.workflow)) {
      console.error('❌ Execution blueprint must have trigger and workflow array');
      return null;
    }

    console.log('✅ YusrAI 7-section validation successful');
    return parsed;

  } catch (error) {
    console.error('❌ Error parsing YusrAI structured response:', error);
    return null;
  }
}

export function cleanDisplayText(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'Processing YusrAI automation details...';
  }

  // Remove JSON blocks from display text
  let cleanText = text.replace(/\{[\s\S]*\}/g, '').trim();
  
  // Clean up extra whitespace
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  // If text is too short after cleaning, provide a default
  if (cleanText.length < 20) {
    return 'YusrAI has analyzed your request and created a comprehensive automation blueprint.';
  }
  
  return cleanText;
}

// Legacy support for backwards compatibility
export interface StructuredResponse extends YusrAIStructuredResponse {}
export const parseStructuredResponse = parseYusrAIStructuredResponse;
