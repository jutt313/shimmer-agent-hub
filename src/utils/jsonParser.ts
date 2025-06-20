
export interface StructuredResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
    name: string;
    credentials: Array<{
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
    rules: string;
    memory: string;
    why_needed: string;
  }>;
  clarification_questions?: string[];
  automation_blueprint?: any;
}

export const parseStructuredResponse = (responseText: string): StructuredResponse | null => {
  console.log('🔍 Parsing structured response - Length:', responseText.length);
  
  try {
    // Method 1: Try to find JSON in code blocks first
    const jsonCodeBlockMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonCodeBlockMatch) {
      try {
        const parsed = JSON.parse(jsonCodeBlockMatch[1]);
        console.log('✅ Successfully parsed JSON from code block');
        return parsed;
      } catch (e) {
        console.log('❌ JSON in code block malformed, attempting fix...');
        const fixed = fixMalformedJson(jsonCodeBlockMatch[1]);
        if (fixed) {
          try {
            const parsed = JSON.parse(fixed);
            console.log('✅ Fixed and parsed JSON from code block');
            return parsed;
          } catch (e2) {
            console.log('❌ Could not fix JSON in code block');
          }
        }
      }
    }

    // Method 2: Look for complete JSON objects
    const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      let jsonStr = jsonObjectMatch[0];
      
      // Find the complete JSON object by counting braces
      let braceCount = 0;
      let endIndex = -1;
      
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === '{') {
          braceCount++;
        } else if (jsonStr[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex > 0) {
        jsonStr = jsonStr.substring(0, endIndex);
        
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('✅ Successfully parsed complete JSON object');
          return parsed;
        } catch (e) {
          console.log('❌ JSON object malformed, attempting fix...');
          const fixed = fixMalformedJson(jsonStr);
          if (fixed) {
            try {
              const parsed = JSON.parse(fixed);
              console.log('✅ Fixed and parsed JSON object');
              return parsed;
            } catch (e2) {
              console.log('❌ Could not fix JSON object');
            }
          }
        }
      }
    }

    // Method 3: Extract data from text patterns as fallback (REMOVED PLATFORM AUTO-DETECTION)
    const extractedData = extractDataFromText(responseText);
    if (extractedData && Object.keys(extractedData).length > 0) {
      console.log('✅ Extracted structured data from text patterns');
      return extractedData;
    }

    console.log('❌ No structured data found');
    return null;
    
  } catch (error) {
    console.error('❌ Error in parseStructuredResponse:', error);
    return null;
  }
};

const fixMalformedJson = (jsonStr: string): string | null => {
  try {
    let fixed = jsonStr
      // Fix unquoted property names
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix single quotes to double quotes
      .replace(/'/g, '"')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix escaped newlines in strings
      .replace(/\\n/g, '\\n')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t');

    // Test if the fixed JSON is valid
    JSON.parse(fixed);
    return fixed;
  } catch (e) {
    console.log('❌ Could not fix malformed JSON');
    return null;
  }
};

const extractDataFromText = (text: string): StructuredResponse | null => {
  const data: StructuredResponse = {};

  // Extract summary
  const summaryMatch = text.match(/(?:Summary|Automation Summary)[:\s]*\n?([^\n#]*?)(?:\n|$)/i);
  if (summaryMatch && summaryMatch[1].trim()) {
    data.summary = summaryMatch[1].trim();
  }

  // Extract steps with better pattern matching
  const stepsMatches = text.match(/(?:Steps?|Step-by-Step|Workflow)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*.*\n?)*)/i);
  if (stepsMatches && stepsMatches[1]) {
    const steps = stepsMatches[1]
      .split(/(?:\d+\.|\*|\-)/)
      .filter(step => step.trim())
      .map(step => step.trim().replace(/\n/g, ' '))
      .filter(step => step.length > 3);
    
    if (steps.length > 0) {
      data.steps = steps;
    }
  }

  // REMOVED: Platform auto-detection from text patterns
  // This was causing confusion by detecting platforms from user prompts
  // Now platforms will only come from structured JSON responses

  // Extract clarification questions
  const clarificationMatch = text.match(/(?:clarification|questions?)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*.*\n?)*)/i);
  if (clarificationMatch && clarificationMatch[1]) {
    const questions = clarificationMatch[1]
      .split(/(?:\d+\.|\*|\-)/)
      .filter(q => q.trim())
      .map(q => q.trim().replace(/\n/g, ' '))
      .filter(q => q.length > 5);
    
    if (questions.length > 0) {
      data.clarification_questions = questions;
    }
  }

  return Object.keys(data).length > 0 ? data : null;
};

export const cleanDisplayText = (text: string): string => {
  let cleanText = text;
  
  // Remove JSON code blocks
  cleanText = cleanText.replace(/```json\n[\s\S]*?\n```/g, '');
  
  // Remove standalone JSON objects
  cleanText = cleanText.replace(/\{[\s\S]*?\}/g, '');
  
  // Clean up extra whitespace and newlines
  cleanText = cleanText.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleanText = cleanText.trim();
  
  // If text is empty after cleaning, provide a default message
  if (!cleanText) {
    cleanText = "Here's what I found for your automation:";
  }
  
  return cleanText;
};
