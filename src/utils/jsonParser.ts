
// Ultra-robust JSON parser with comprehensive automation support

export interface StructuredResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
    name: string;
    credentials?: Array<{
      field: string;
      placeholder: string;
      link: string;
      why_needed: string;
    }>;
  }>;
  agents?: Array<{
    name: string;
    role: string;
    goal: string;
    rules?: string;
    memory?: string;
    why_needed: string;
  }>;
  clarification_questions?: string[];
  automation_blueprint?: any;
  platforms_to_remove?: string[];
  conversation_updates?: any;
}

export const parseStructuredResponse = (text: string | undefined | null): StructuredResponse | null => {
  // Ultra-safe input validation
  if (!text || typeof text !== 'string' || text.trim() === '') {
    console.log('⚠️ parseStructuredResponse: Invalid or empty input');
    return null;
  }

  console.log('🔍 Enhanced comprehensive parsing - Length:', text.length);

  try {
    let cleanText = text.trim();
    
    // Direct JSON parsing (new format)
    if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanText);
        console.log('✅ Successfully parsed direct JSON with comprehensive structure');
        return validateAndEnhanceStructuredResponse(parsed);
      } catch (directError) {
        console.log('⚠️ Failed to parse as direct JSON, trying fallback methods');
      }
    }

    // Handle legacy wrapped responses
    if (cleanText.includes('"response":')) {
      try {
        const wrappedResponse = JSON.parse(cleanText);
        if (wrappedResponse.response) {
          const innerResponse = typeof wrappedResponse.response === 'string' 
            ? JSON.parse(wrappedResponse.response) 
            : wrappedResponse.response;
          console.log('✅ Successfully parsed wrapped response');
          return validateAndEnhanceStructuredResponse(innerResponse);
        }
      } catch (wrappedError) {
        console.log('⚠️ Failed to parse wrapped response');
      }
    }

    // JSON code block extraction
    const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1].trim());
        console.log('✅ Successfully parsed JSON from code block');
        return validateAndEnhanceStructuredResponse(parsed);
      } catch (blockError) {
        console.log('⚠️ Failed to parse JSON from code block');
      }
    }

    // Enhanced pattern-based extraction
    const comprehensivePatterns = [
      /\{[\s\S]*?"summary"[\s\S]*?"agents"[\s\S]*?\}/,
      /\{[\s\S]*?"platforms"[\s\S]*?"credentials"[\s\S]*?\}/,
      /\{[\s\S]*?"automation_blueprint"[\s\S]*?\}/,
      /\{[\s\S]*?"steps"[\s\S]*?\}/
    ];

    for (const pattern of comprehensivePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0]) {
        try {
          const parsed = JSON.parse(match[0]);
          console.log('✅ Successfully parsed JSON using comprehensive pattern matching');
          return validateAndEnhanceStructuredResponse(parsed);
        } catch (patternError) {
          console.log('⚠️ Comprehensive pattern match failed, trying next pattern');
        }
      }
    }

    console.log('❌ No structured data found using any comprehensive method');
    return null;

  } catch (error) {
    console.error('❌ Critical error in parseStructuredResponse:', error);
    return null;
  }
};

