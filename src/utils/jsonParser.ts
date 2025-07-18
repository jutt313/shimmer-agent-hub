
export interface YusrAIStructuredResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
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
  clarification_questions?: string[];
  agents?: Array<{
    name: string;
    role: string;
    rule: string;
    goal: string;
    memory: string;
    why_needed: string;
    custom_config?: any;
    test_scenarios?: string[];
  }>;
  test_payloads?: {
    [platform_name: string]: {
      method: string;
      endpoint: string;
      headers: Record<string, string>;
      body?: any;
      expected_response: Record<string, any>;
      error_patterns: Record<string, string>;
    };
  };
  execution_blueprint?: {
    trigger: {
      type: string;
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

// Strict validation function for 7-section structure
function validateYusrAI7Sections(data: any): { isValid: boolean; missing: string[] } {
  const required7Sections = [
    'summary',
    'steps',
    'platforms', 
    'clarification_questions',
    'agents',
    'test_payloads',
    'execution_blueprint'
  ];
  
  const missing: string[] = [];
  
  for (const section of required7Sections) {
    if (!data[section]) {
      missing.push(section);
      continue;
    }
    
    // Validate specific section requirements
    if (section === 'steps' && (!Array.isArray(data[section]) || data[section].length === 0)) {
      missing.push(`${section} (must be non-empty array)`);
    }
    if (section === 'platforms' && (!Array.isArray(data[section]) || data[section].length === 0)) {
      missing.push(`${section} (must be non-empty array)`);
    }
    if (section === 'clarification_questions' && !Array.isArray(data[section])) {
      missing.push(`${section} (must be array)`);
    }
    if (section === 'agents' && !Array.isArray(data[section])) {
      missing.push(`${section} (must be array)`);
    }
    if (section === 'test_payloads' && typeof data[section] !== 'object') {
      missing.push(`${section} (must be object)`);
    }
    if (section === 'execution_blueprint') {
      if (!data[section].trigger || !data[section].workflow || !data[section].error_handling) {
        missing.push(`${section} (must have trigger, workflow, and error_handling)`);
      }
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
}

export function parseYusrAIStructuredResponse(responseText: string): YusrAIStructuredResponse | null {
  try {
    console.log('🔍 Parsing YusrAI structured response from text:', responseText.substring(0, 200));
    
    // First try to parse the entire response as JSON
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (directParseError) {
      // Try to extract JSON from the response text
      const jsonMatches = responseText.match(/\{[\s\S]*\}/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            parsedData = JSON.parse(match);
            break;
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (!parsedData) {
      console.error('❌ No valid JSON found in response');
      return null;
    }

    // STRICT: Validate 7-section structure
    const validation = validateYusrAI7Sections(parsedData);
    
    if (!validation.isValid) {
      console.error('❌ YusrAI response missing required sections:', validation.missing);
      return null; // Reject incomplete responses
    }

    console.log('✅ Found complete YusrAI 7-section structured data:', {
      hasSummary: !!parsedData.summary,
      stepsCount: parsedData.steps?.length || 0,
      platformsCount: parsedData.platforms?.length || 0,
      questionsCount: parsedData.clarification_questions?.length || 0,
      agentsCount: parsedData.agents?.length || 0,
      hasTestPayloads: !!parsedData.test_payloads,
      hasExecutionBlueprint: !!parsedData.execution_blueprint
    });

    return parsedData;

  } catch (error) {
    console.error('❌ Error parsing YusrAI structured response:', error);
    return null;
  }
}

export function cleanDisplayText(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'Processing automation details...';
  }

  // For YusrAI responses, we expect structured JSON, so clean display is minimal
  let cleanText = text.replace(/\{[\s\S]*\}/g, '').trim();
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  if (cleanText.length < 20) {
    return 'YusrAI automation blueprint generated successfully.';
  }
  
  return cleanText;
}

// Legacy support for backwards compatibility
export interface StructuredResponse extends YusrAIStructuredResponse {}
export const parseStructuredResponse = parseYusrAIStructuredResponse;
