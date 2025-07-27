
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

// CRITICAL FIX: Enhanced platform name extraction with intelligent parsing
const extractPlatformName = (platform: any, index: number): string => {
  console.log(`🔍 Extracting platform name for index ${index}:`, platform);
  
  // Try direct name fields first
  let platformName = platform.name || 
                    platform.platform_name || 
                    platform.platform || 
                    platform.service || 
                    platform.integration ||
                    platform.tool;
  
  // If no direct name, analyze content for platform identification
  if (!platformName || platformName === 'Platform 1' || platformName.includes('Platform ')) {
    const description = platform.description || platform.why_needed || platform.usage || '';
    const credentials = platform.credentials || platform.required_credentials || [];
    
    // Create searchable text from all available content
    const searchableText = (description + ' ' + 
                           credentials.map((c: any) => c.field + ' ' + c.why_needed).join(' ')).toLowerCase();
    
    console.log(`🔍 Analyzing content for platform detection: "${searchableText}"`);
    
    // Enhanced platform detection patterns
    const platformPatterns = [
      { pattern: 'typeform', name: 'Typeform' },
      { pattern: 'openai', name: 'OpenAI' },
      { pattern: 'gpt', name: 'OpenAI' },
      { pattern: 'slack', name: 'Slack' },
      { pattern: 'gmail', name: 'Gmail' },
      { pattern: 'google mail', name: 'Gmail' },
      { pattern: 'notion', name: 'Notion' },
      { pattern: 'discord', name: 'Discord' },
      { pattern: 'github', name: 'GitHub' },
      { pattern: 'trello', name: 'Trello' },
      { pattern: 'asana', name: 'Asana' },
      { pattern: 'monday', name: 'Monday.com' },
      { pattern: 'clickup', name: 'ClickUp' },
      { pattern: 'zoom', name: 'Zoom' },
      { pattern: 'teams', name: 'Microsoft Teams' },
      { pattern: 'hubspot', name: 'HubSpot' },
      { pattern: 'salesforce', name: 'Salesforce' },
      { pattern: 'stripe', name: 'Stripe' },
      { pattern: 'paypal', name: 'PayPal' },
      { pattern: 'shopify', name: 'Shopify' },
      { pattern: 'woocommerce', name: 'WooCommerce' },
      { pattern: 'zapier', name: 'Zapier' },
      { pattern: 'airtable', name: 'Airtable' },
      { pattern: 'sheets', name: 'Google Sheets' },
      { pattern: 'excel', name: 'Microsoft Excel' },
      { pattern: 'dropbox', name: 'Dropbox' },
      { pattern: 'drive', name: 'Google Drive' },
      { pattern: 'api key', name: 'API Service' },
      { pattern: 'webhook', name: 'Webhook Service' },
      { pattern: 'database', name: 'Database' },
      { pattern: 'email', name: 'Email Service' }
    ];
    
    for (const { pattern, name } of platformPatterns) {
      if (searchableText.includes(pattern)) {
        console.log(`✅ Platform detected: "${name}" via pattern "${pattern}"`);
        platformName = name;
        break;
      }
    }
  }
  
  // Final fallback with meaningful default
  if (!platformName || platformName === 'Platform 1') {
    platformName = `Service ${index + 1}`;
  }
  
  console.log(`🎯 Final platform name: "${platformName}"`);
  return platformName;
};

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
      (parsedResponse.steps || parsedResponse.platforms || parsedResponse.agents);

    if (!hasStructuredSections) {
      console.log('📄 Not a structured response, treating as plain text')
      return { 
        structuredData: null, 
        metadata, 
        isPlainText: true 
      };
    }

    // CRITICAL FIX: Enhanced field mapping with intelligent detection
    console.log('🔍 Validating and mapping structured sections...')
    
    // Steps mapping
    if (parsedResponse.step_by_step_explanation && !parsedResponse.steps) {
      parsedResponse.steps = Array.isArray(parsedResponse.step_by_step_explanation) 
        ? parsedResponse.step_by_step_explanation 
        : [parsedResponse.step_by_step_explanation];
      console.log('📋 Mapped step_by_step_explanation to steps:', parsedResponse.steps.length);
    }

    // CRITICAL FIX: Enhanced platform mapping with intelligent name extraction
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

    // CRITICAL FIX: Intelligent platform name extraction and credential mapping
    if (parsedResponse.platforms && Array.isArray(parsedResponse.platforms)) {
      parsedResponse.platforms = parsedResponse.platforms.map((platform: any, index: number) => {
        const platformName = extractPlatformName(platform, index);
        
        // Enhanced credential mapping
        const credentials = platform.credentials || 
                           platform.required_credentials || 
                           platform.credential_requirements ||
                           platform.fields ||
                           [];
        
        const mappedCredentials = Array.isArray(credentials) ? credentials.map((cred: any) => ({
          field: cred.field || cred.name || cred.key || 'api_key',
          why_needed: cred.why_needed || cred.description || cred.purpose || 'Authentication required',
          where_to_get: cred.where_to_get || cred.link || cred.documentation_url || cred.url || '#',
          link: cred.link || cred.where_to_get || cred.documentation_url || cred.url || '#',
          example: cred.example || cred.placeholder || `Enter ${cred.field || 'credential'}`,
          options: cred.options || cred.choices || []
        })) : [];
        
        return {
          ...platform,
          name: platformName,
          credentials: mappedCredentials
        };
      });
      console.log('✅ Enhanced platform processing completed');
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

    // Ensure all arrays exist with proper defaults
    if (!parsedResponse.steps) parsedResponse.steps = [];
    if (!parsedResponse.platforms) parsedResponse.platforms = [];
    if (!parsedResponse.clarification_questions) parsedResponse.clarification_questions = [];
    if (!parsedResponse.agents) parsedResponse.agents = [];
    if (!parsedResponse.test_payloads) parsedResponse.test_payloads = {};
    if (!parsedResponse.execution_blueprint) parsedResponse.execution_blueprint = {
      trigger: { type: 'manual', configuration: {} },
      workflow: [],
      error_handling: {
        retry_attempts: 3,
        fallback_actions: ['log and continue'],
        notification_rules: [],
        critical_failure_actions: ['stop execution']
      },
      performance_optimization: {
        rate_limit_handling: 'automatic',
        concurrency_limit: 5,
        timeout_seconds_per_step: 30
      }
    };

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