// Enhanced validation with comprehensive agent structure support
const validateAndEnhanceStructuredResponse = (data: any): StructuredResponse | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  try {
    const validated: StructuredResponse = {};

    if (data.summary && typeof data.summary === 'string') {
      validated.summary = data.summary;
    }

    if (Array.isArray(data.steps)) {
      validated.steps = data.steps.filter(step => typeof step === 'string');
    }

    // Enhanced platform validation with comprehensive credential structure
    if (Array.isArray(data.platforms)) {
      validated.platforms = data.platforms
        .filter(platform => platform && typeof platform === 'object' && platform.name)
        .map(platform => {
          const validatedPlatform: any = {
            name: platform.name
          };

          // Comprehensive credential structure validation
          if (Array.isArray(platform.credentials)) {
            validatedPlatform.credentials = platform.credentials
              .map((cred: any) => {
                if (!cred || typeof cred !== 'object') return null;

                // Ensure all required credential fields exist with proper validation
                const validatedCred = {
                  field: typeof cred.field === 'string' && cred.field.trim() 
                    ? cred.field.trim() 
                    : 'api_key',
                  placeholder: typeof cred.placeholder === 'string' && cred.placeholder.trim() 
                    ? cred.placeholder.trim() 
                    : `Enter your ${platform.name} credential`,
                  link: typeof cred.link === 'string' && cred.link.trim() 
                    ? cred.link.trim() 
                    : '#',
                  why_needed: typeof cred.why_needed === 'string' && cred.why_needed.trim() 
                    ? cred.why_needed.trim() 
                    : 'Required for comprehensive platform integration'
                };

                return validatedCred;
              })
              .filter(cred => cred !== null);
          }

          return validatedPlatform;
        });
    }

    // Enhanced agent validation with rules and memory support
    if (Array.isArray(data.agents)) {
      validated.agents = data.agents
        .filter(agent => agent && typeof agent === 'object' && agent.name && agent.role)
        .map(agent => ({
          name: agent.name,
          role: agent.role,
          goal: agent.goal || 'Execute automation tasks effectively',
          rules: typeof agent.rules === 'string' ? agent.rules : 'Follow automation best practices and user requirements',
          memory: typeof agent.memory === 'string' ? agent.memory : 'Remember automation context and user preferences',
          why_needed: agent.why_needed || 'Essential for comprehensive automation execution'
        }));
    }

    if (Array.isArray(data.clarification_questions)) {
      validated.clarification_questions = data.clarification_questions.filter(q => typeof q === 'string');
    }

    if (data.automation_blueprint) {
      validated.automation_blueprint = data.automation_blueprint;
    }

    if (Array.isArray(data.platforms_to_remove)) {
      validated.platforms_to_remove = data.platforms_to_remove.filter(p => typeof p === 'string');
    }

    if (data.conversation_updates) {
      validated.conversation_updates = data.conversation_updates;
    }

    return validated;
  } catch (error) {
    console.error('Error validating comprehensive structured response:', error);
    return null;
  }
};

// Enhanced display text cleaning with comprehensive support
export const cleanDisplayText = (text: string | undefined | null): string => {
  try {
    if (text === null || text === undefined) {
      console.warn('cleanDisplayText: Input is null/undefined, returning empty string.');
      return '';
    }

    if (typeof text !== 'string') {
      console.warn('cleanDisplayText: Input is not a string, converting. Type:', typeof text);
      return String(text);
    }

    let cleanText: string = text;
    
    // Remove JSON code blocks
    try {
      cleanText = cleanText.replace(/```json[\s\S]*?```/g, '');
    } catch (e) {
      console.error('cleanDisplayText: Error removing JSON code blocks:', e);
      cleanText = String(text || '');
    }
    
    // Remove standalone JSON objects
    try {
      cleanText = cleanText.replace(/^\s*\{[\s\S]*?\}\s*$/gm, '');
    } catch (e) {
      console.error('cleanDisplayText: Error removing JSON objects:', e);
      cleanText = String(text || '');
    }
    
    // Clean up extra newlines
    try {
      cleanText = cleanText.replace(/\n\s*\n/g, '\n');
    } catch (e) {
      console.error('cleanDisplayText: Error removing extra newlines:', e);
      cleanText = String(text || '');
    }

    // Final trim
    try {
      cleanText = cleanText.trim();
    } catch (e) {
      console.error('cleanDisplayText: Error trimming whitespace:', e);
      cleanText = String(text || '');
    }
    
    return typeof cleanText === 'string' ? cleanText : String(cleanText || '');
    
  } catch (error: any) {
    console.error('cleanDisplayText: TOP-LEVEL CATCH - Critical error:', error);
    try {
      return String(text || '');
    } catch (finalError) {
      console.error('cleanDisplayText: Final fallback failed:', finalError);
      return '';
    }
  }
};
