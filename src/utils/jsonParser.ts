
// Ultra-robust JSON parser with bulletproof error handling

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

  console.log('🔍 Enhanced parsing - Length:', text.length);

  try {
    let cleanText = text.trim();
    
    // If it's already a JSON object (new format), return it directly
    if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanText);
        console.log('✅ Successfully parsed direct JSON');
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

    // Try JSON code block extraction
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

    // Pattern-based extraction as last resort
    const jsonPatterns = [
      /\{[\s\S]*?"summary"[\s\S]*?\}/,
      /\{[\s\S]*?"steps"[\s\S]*?\}/,
      /\{[\s\S]*?"platforms"[\s\S]*?\}/
    ];

    for (const pattern of jsonPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0]) {
        try {
          const parsed = JSON.parse(match[0]);
          console.log('✅ Successfully parsed JSON using pattern matching');
          return validateAndEnhanceStructuredResponse(parsed);
        } catch (patternError) {
          console.log('⚠️ Pattern match failed, trying next pattern');
        }
      }
    }

    console.log('❌ No structured data found using any method');
    return null;

  } catch (error) {
    console.error('❌ Critical error in parseStructuredResponse:', error);
    return null;
  }
};

// Enhanced validation and credential structure fixing
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

    // Enhanced platform validation with credential structure fixing
    if (Array.isArray(data.platforms)) {
      validated.platforms = data.platforms
        .filter(platform => platform && typeof platform === 'object' && platform.name)
        .map(platform => {
          const validatedPlatform: any = {
            name: platform.name
          };

          // Fix credential structure
          if (Array.isArray(platform.credentials)) {
            validatedPlatform.credentials = platform.credentials
              .map((cred: any) => {
                if (!cred || typeof cred !== 'object') return null;

                // Ensure all required credential fields exist
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
                    : 'Required for platform integration'
                };

                return validatedCred;
              })
              .filter(cred => cred !== null);
          }

          return validatedPlatform;
        });
    }

    if (Array.isArray(data.agents)) {
      validated.agents = data.agents.filter(agent => 
        agent && typeof agent === 'object' && agent.name && agent.role
      );
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
    console.error('Error validating structured response:', error);
    return null;
  }
};

// BULLETPROOF cleanDisplayText function
export const cleanDisplayText = (text: string | undefined | null): string => {
  try {
    if (text === null || text === undefined) {
      console.warn('cleanDisplayText: Input is null/undefined, returning empty string.');
      return '';
    }

    if (typeof text !== 'string') {
      console.warn('cleanDisplayText: Input is not a string, converting to string. Type:', typeof text);
      return String(text);
    }

    let cleanText: string = text;
    
    try {
      if (typeof cleanText === 'string') {
        cleanText = cleanText.replace(/```json[\s\S]*?```/g, '');
      } else {
        cleanText = String(text || '');
      }
    } catch (e) {
      console.error('cleanDisplayText: Error removing JSON code blocks:', e);
      cleanText = String(text || '');
    }
    
    try {
      if (typeof cleanText === 'string') {
        cleanText = cleanText.replace(/^\s*\{[\s\S]*?\}\s*$/gm, '');
      } else {
        cleanText = String(text || '');
      }
    } catch (e) {
      console.error('cleanDisplayText: Error removing standalone JSON objects:', e);
      cleanText = String(text || '');
    }
    
    try {
      if (typeof cleanText === 'string') {
        cleanText = cleanText.replace(/\n\s*\n/g, '\n');
      } else {
        cleanText = String(text || '');
      }
    } catch (e) {
      console.error('cleanDisplayText: Error removing extra newlines:', e);
      cleanText = String(text || '');
    }

    try {
      if (typeof cleanText === 'string') {
        cleanText = cleanText.trim();
      } else {
        cleanText = String(text || '');
      }
    } catch (e) {
      console.error('cleanDisplayText: Error trimming whitespace:', e);
      cleanText = String(text || '');
    }
    
    return typeof cleanText === 'string' ? cleanText : String(cleanText || '');
    
  } catch (error: any) {
    console.error('cleanDisplayText: TOP-LEVEL CATCH - Critical error, returning safe fallback.', error);
    try {
      return String(text || '');
    } catch (finalError) {
      console.error('cleanDisplayText: Fallback conversion also failed:', finalError);
      return '';
    }
  }
};
