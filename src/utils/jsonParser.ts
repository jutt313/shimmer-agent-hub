
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
    console.log('🔍 YusrAI Parser - Processing response:', responseText.substring(0, 200) + '...')
    
    let parsedResponse: any;
    let metadata: YusrAIResponseMetadata = {};
    
    // First try to parse the response
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('📄 Plain text response detected, no JSON found')
        return { 
          structuredData: null, 
          metadata: { yusrai_powered: true }, 
          isPlainText: true 
        };
      }
      try {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        console.log('📄 Plain text response, JSON parsing failed')
        return { 
          structuredData: null, 
          metadata: { yusrai_powered: true }, 
          isPlainText: true 
        };
      }
    }

    // Check if this is a wrapped response from chat-AI function
    if (parsedResponse.response && typeof parsedResponse.response === 'string') {
      console.log('🎯 Wrapped YusrAI response detected from chat-AI function')
      
      // Extract metadata
      metadata.yusrai_powered = parsedResponse.yusrai_powered || true;
      metadata.seven_sections_validated = parsedResponse.seven_sections_validated || false;
      metadata.error_help_available = parsedResponse.error_help_available || false;
      
      // Try to parse the inner JSON response
      try {
        parsedResponse = JSON.parse(parsedResponse.response);
        console.log('✅ Successfully extracted inner YusrAI JSON from wrapper')
      } catch (innerError) {
        console.log('📄 Inner response is plain text, treating as such')
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

    // Check if this is a structured response (has multiple expected sections)
    const hasStructuredSections = parsedResponse.summary && 
      (parsedResponse.steps || parsedResponse.platforms || parsedResponse.agents);

    if (!hasStructuredSections) {
      console.log('📄 Not a structured response, treating as plain text')
      return { 
        structuredData: null, 
        metadata, 
        isPlainText: true 
      };
    }

    // Flexible validation - only validate what's present
    console.log('🔍 Validating structured sections...')
    
    // Basic validation for required structured format
    if (parsedResponse.summary && typeof parsedResponse.summary === 'string' && parsedResponse.summary.trim().length > 0) {
      console.log('✅ Summary section valid')
    } else if (parsedResponse.summary !== undefined) {
      console.log('⚠️ Summary section present but invalid format')
      return { structuredData: null, metadata, isPlainText: true };
    }

    // Validate steps if present
    if (parsedResponse.steps !== undefined) {
      if (!Array.isArray(parsedResponse.steps)) {
        console.log('⚠️ Steps must be array if present')
        return { structuredData: null, metadata, isPlainText: true };
      }
      console.log('✅ Steps section valid')
    }

    // Validate platforms if present
    if (parsedResponse.platforms !== undefined) {
      if (!Array.isArray(parsedResponse.platforms)) {
        console.log('⚠️ Platforms must be array if present')
        return { structuredData: null, metadata, isPlainText: true };
      }
      console.log('✅ Platforms section valid')
    }

    // Validate other optional sections
    if (parsedResponse.clarification_questions !== undefined && !Array.isArray(parsedResponse.clarification_questions)) {
      console.log('⚠️ Clarification questions must be array if present')
      return { structuredData: null, metadata, isPlainText: true };
    }

    if (parsedResponse.agents !== undefined && !Array.isArray(parsedResponse.agents)) {
      console.log('⚠️ Agents must be array if present')
      return { structuredData: null, metadata, isPlainText: true };
    }

    if (parsedResponse.test_payloads !== undefined && typeof parsedResponse.test_payloads !== 'object') {
      console.log('⚠️ Test payloads must be object if present')
      return { structuredData: null, metadata, isPlainText: true };
    }

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
