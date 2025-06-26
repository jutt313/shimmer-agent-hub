
// Enhanced JSON parser with comprehensive error handling and null checks

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
  // Handle null, undefined, or non-string inputs
  if (!text || typeof text !== 'string') {
    console.log('⚠️ Invalid input for JSON parsing:', typeof text);
    return null;
  }

  console.log('🔍 Enhanced parsing with conversation context - Length:', text.length);

  try {
    // Clean the text first - handle potential undefined values
    let cleanText = text.trim();
    
    // Remove any potential undefined or null values that might have been stringified
    cleanText = cleanText.replace(/undefined|null/g, '""');
    
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1].trim());
        console.log('✅ Successfully parsed JSON from code block');
        return parsed;
      } catch (blockError) {
        console.log('⚠️ Failed to parse JSON from code block, trying other methods');
      }
    }

    // Try to extract JSON from the entire text
    try {
      const parsed = JSON.parse(cleanText);
      console.log('✅ Successfully parsed entire text as JSON');
      return parsed;
    } catch (fullError) {
      console.log('⚠️ Failed to parse entire text as JSON');
    }

    // Try to find JSON object patterns in the text
    const jsonPatterns = [
      /\{[\s\S]*"summary"[\s\S]*\}/,
      /\{[\s\S]*"steps"[\s\S]*\}/,
      /\{[\s\S]*"platforms"[\s\S]*\}/,
      /\{[\s\S]*"automation_blueprint"[\s\S]*\}/
    ];

    for (const pattern of jsonPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[0]) {
        try {
          const parsed = JSON.parse(match[0]);
          console.log('✅ Successfully parsed JSON using pattern matching');
          return parsed;
        } catch (patternError) {
          console.log('⚠️ Pattern match failed, trying next pattern');
        }
      }
    }

    // If all JSON parsing fails, try to extract individual components
    const extractedData: StructuredResponse = {
      summary: extractField(cleanText, 'summary'),
      steps: extractArrayField(cleanText, 'steps'),
      platforms: extractArrayField(cleanText, 'platforms'),
      agents: extractArrayField(cleanText, 'agents'),
      automation_blueprint: extractField(cleanText, 'automation_blueprint')
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

// Helper function to safely extract fields with null checks
const extractField = (text: string, fieldName: string) => {
  if (!text || !fieldName) return null;
  
  try {
    const pattern = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i');
    const match = text.match(pattern);
    return match && match[1] ? match[1] : null;
  } catch (error) {
    console.error(`Error extracting field ${fieldName}:`, error);
    return null;
  }
};

// Helper function to safely extract array fields with null checks
const extractArrayField = (text: string, fieldName: string) => {
  if (!text || !fieldName) return [];
  
  try {
    const pattern = new RegExp(`"${fieldName}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) {
      // Try to parse the array content
      try {
        return JSON.parse(`[${match[1]}]`);
      } catch (arrayError) {
        // If JSON parsing fails, split by commas and clean up
        return match[1].split(',').map((item: string) => {
          if (!item) return '';
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

// Clean display text function to remove JSON formatting and make it readable
export const cleanDisplayText = (text: string | undefined | null): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  try {
    // Remove JSON code blocks
    let cleanText = text.replace(/```json[\s\S]*?```/g, '');
    
    // Remove standalone JSON objects
    cleanText = cleanText.replace(/^\s*\{[\s\S]*?\}\s*$/gm, '');
    
    // Clean up extra whitespace
    cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim();
    
    return cleanText;
  } catch (error) {
    console.error('Error cleaning display text:', error);
    return text;
  }
};

// Enhanced data extraction with conversation context
export const extractStructuredData = (text: string | undefined | null) => {
  // Handle null/undefined input
  if (!text || typeof text !== 'string') {
    console.log('⚠️ Invalid text provided for extraction');
    return {
      hasSummary: false,
      stepsCount: 0,
      platformsCount: 0,
      agentsCount: 0,
      hasConversationContext: false
    };
  }

  console.log('🔍 Enhanced parsing with conversation context - Length:', text.length);
  
  const structuredData = parseStructuredResponse(text);
  
  const extracted = {
    hasSummary: Boolean(structuredData?.summary),
    stepsCount: Array.isArray(structuredData?.steps) ? structuredData.steps.length : 0,
    platformsCount: Array.isArray(structuredData?.platforms) ? structuredData.platforms.length : 0,
    agentsCount: Array.isArray(structuredData?.agents) ? structuredData.agents.length : 0,
    hasConversationContext: Boolean(structuredData?.conversation_updates)
  };

  console.log('📊 Enhanced extracted data with conversation context:', extracted);
  
  return extracted;
};
