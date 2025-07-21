
export interface YusrAIStructuredResponse {
  summary: string;
  steps: string[];
  platforms: Array<{
    name: string;
    credentials: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
    api_config?: {
      base_url: string;
      auth_type: string;
      auth_header_format: string;
      methods: Record<string, any>;
    };
  }>;
  agents: Array<{
    name: string;
    role: string;
    goal: string;
    rules: string;
    memory: string;
    why_needed: string;
  }>;
  clarification_questions: string[];
  test_payloads: Record<string, any>;
  execution_blueprint: {
    version: string;
    description: string;
    trigger: { type: string };
    workflow?: Array<{
      step: number;
      action: string;
      platform?: string;
      method?: string;
      endpoint?: string;
      description?: string;
      ai_agent_integration?: {
        agent_name: string;
      };
      error_handling?: {
        retry_attempts: number;
        fallback_action: string;
      };
    }>;
    steps: Array<{
      id: string;
      name: string;
      type: string;
      action?: any;
      ai_agent_call?: any;
    }>;
    variables: Record<string, any>;
    error_handling?: {
      retry_attempts: number;
      fallback_actions: string[];
      critical_failure_actions: string[];
    };
    performance_optimization?: {
      rate_limit_handling: string;
      concurrency_limit: number;
      timeout_seconds_per_step: number;
    };
  };
}

export interface ParseResult {
  structuredData: YusrAIStructuredResponse | null;
  metadata: {
    yusrai_powered: boolean;
    seven_sections_validated: boolean;
    has_json_structure: boolean;
    parsing_errors: string[];
  };
}

export function parseYusrAIStructuredResponse(text: string): ParseResult {
  const result: ParseResult = {
    structuredData: null,
    metadata: {
      yusrai_powered: false,
      seven_sections_validated: false,
      has_json_structure: false,
      parsing_errors: []
    }
  };

  if (!text || typeof text !== 'string') {
    result.metadata.parsing_errors.push('Invalid input text');
    return result;
  }

  console.log('🔍 Parsing YusrAI response for structured data...');

  try {
    // Extract JSON from markdown code blocks
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    
    if (!jsonMatch) {
      console.log('❌ No JSON block found in response');
      result.metadata.parsing_errors.push('No JSON block found');
      return result;
    }

    result.metadata.has_json_structure = true;
    
    const jsonString = jsonMatch[1].trim();
    console.log('📝 Extracted JSON string:', jsonString.substring(0, 200) + '...');

    const parsedData = JSON.parse(jsonString);
    console.log('✅ Successfully parsed JSON data');

    // Validate required YusrAI 7-section structure
    const requiredSections = ['summary', 'steps', 'platforms', 'agents', 'clarification_questions'];
    const validationErrors: string[] = [];

    // Check for required sections
    for (const section of requiredSections) {
      if (!parsedData[section]) {
        validationErrors.push(`Missing required section: ${section}`);
      }
    }

    // Validate summary
    if (!parsedData.summary || typeof parsedData.summary !== 'string' || parsedData.summary.length < 15) {
      validationErrors.push('Invalid summary: must be descriptive string with 15+ characters');
    }

    // Validate steps
    if (!Array.isArray(parsedData.steps) || parsedData.steps.length < 3) {
      validationErrors.push('Invalid steps: must be array with at least 3 items');
    }

    // Validate platforms
    if (!Array.isArray(parsedData.platforms) || parsedData.platforms.length === 0) {
      validationErrors.push('Invalid platforms: must be array with at least 1 platform');
    } else {
      parsedData.platforms.forEach((platform: any, index: number) => {
        if (!platform.name || !platform.credentials || !Array.isArray(platform.credentials)) {
          validationErrors.push(`Invalid platform ${index}: missing name or credentials`);
        }
      });
    }

    // Validate agents
    if (!Array.isArray(parsedData.agents) || parsedData.agents.length === 0) {
      validationErrors.push('Invalid agents: must be array with at least 1 agent');
    } else {
      parsedData.agents.forEach((agent: any, index: number) => {
        if (!agent.name || !agent.role || !agent.goal || !agent.rules) {
          validationErrors.push(`Invalid agent ${index}: missing required fields`);
        }
      });
    }

    // Set flags based on validation
    result.metadata.yusrai_powered = validationErrors.length === 0;
    result.metadata.seven_sections_validated = validationErrors.length === 0 && 
      parsedData.test_payloads && 
      parsedData.execution_blueprint;

    if (validationErrors.length > 0) {
      result.metadata.parsing_errors = validationErrors;
      console.log('⚠️ Validation errors:', validationErrors);
    } else {
      console.log('✅ All 7 YusrAI sections validated successfully');
    }

    // Create structured response object with enhanced execution blueprint
    const executionBlueprint = parsedData.execution_blueprint || {
      version: '1.0.0',
      description: parsedData.summary || 'YusrAI Automation',
      trigger: { type: 'manual' },
      steps: [],
      variables: {}
    };

    // Add missing properties with defaults
    if (!executionBlueprint.workflow) {
      executionBlueprint.workflow = parsedData.steps?.map((step: string, index: number) => ({
        step: index + 1,
        action: step,
        description: step
      })) || [];
    }

    if (!executionBlueprint.error_handling) {
      executionBlueprint.error_handling = {
        retry_attempts: 3,
        fallback_actions: ['log and continue'],
        critical_failure_actions: ['stop execution and notify user']
      };
    }

    if (!executionBlueprint.performance_optimization) {
      executionBlueprint.performance_optimization = {
        rate_limit_handling: 'Automatic rate limit detection',
        concurrency_limit: 5,
        timeout_seconds_per_step: 30
      };
    }

    result.structuredData = {
      summary: parsedData.summary || '',
      steps: parsedData.steps || [],
      platforms: parsedData.platforms || [],
      agents: parsedData.agents || [],
      clarification_questions: parsedData.clarification_questions || [],
      test_payloads: parsedData.test_payloads || {},
      execution_blueprint: executionBlueprint
    };

    console.log('🎯 Final parsing result:', {
      yusraiPowered: result.metadata.yusrai_powered,
      sevenSectionsValidated: result.metadata.seven_sections_validated,
      sectionsFound: {
        summary: !!result.structuredData.summary,
        steps: result.structuredData.steps.length,
        platforms: result.structuredData.platforms.length,
        agents: result.structuredData.agents.length,
        clarificationQuestions: result.structuredData.clarification_questions.length,
        testPayloads: Object.keys(result.structuredData.test_payloads).length,
        executionBlueprint: !!result.structuredData.execution_blueprint
      }
    });

    return result;

  } catch (error: any) {
    console.error('💥 JSON parsing error:', error);
    result.metadata.parsing_errors.push(`JSON parsing error: ${error.message}`);
    return result;
  }
}

export function cleanDisplayText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove JSON code blocks from display text
  const cleanedText = text.replace(/```json\n[\s\S]*?\n```/g, '');
  
  // Clean up excessive whitespace
  return cleanedText
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();
}
