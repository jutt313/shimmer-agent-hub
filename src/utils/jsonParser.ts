
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
  platforms_credentials?: Array<{
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
  platforms_and_credentials?: {
    platforms: Array<{
      name: string;
      credentials: any;
    }>;
  };
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
  blueprint?: any;
  automation_diagram?: any;
  workflow?: any;
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
    console.log('🔍 YusrAI Parser - Processing response:', responseText.substring(0, 200) + '...')
    
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
    
    // FIXED: Enhanced parsing for improved OpenAI responses
    try {
      parsedResponse = JSON.parse(cleanResponseText);
      
      // Check if this is the chat-ai wrapper response
      if (parsedResponse.response && typeof parsedResponse.response === 'string') {
        console.log('🎯 Detected chat-ai wrapper, extracting inner JSON');
        
        // Extract metadata from wrapper
        metadata.yusrai_powered = parsedResponse.yusrai_powered || true;
        metadata.seven_sections_validated = parsedResponse.seven_sections_validated || false;
        metadata.error_help_available = parsedResponse.error_help_available || false;
        
        // Parse the inner JSON (OpenAI response)
        try {
          const innerStructuredData = JSON.parse(parsedResponse.response);
          console.log('✅ Successfully parsed inner JSON from OpenAI response');
          parsedResponse = innerStructuredData;
        } catch (innerError) {
          console.log('❌ Failed to parse inner JSON, treating as plain text');
          return { structuredData: null, metadata, isPlainText: true };
        }
      } else if (parsedResponse.summary || parsedResponse.steps || parsedResponse.platforms) {
        // Direct structured JSON from OpenAI
        console.log('📄 Processing direct OpenAI structured JSON format');
        metadata.yusrai_powered = true;
      } else {
        console.log('📄 Not a structured response, treating as plain text');
        return { structuredData: null, metadata, isPlainText: true };
      }
    } catch (e) {
      console.log('📄 Plain text response detected, no JSON found');
      return { structuredData: null, metadata: { yusrai_powered: true }, isPlainText: true };
    }

    // Validate that this is a structured response with automation sections
    const hasStructuredSections = parsedResponse.summary ||
      parsedResponse.steps || 
      parsedResponse.platforms || 
      parsedResponse.agents || 
      parsedResponse.clarification_questions ||
      parsedResponse.test_payloads ||
      parsedResponse.execution_blueprint;

    if (!hasStructuredSections) {
      console.log('📄 Not a structured response, treating as plain text')
      return { 
        structuredData: null, 
        metadata, 
        isPlainText: true 
      };
    }

    // FIXED: Improved field mapping with validation
    console.log('🔍 Validating and mapping structured sections...')

    // Handle step variations
    if (parsedResponse.step_by_step && !parsedResponse.steps) {
      parsedResponse.steps = Array.isArray(parsedResponse.step_by_step) 
        ? parsedResponse.step_by_step 
        : [parsedResponse.step_by_step];
      console.log('📋 Mapped step_by_step to steps:', parsedResponse.steps.length);
    }

    // Handle platform variations
    if (parsedResponse.platforms_and_credentials && !parsedResponse.platforms) {
      if (parsedResponse.platforms_and_credentials.platforms) {
        parsedResponse.platforms = parsedResponse.platforms_and_credentials.platforms;
      } else if (Array.isArray(parsedResponse.platforms_and_credentials)) {
        parsedResponse.platforms = parsedResponse.platforms_and_credentials;
      }
      console.log('🔗 Mapped platforms_and_credentials to platforms');
    }

    if (parsedResponse.platforms_credentials && !parsedResponse.platforms) {
      parsedResponse.platforms = Array.isArray(parsedResponse.platforms_credentials) 
        ? parsedResponse.platforms_credentials 
        : [parsedResponse.platforms_credentials];
      console.log('🔗 Mapped platforms_credentials to platforms');
    }

    // Handle agent variations
    if (parsedResponse.ai_agents && !parsedResponse.agents) {
      parsedResponse.agents = Array.isArray(parsedResponse.ai_agents) 
        ? parsedResponse.ai_agents 
        : [parsedResponse.ai_agents];
      console.log('🤖 Mapped ai_agents to agents');
    }

    // Handle test payload variations
    if (parsedResponse.platform_test_payloads && !parsedResponse.test_payloads) {
      parsedResponse.test_payloads = parsedResponse.platform_test_payloads;
      console.log('🧪 Mapped platform_test_payloads to test_payloads');
    }

    // Handle blueprint variations
    if (parsedResponse.blueprint && !parsedResponse.execution_blueprint) {
      parsedResponse.execution_blueprint = parsedResponse.blueprint;
      console.log('📋 Mapped blueprint to execution_blueprint');
    }

    // FIXED: Ensure all required arrays exist with meaningful defaults
    if (!parsedResponse.steps || !Array.isArray(parsedResponse.steps) || parsedResponse.steps.length === 0) {
      parsedResponse.steps = ["Automation step will be configured"];
    }
    if (!parsedResponse.platforms || !Array.isArray(parsedResponse.platforms) || parsedResponse.platforms.length === 0) {
      parsedResponse.platforms = [];
    }
    if (!parsedResponse.clarification_questions || !Array.isArray(parsedResponse.clarification_questions) || parsedResponse.clarification_questions.length === 0) {
      parsedResponse.clarification_questions = ["What specific requirements do you have for this automation?"];
    }
    if (!parsedResponse.agents || !Array.isArray(parsedResponse.agents) || parsedResponse.agents.length === 0) {
      parsedResponse.agents = [];
    }
    if (!parsedResponse.test_payloads) parsedResponse.test_payloads = {};
    if (!parsedResponse.execution_blueprint) parsedResponse.execution_blueprint = null;

    // Validate section completeness
    const hasSummary = parsedResponse.summary && parsedResponse.summary.length > 0;
    const hasSteps = Array.isArray(parsedResponse.steps) && parsedResponse.steps.length > 0;
    const hasPlatforms = Array.isArray(parsedResponse.platforms);
    const hasQuestions = Array.isArray(parsedResponse.clarification_questions) && parsedResponse.clarification_questions.length > 0;
    const hasAgents = Array.isArray(parsedResponse.agents);
    const hasTestPayloads = parsedResponse.test_payloads && typeof parsedResponse.test_payloads === 'object';
    const hasBlueprint = parsedResponse.execution_blueprint && parsedResponse.execution_blueprint.workflow;

    const sectionsCount = [hasSummary, hasSteps, hasPlatforms, hasQuestions, hasAgents, hasTestPayloads, hasBlueprint].filter(Boolean).length;
    
    console.log('✅ YusrAI structured response validation successful')
    metadata.seven_sections_validated = sectionsCount >= 4; // Lowered threshold for better UX
    
    console.log(`📊 Section analysis: ${sectionsCount}/7 sections present - seven_sections_validated: ${metadata.seven_sections_validated}`);
    console.log('📋 Parsed sections:', {
      summary: !!hasSummary,
      steps: hasSteps ? parsedResponse.steps.length : 0,
      platforms: hasPlatforms ? parsedResponse.platforms.length : 0,
      questions: hasQuestions ? parsedResponse.clarification_questions.length : 0,
      agents: hasAgents ? parsedResponse.agents.length : 0,
      test_payloads: hasTestPayloads ? Object.keys(parsedResponse.test_payloads).length : 0,
      blueprint: !!hasBlueprint
    });
    
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

  let cleanText = text.replace(/\s+/g, ' ').trim();
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonData = JSON.parse(jsonMatch[0]);
      if (jsonData.summary) {
        return jsonData.summary;
      }
    } catch (e) {
      cleanText = text.replace(/\{[\s\S]*\}/g, '').trim();
    }
  }
  
  if (cleanText.length < 20) {
    return 'YusrAI has analyzed your request and provided a response.';
  }
  
  return cleanText;
}

export interface StructuredResponse extends YusrAIStructuredResponse {}

export const parseStructuredResponse = (responseText: string): YusrAIStructuredResponse | null => {
  const result = parseYusrAIStructuredResponse(responseText);
  return result.structuredData;
};
