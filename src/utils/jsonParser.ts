
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
      (parsedResponse.steps || parsedResponse.platforms || parsedResponse.agents || parsedResponse.platforms_credentials || parsedResponse.platforms_and_credentials);

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
    
    // FIXED STEP MAPPING - Prevent duplication and get clean text
    if (parsedResponse.step_by_step && !parsedResponse.steps) {
      const stepsArray = Array.isArray(parsedResponse.step_by_step) 
        ? parsedResponse.step_by_step 
        : [parsedResponse.step_by_step];
      
      // Convert objects to readable strings WITHOUT adding extra numbering
      parsedResponse.steps = stepsArray.map((step: any) => {
        if (typeof step === 'string') {
          // Remove any existing numbering prefix to prevent duplication
          return step.replace(/^\d+\.\s*/, '').trim();
        }
        if (typeof step === 'object' && step !== null) {
          // Extract readable text from step object
          const stepText = step.description || 
                 step.action || 
                 step.step || 
                 step.instruction || 
                 step.text ||
                 step.summary ||
                 JSON.stringify(step, null, 2); // Fallback to formatted JSON
          
          // Remove any existing numbering prefix
          return typeof stepText === 'string' ? stepText.replace(/^\d+\.\s*/, '').trim() : stepText;
        }
        return 'Processing step...';
      });
      
      console.log('📋 Fixed step_by_step mapping preventing duplication:', parsedResponse.steps.length);
    }
    
    if (parsedResponse.step_by_step_explanation && !parsedResponse.steps) {
      const stepsArray = Array.isArray(parsedResponse.step_by_step_explanation) 
        ? parsedResponse.step_by_step_explanation 
        : [parsedResponse.step_by_step_explanation];
      
      // Convert objects to readable strings WITHOUT adding extra numbering
      parsedResponse.steps = stepsArray.map((step: any) => {
        if (typeof step === 'string') {
          return step.replace(/^\d+\.\s*/, '').trim();
        }
        if (typeof step === 'object' && step !== null) {
          const stepText = step.description || 
                 step.action || 
                 step.step || 
                 step.instruction ||
                 step.text ||
                 JSON.stringify(step, null, 2);
          return typeof stepText === 'string' ? stepText.replace(/^\d+\.\s*/, '').trim() : stepText;
        }
        return 'Processing step...';
      });
      
      console.log('📋 Fixed step_by_step_explanation mapping preventing duplication:', parsedResponse.steps.length);
    }

    // FIXED PLATFORMS_AND_CREDENTIALS MAPPING - Handle nested structure properly
    if (parsedResponse.platforms_and_credentials && !parsedResponse.platforms) {
      console.log('🔗 Processing platforms_and_credentials with nested structure...');
      
      // Handle nested structure: platforms_and_credentials.platforms
      if (parsedResponse.platforms_and_credentials.platforms && Array.isArray(parsedResponse.platforms_and_credentials.platforms)) {
        const platformsArray = parsedResponse.platforms_and_credentials.platforms.map((platform: any) => {
          console.log(`🔍 Processing nested platform:`, platform);
          
          let credentials = [];
          if (platform.credentials) {
            if (Array.isArray(platform.credentials)) {
              credentials = platform.credentials;
            } else if (typeof platform.credentials === 'object') {
              // Transform credential object (like {api_key: {description, link}}) to array format
              credentials = Object.entries(platform.credentials).map(([key, value]: [string, any]) => ({
                field: key,
                why_needed: value.description || value.why_needed || `Required for ${key}`,
                where_to_get: value.where_to_get || value.link || `Get ${key} credentials`,
                link: value.link || value.url || '#',
                example: value.example || value.placeholder || `Enter your ${key}`
              }));
            }
          }
          
          return {
            name: platform.name || 'Unknown Platform',
            credentials: credentials
          };
        });
        
        parsedResponse.platforms = platformsArray;
        console.log('✅ Fixed platforms_and_credentials nested structure with full names:', parsedResponse.platforms.length, 'platforms');
      } 
      // Handle object format: platforms_and_credentials as direct object
      else if (typeof parsedResponse.platforms_and_credentials === 'object' && !Array.isArray(parsedResponse.platforms_and_credentials)) {
        const platformsArray = Object.keys(parsedResponse.platforms_and_credentials).map(platformKey => {
          const platformData = parsedResponse.platforms_and_credentials[platformKey];
          console.log(`🔍 Processing platform: ${platformKey}`, platformData);
          
          return {
            name: platformKey, // Use the complete object key as platform name
            credentials: Array.isArray(platformData.credentials) 
              ? platformData.credentials 
              : Array.isArray(platformData.required_credentials)
              ? platformData.required_credentials
              : Array.isArray(platformData.credential_requirements)
              ? platformData.credential_requirements
              : []
          };
        });
        
        parsedResponse.platforms = platformsArray;
        console.log('✅ Fixed platforms_and_credentials object to array with full names:', parsedResponse.platforms.length, 'platforms');
      } else if (Array.isArray(parsedResponse.platforms_and_credentials)) {
        parsedResponse.platforms = parsedResponse.platforms_and_credentials;
        console.log('✅ Used platforms_and_credentials array as-is:', parsedResponse.platforms.length, 'platforms');
      }
    }

    // Handle platforms_credentials mapping
    if (parsedResponse.platforms_credentials && !parsedResponse.platforms) {
      parsedResponse.platforms = Array.isArray(parsedResponse.platforms_credentials) 
        ? parsedResponse.platforms_credentials 
        : [parsedResponse.platforms_credentials];
      console.log('🔗 Mapped platforms_credentials to platforms:', parsedResponse.platforms.length);
    }

    // FIXED PLATFORM MAPPING - Ensure full platform names are preserved
    if (parsedResponse.platform_integrations && !parsedResponse.platforms) {
      parsedResponse.platforms = Array.isArray(parsedResponse.platform_integrations) 
        ? parsedResponse.platform_integrations 
        : [parsedResponse.platform_integrations];
      console.log('🔗 Mapped platform_integrations to platforms:', parsedResponse.platforms.length);
    }

    // FIXED PLATFORM NAME EXTRACTION - Keep full platform names
    if (parsedResponse.platforms && Array.isArray(parsedResponse.platforms)) {
      parsedResponse.platforms = parsedResponse.platforms.map((platform: any, index: number) => {
        // Extract platform name from AI response - KEEP FULL NAME
        let platformName = platform.name || 
                          platform.platform_name || 
                          platform.platform || 
                          platform.service || 
                          platform.integration ||
                          platform.tool ||
                          platform.api_name ||
                          platform.service_name;
        
        // Clean up the platform name if it exists - DON'T TRUNCATE
        if (platformName && typeof platformName === 'string') {
          platformName = platformName.trim(); // Only trim whitespace, keep full name
          
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
        
        console.log(`🔍 Processing platform ${index + 1}: extracted FULL name "${platformName}"`);
        
        return {
          ...platform,
          name: platformName, // FIXED: Full platform name preserved
          credentials: platform.credentials || 
                      platform.required_credentials || 
                      platform.credential_requirements ||
                      platform.fields ||
                      []
        };
      });
      console.log('✅ Fixed platform name extraction with full names preserved');
    }

    // ENHANCED CLARIFICATION_QUESTIONS MAPPING - Convert objects to strings
    if (parsedResponse.clarification_questions && Array.isArray(parsedResponse.clarification_questions)) {
      parsedResponse.clarification_questions = parsedResponse.clarification_questions.map((question: any, index: number) => {
        if (typeof question === 'string') {
          return question;
        } else if (typeof question === 'object' && question !== null) {
          // Extract question text from object
          return question.question || 
                 question.text || 
                 question.description || 
                 question.inquiry ||
                 question.ask ||
                 JSON.stringify(question, null, 2); // Fallback to formatted JSON
        }
        return `Question ${index + 1}`;
      });
      console.log('❓ Enhanced clarification questions object-to-string conversion:', parsedResponse.clarification_questions.length);
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

    // ENHANCED SEVEN SECTIONS VALIDATION - Make it dynamic based on actual content
    const hasSummary = parsedResponse.summary && parsedResponse.summary.length > 0;
    const hasSteps = Array.isArray(parsedResponse.steps) && parsedResponse.steps.length > 0;
    const hasPlatforms = Array.isArray(parsedResponse.platforms) && parsedResponse.platforms.length > 0;
    const hasQuestions = Array.isArray(parsedResponse.clarification_questions) && parsedResponse.clarification_questions.length > 0;
    const hasAgents = Array.isArray(parsedResponse.agents) && parsedResponse.agents.length > 0;
    const hasTestPayloads = parsedResponse.test_payloads && Object.keys(parsedResponse.test_payloads).length > 0;
    const hasBlueprint = parsedResponse.execution_blueprint && parsedResponse.execution_blueprint.workflow;

    const sectionsCount = [hasSummary, hasSteps, hasPlatforms, hasQuestions, hasAgents, hasTestPayloads, hasBlueprint].filter(Boolean).length;
    
    console.log('✅ YusrAI structured response validation successful')
    metadata.seven_sections_validated = sectionsCount >= 3; // Dynamic validation - at least 3 major sections
    
    console.log(`📊 Section analysis: ${sectionsCount}/7 sections present - seven_sections_validated: ${metadata.seven_sections_validated}`);
    
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
