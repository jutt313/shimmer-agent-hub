
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

export interface YusrAIResponseMetadata {
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
  error_help_available?: boolean;
}

export interface YusrAIParseResult {
  structuredData: YusrAIStructuredResponse | null;
  metadata: YusrAIResponseMetadata;
}

export function parseYusrAIStructuredResponse(responseText: string): YusrAIParseResult {
  try {
    console.log('🔍 Parsing YusrAI response - checking format');
    
    let parsedResponse: any;
    let metadata: YusrAIResponseMetadata = {};
    
    // First try to parse the response
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in YusrAI response');
        return { structuredData: null, metadata };
      }
      parsedResponse = JSON.parse(jsonMatch[0]);
    }

    // Check if this is a wrapped response from chat-AI function
    if (parsedResponse.response && typeof parsedResponse.response === 'string') {
      console.log('🎯 Detected wrapped YusrAI response format from chat-AI function');
      
      // Extract metadata
      metadata.yusrai_powered = parsedResponse.yusrai_powered || false;
      metadata.seven_sections_validated = parsedResponse.seven_sections_validated || false;
      metadata.error_help_available = parsedResponse.error_help_available || false;
      
      // Parse the inner JSON response
      try {
        parsedResponse = JSON.parse(parsedResponse.response);
        console.log('✅ Successfully extracted inner YusrAI JSON from wrapper');
      } catch (innerError) {
        console.error('❌ Failed to parse inner YusrAI JSON:', innerError);
        return { structuredData: null, metadata };
      }
    } else {
      console.log('📄 Processing direct YusrAI JSON format');
      // For direct responses, assume they are YusrAI powered
      metadata.yusrai_powered = true;
    }

    // Validate all 7 mandatory sections
    const requiredSections = ['summary', 'steps', 'platforms', 'clarification_questions', 'agents', 'test_payloads', 'execution_blueprint'];
    const missing = requiredSections.filter(section => !parsedResponse[section]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required YusrAI sections: ${missing.join(', ')}`);
      return { structuredData: null, metadata };
    }

    // Detailed validation
    if (!parsedResponse.summary || parsedResponse.summary.trim().length < 20) {
      console.error('❌ Summary section invalid - must be 2-3 lines');
      return { structuredData: null, metadata };
    }
    
    if (!Array.isArray(parsedResponse.steps) || parsedResponse.steps.length < 3) {
      console.error('❌ Steps must be array with at least 3 detailed steps');
      return { structuredData: null, metadata };
    }
    
    if (!Array.isArray(parsedResponse.platforms)) {
      console.error('❌ Platforms must be array');
      return { structuredData: null, metadata };
    }
    
    if (!Array.isArray(parsedResponse.clarification_questions)) {
      console.error('❌ Clarification questions must be array');
      return { structuredData: null, metadata };
    }
    
    if (!Array.isArray(parsedResponse.agents)) {
      console.error('❌ Agents must be array');
      return { structuredData: null, metadata };
    }
    
    if (typeof parsedResponse.test_payloads !== 'object') {
      console.error('❌ Test payloads must be object');
      return { structuredData: null, metadata };
    }
    
    if (!parsedResponse.execution_blueprint || !parsedResponse.execution_blueprint.trigger || !Array.isArray(parsedResponse.execution_blueprint.workflow)) {
      console.error('❌ Execution blueprint must have trigger and workflow array');
      return { structuredData: null, metadata };
    }

    console.log('✅ YusrAI 7-section validation successful');
    metadata.seven_sections_validated = true;
    
    return { 
      structuredData: parsedResponse as YusrAIStructuredResponse, 
      metadata 
    };

  } catch (error) {
    console.error('❌ Error parsing YusrAI structured response:', error);
    return { structuredData: null, metadata: {} };
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
export const parseStructuredResponse = (responseText: string): YusrAIStructuredResponse | null => {
  const result = parseYusrAIStructuredResponse(responseText);
  return result.structuredData;
};
