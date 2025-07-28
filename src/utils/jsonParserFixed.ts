
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
  isPlainText: boolean;
}

export function parseYusrAIStructuredResponse(responseText: string): YusrAIParseResult {
  try {
    console.log('🔍 YusrAI Fixed Parser - Processing response:', responseText.substring(0, 200) + '...')
    
    let parsedResponse: any;
    let metadata: YusrAIResponseMetadata = {};
    let cleanResponseText = responseText;
    
    // Extract JSON from markdown code blocks
    const markdownJsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (markdownJsonMatch) {
      console.log('🎯 Markdown code block detected, extracting JSON...');
      cleanResponseText = markdownJsonMatch[1].trim();
      console.log('✅ Extracted JSON from markdown:', cleanResponseText.substring(0, 200) + '...');
    }
    
    // Try to parse the response
    try {
      parsedResponse = JSON.parse(cleanResponseText);
      if (typeof parsedResponse !== 'object' || parsedResponse === null) {
        throw new Error('Invalid JSON structure');
      }
    } catch (e) {
      console.log('📄 Plain text response detected, no JSON found')
      return { 
        structuredData: null, 
        metadata: { yusrai_powered: true }, 
        isPlainText: true 
      };
    }

    // Check if this is a wrapped response from chat-AI function
    if (parsedResponse.response && typeof parsedResponse.response === 'string') {
      console.log('🎯 Wrapped YusrAI response detected from chat-AI function')
      
      // Extract metadata from wrapper
      metadata.yusrai_powered = parsedResponse.yusrai_powered || true;
      metadata.seven_sections_validated = parsedResponse.seven_sections_validated || false;
      metadata.error_help_available = parsedResponse.error_help_available || false;
      
      // Parse the inner JSON response
      try {
        const innerResponse = JSON.parse(parsedResponse.response);
        console.log('✅ Successfully extracted inner YusrAI JSON from wrapper:', innerResponse);
        parsedResponse = innerResponse;
      } catch (innerError) {
        console.log('📄 Inner response is plain text, treating as such');
        return { 
          structuredData: null, 
          metadata, 
          isPlainText: true 
        };
      }
    } else {
      console.log('📄 Processing direct YusrAI JSON format')
      metadata.yusrai_powered = true;
    }

    // Check if this is a structured response with automation sections
    const hasStructuredSections = parsedResponse.error_handling || 
      parsedResponse.performance_optimization || 
      parsedResponse.summary ||
      (parsedResponse.step_by_step || parsedResponse.platforms_and_credentials || parsedResponse.ai_agents || parsedResponse.clarification_questions);

    if (!hasStructuredSections) {
      console.log('📄 Not a structured response, treating as plain text')
      return { 
        structuredData: null, 
        metadata, 
        isPlainText: true 
      };
    }

    console.log('🔍 Fixed parser - Processing structured sections...')
    
    // FIXED: Step processing
    if (parsedResponse.step_by_step) {
      if (Array.isArray(parsedResponse.step_by_step)) {
        parsedResponse.steps = parsedResponse.step_by_step.map((step: any) => {
          if (typeof step === 'string') return step;
          if (typeof step === 'object' && step.description) return step.description;
          if (typeof step === 'object' && step.action) return step.action;
          return JSON.stringify(step);
        });
      } else {
        parsedResponse.steps = [parsedResponse.step_by_step];
      }
      console.log('✅ Fixed step processing:', parsedResponse.steps);
    }

    // FIXED: Platform processing
    if (parsedResponse.platforms_and_credentials) {
      const platformsObj = parsedResponse.platforms_and_credentials;
      parsedResponse.platforms = Object.keys(platformsObj).map(platformName => {
        const platformData = platformsObj[platformName];
        return {
          name: platformName,
          credentials: Array.isArray(platformData.credentials) ? platformData.credentials : 
                      Array.isArray(platformData.required_credentials) ? platformData.required_credentials :
                      Array.isArray(platformData) ? platformData : []
        };
      });
      console.log('✅ Fixed platform processing:', parsedResponse.platforms);
    }

    // FIXED: AI Agents processing
    if (parsedResponse.ai_agents) {
      const agentsObj = parsedResponse.ai_agents;
      parsedResponse.agents = Object.keys(agentsObj).map(agentName => {
        const agentData = agentsObj[agentName];
        return {
          name: agentName,
          role: agentData.role || 'Custom',
          rule: agentData.rule || agentData.instructions || '',
          goal: agentData.goal || agentData.objective || '',
          memory: agentData.memory || '',
          why_needed: agentData.why_needed || agentData.purpose || '',
          custom_config: agentData.custom_config || {},
          test_scenarios: Array.isArray(agentData.test_scenarios) ? agentData.test_scenarios : []
        };
      });
      console.log('✅ Fixed agents processing:', parsedResponse.agents);
    }

    // FIXED: Clarification questions processing
    if (parsedResponse.clarification_questions) {
      if (Array.isArray(parsedResponse.clarification_questions)) {
        parsedResponse.clarification_questions = parsedResponse.clarification_questions.map((q: any) => {
          if (typeof q === 'string') return q;
          if (typeof q === 'object' && q.question) return q.question;
          return JSON.stringify(q);
        });
      }
      console.log('✅ Fixed questions processing:', parsedResponse.clarification_questions);
    }

    // TEST PAYLOADS MAPPING
    if (parsedResponse.platform_test_payloads && !parsedResponse.test_payloads) {
      parsedResponse.test_payloads = parsedResponse.platform_test_payloads;
      console.log('🧪 Mapped platform_test_payloads to test_payloads');
    }

    // EXECUTION BLUEPRINT MAPPING
    if (parsedResponse.blueprint && !parsedResponse.execution_blueprint) {
      parsedResponse.execution_blueprint = parsedResponse.blueprint;
      console.log('📋 Mapped blueprint to execution_blueprint');
    }

    // Ensure all arrays exist with defaults
    if (!parsedResponse.steps) parsedResponse.steps = [];
    if (!parsedResponse.platforms) parsedResponse.platforms = [];
    if (!parsedResponse.clarification_questions) parsedResponse.clarification_questions = [];
    if (!parsedResponse.agents) parsedResponse.agents = [];
    if (!parsedResponse.test_payloads) parsedResponse.test_payloads = {};
    if (!parsedResponse.execution_blueprint) parsedResponse.execution_blueprint = null;

    console.log('✅ YusrAI fixed structured response validation successful')
    metadata.seven_sections_validated = true;
    
    return { 
      structuredData: parsedResponse as YusrAIStructuredResponse, 
      metadata,
      isPlainText: false
    };

  } catch (error) {
    console.error('❌ Error parsing YusrAI structured response:', error);
    return { 
      structuredData: null, 
      metadata: { yusrai_powered: true }, 
      isPlainText: true 
    };
  }
}

export function cleanDisplayText(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'Processing YusrAI automation details...';
  }

  // For plain text responses, return as-is with basic formatting
  let cleanText = text.replace(/\s+/g, ' ').trim();
  
  // If it looks like JSON, try to extract readable parts
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[0]);
      if (jsonData.summary) {
        return jsonData.summary;
      }
    } catch (e) {
      // If JSON parsing fails, remove JSON blocks from display
      cleanText = text.replace(/\{[\s\S]*\}/g, '').trim();
    }
  }
  
  // If text is too short after cleaning, provide a default
  if (cleanText.length < 20) {
    return 'YusrAI has analyzed your request and provided a response.';
  }
  
  return cleanText;
}
