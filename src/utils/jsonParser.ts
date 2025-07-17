
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

export function parseYusrAIStructuredResponse(responseText: string): YusrAIStructuredResponse | null {
  try {
    console.log('🔍 Parsing YusrAI structured response from text:', responseText.substring(0, 200));
    
    // First try to extract JSON from the response
    const jsonMatches = responseText.match(/\{[\s\S]*\}/g);
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed && (
            parsed.summary || 
            parsed.steps || 
            parsed.platforms || 
            parsed.clarification_questions || 
            parsed.agents || 
            parsed.test_payloads || 
            parsed.execution_blueprint
          )) {
            console.log('✅ Found YusrAI structured data in JSON:', parsed);
            return parsed;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // If no JSON found, try to extract structured information from text
    const structuredData: YusrAIStructuredResponse = {};

    // Extract summary from the beginning
    const sentences = responseText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      structuredData.summary = sentences.slice(0, 2).join('. ').trim() + '.';
    }

    // Extract steps from numbered lists
    const stepMatches = responseText.match(/(?:^|\n)\s*\d+\.\s*(.+?)(?=\n|$)/gm);
    if (stepMatches) {
      structuredData.steps = stepMatches.map(step => 
        step.replace(/^\s*\d+\.\s*/, '').trim()
      );
    }

    // Extract platforms mentioned in the text
    const platformMatches = responseText.match(/(?:platform|service|integration)[\s:]*([A-Za-z]+(?:\s+[A-Za-z]+)*)/gi);
    if (platformMatches) {
      const platforms = platformMatches
        .map(match => match.replace(/(?:platform|service|integration)[\s:]*/gi, '').trim())
        .filter(name => name.length > 2 && name.length < 20);
      
      if (platforms.length > 0) {
        structuredData.platforms = platforms.map(name => ({
          name: name,
          credentials: [
            {
              field: 'api_key',
              why_needed: `Required for ${name} integration`,
              link: `https://${name.toLowerCase().replace(/\s+/g, '')}.com/developers`
            }
          ]
        }));
      }
    }

    console.log('📊 Extracted YusrAI structured data:', structuredData);
    return Object.keys(structuredData).length > 0 ? structuredData : null;

  } catch (error) {
    console.error('❌ Error parsing YusrAI structured response:', error);
    return null;
  }
}

export function cleanDisplayText(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'Processing automation details...';
  }

  // Remove JSON blocks from display text
  let cleanText = text.replace(/\{[\s\S]*\}/g, '').trim();
  
  // Clean up extra whitespace
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  // If text is too short after cleaning, provide a default
  if (cleanText.length < 20) {
    return 'I\'m ready to help you create comprehensive automations with platform integrations.';
  }
  
  return cleanText;
}

// Legacy support for backwards compatibility
export interface StructuredResponse extends YusrAIStructuredResponse {}
export const parseStructuredResponse = parseYusrAIStructuredResponse;
