
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
      (parsedResponse.steps || parsedResponse.platforms || parsedResponse.agents || parsedResponse.platforms_credentials);

    if (!hasStructuredSections) {
      console.log('📄 Not a structured response, treating as plain text')
      return { 
        structuredData: null, 
        metadata, 
        isPlainText: true 
      };
    }

    // Map database field names to frontend expected names
    console.log('🔍 Validating and mapping structured sections...')
    
    if (parsedResponse.step_by_step_explanation && !parsedResponse.steps) {
      parsedResponse.steps = Array.isArray(parsedResponse.step_by_step_explanation) 
        ? parsedResponse.step_by_step_explanation 
        : [parsedResponse.step_by_step_explanation];
      console.log('📋 Mapped step_by_step_explanation to steps:', parsedResponse.steps.length);
    }

    // Handle platforms_credentials mapping
    if (parsedResponse.platforms_credentials && !parsedResponse.platforms) {
      parsedResponse.platforms = Array.isArray(parsedResponse.platforms_credentials) 
        ? parsedResponse.platforms_credentials 
        : [parsedResponse.platforms_credentials];
      console.log('🔗 Mapped platforms_credentials to platforms:', parsedResponse.platforms.length);
    }

    // ENHANCED PLATFORM MAPPING - Fix platform names with better extraction
    if (parsedResponse.platforms_and_credentials && !parsedResponse.platforms) {
      parsedResponse.platforms = Array.isArray(parsedResponse.platforms_and_credentials) 
        ? parsedResponse.platforms_and_credentials 
        : [parsedResponse.platforms_and_credentials];
      console.log('🔗 Mapped platforms_and_credentials to platforms:', parsedResponse.platforms.length);
    }
    
    if (parsedResponse.platform_integrations && !parsedResponse.platforms) {
      parsedResponse.platforms = Array.isArray(parsedResponse.platform_integrations) 
        ? parsedResponse.platform_integrations 
        : [parsedResponse.platform_integrations];
      console.log('🔗 Mapped platform_integrations to platforms:', parsedResponse.platforms.length);
    }

    // PURE AI-DRIVEN PLATFORM NAME EXTRACTION - No hardcoded patterns
    if (parsedResponse.platforms && Array.isArray(parsedResponse.platforms)) {
      parsedResponse.platforms = parsedResponse.platforms.map((platform: any, index: number) => {
        // Extract platform name from AI response directly - no hardcoded patterns
        let platformName = platform.name || 
                          platform.platform_name || 
                          platform.platform || 
                          platform.service || 
                          platform.integration ||
                          platform.tool ||
                          platform.api_name ||
                          platform.service_name;
        
        // Clean up the platform name if it exists
        if (platformName && typeof platformName === 'string') {
          platformName = platformName.trim();
          
          // Only clean up obvious formatting issues, no pattern matching
          platformName = platformName.replace(/^(Platform|Service|API|Tool)[\s\d]*:?\s*/i, '');
          platformName = platformName.replace(/\s+(API|Service|Platform|Tool)$/i, '');
          
          // Capitalize first letter if needed
          if (platformName.length > 0) {
            platformName = platformName.charAt(0).toUpperCase() + platformName.slice(1);
          }
        }
        
        // If no name found, use a simple index-based fallback
        if (!platformName || platformName.length === 0) {
          platformName = `Platform ${index + 1}`;
        }
        
        console.log(`🔍 Processing platform ${index + 1}: extracted name "${platformName}"`);
        
        return {
          ...platform,
          name: platformName,
          credentials: platform.credentials || 
                      platform.required_credentials || 
                      platform.credential_requirements ||
                      platform.fields ||
                      []
        };
      });
      console.log('✅ AI-driven platform name extraction completed');
    }

    // AI AGENTS MAPPING
    if (parsedResponse.ai_agents_section?.agents && !parsedResponse.agents) {
      parsedResponse.agents = Array.isArray(parsedResponse.ai_agents_section.agents) 
        ? parsedResponse.ai_agents_section.agents 
        : [parsedResponse.ai_agents_section.agents];
      console.log('🤖 Mapped ai_agents_section.agents to agents:', parsedResponse.agents.length);
    }
    
    if (parsedResponse.ai_agents && !parsedResponse.agents) {
      parsedResponse.agents = Array.isArray(parsedResponse.ai_agents) 
        ? parsedResponse.ai_agents 
        : [parsedResponse.ai_agents];
      console.log('🤖 Mapped ai_agents to agents:', parsedResponse.agents.length);
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

    // Ensure all arrays exist
    if (!parsedResponse.steps) parsedResponse.steps = [];
    if (!parsedResponse.platforms) parsedResponse.platforms = [];
    if (!parsedResponse.clarification_questions) parsedResponse.clarification_questions = [];
    if (!parsedResponse.agents) parsedResponse.agents = [];
    if (!parsedResponse.test_payloads) parsedResponse.test_payloads = {};
    if (!parsedResponse.execution_blueprint) parsedResponse.execution_blueprint = null;

    console.log('✅ YusrAI structured response validation successful')
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

// Legacy support for backwards compatibility
export interface StructuredResponse extends YusrAIStructuredResponse {}

export const parseStructuredResponse = (responseText: string): YusrAIStructuredResponse | null => {
  const result = parseYusrAIStructuredResponse(responseText);
  return result.structuredData;
};
