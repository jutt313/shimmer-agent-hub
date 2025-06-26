
// Ultra-robust JSON parser with bulletproof error handling

export interface StructuredResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
    name: string;
    credentials?: Array<{
      field: string;
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

  console.log('🔍 Enhanced parsing with conversation context - Length:', text.length);

  try {
    let cleanText = text.trim();
    
    // Remove potential undefined/null stringified values
    cleanText = cleanText.replace(/\bundefined\b|null/g, '""');
    
    // Try JSON code block extraction first
    const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1].trim());
        console.log('✅ Successfully parsed JSON from code block');
        return validateStructuredResponse(parsed);
      } catch (blockError) {
        console.log('⚠️ Failed to parse JSON from code block');
      }
    }

    // Try parsing entire text as JSON
    try {
      const parsed = JSON.parse(cleanText);
      console.log('✅ Successfully parsed entire text as JSON');
      return validateStructuredResponse(parsed);
    } catch (fullError) {
      console.log('⚠️ Failed to parse entire text as JSON');
    }

    // Pattern-based extraction with safety checks
    const jsonPatterns = [
      /\{[\s\S]*?"summary"[\s\S]*?\}/,
      /\{[\s\S]*?"steps"[\s\S]*?\}/,
      /\{[\s\S]*?"platforms"[\s\S]*?\}/,
      /\{[\s\S]*?"automation_blueprint"[\s\S]*?\}/
    ];

    for (const pattern of jsonPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0]) {
        try {
          const parsed = JSON.parse(match[0]);
          console.log('✅ Successfully parsed JSON using pattern matching');
          return validateStructuredResponse(parsed);
        } catch (patternError) {
          console.log('⚠️ Pattern match failed, trying next pattern');
        }
      }
    }

    // Field extraction as last resort
    const extractedData: StructuredResponse = {
      summary: safeExtractField(cleanText, 'summary'),
      steps: safeExtractArrayField(cleanText, 'steps'),
      platforms: safeExtractArrayField(cleanText, 'platforms'),
      agents: safeExtractArrayField(cleanText, 'agents'),
      automation_blueprint: safeExtractField(cleanText, 'automation_blueprint')
    };

    const hasValidData = extractedData.summary || 
                        (extractedData.steps && extractedData.steps.length > 0) ||
                        (extractedData.platforms && extractedData.platforms.length > 0);

    if (hasValidData) {
      console.log('✅ Successfully extracted structured data using field extraction');
      return extractedData;
    }

    console.log('❌ No structured data found');
    return null;

  } catch (error) {
    console.error('❌ Critical error in parseStructuredResponse:', error);
    return null;
  }
};

// Validate and sanitize structured response
const validateStructuredResponse = (data: any): StructuredResponse | null => {
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

    if (Array.isArray(data.platforms)) {
      validated.platforms = data.platforms.filter(platform => 
        platform && typeof platform === 'object' && platform.name
      );
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

    return validated;
  } catch (error) {
    console.error('Error validating structured response:', error);
    return null;
  }
};

// Ultra-safe field extraction
const safeExtractField = (text: string, fieldName: string): string | null => {
  if (!text || typeof text !== 'string' || !fieldName) {
    return null;
  }
  
  try {
    const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i');
    const match = text.match(pattern);
    return match && match[1] ? match[1] : null;
  } catch (error) {
    console.error(`Error extracting field ${fieldName}:`, error);
    return null;
  }
};

// Ultra-safe array field extraction
const safeExtractArrayField = (text: string, fieldName: string): any[] => {
  if (!text || typeof text !== 'string' || !fieldName) {
    return [];
  }
  
  try {
    const pattern = new RegExp(`"${fieldName}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        return JSON.parse(`[${match[1]}]`);
      } catch (arrayError) {
        return match[1].split(',').map((item: string) => {
          return item.trim().replace(/"/g, '');
        }).filter((item: string) => item.length > 0);
      }
    }
    return [];
  } catch (error) {
    console.error(`Error extracting array field ${fieldName}:`, error);
    return [];
  }
};

// BULLETPROOF cleanDisplayText function
export const cleanDisplayText = (text: string | undefined | null): string => {
  try {
    // CRITICAL: Always guarantee a string return
    if (text === null || text === undefined) {
      console.warn('cleanDisplayText: null/undefined input, returning empty string');
      return '';
    }

    if (typeof text !== 'string') {
      console.warn('cleanDisplayText: non-string input, converting:', typeof text);
      return String(text);
    }

    // Process the text safely
    let cleanText = text;
    
    // Remove JSON code blocks
    cleanText = cleanText.replace(/```json[\s\S]*?```/g, '');
    
    // Remove standalone JSON objects  
    cleanText = cleanText.replace(/^\s*\{[\s\S]*?\}\s*$/gm, '');
    
    // Clean up extra whitespace
    cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim();
    
    // FINAL GUARANTEE: Return a string
    return typeof cleanText === 'string' ? cleanText : '';
    
  } catch (error) {
    console.error('cleanDisplayText: Critical error, returning safe fallback:', error);
    // Ultimate fallback - convert input to string safely
    try {
      return String(text || '');
    } catch (finalError) {
      console.error('cleanDisplayText: Even fallback failed:', finalError);
      return '';
    }
  }
};
