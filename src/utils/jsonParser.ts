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
  platforms_to_remove?: string[];
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
  is_update?: boolean;
  conversation_updates?: {
    platform_changes?: string;
    context_acknowledged?: string;
  };
}

export const parseStructuredResponse = (responseText: string): StructuredResponse | null => {
  console.log('🔍 Enhanced parsing with conversation context - Length:', responseText.length);
  
  try {
    // Method 1: Priority - JSON in code blocks with validation
    const jsonCodeBlockMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonCodeBlockMatch) {
      try {
        const parsed = JSON.parse(jsonCodeBlockMatch[1]);
        console.log('✅ Successfully parsed JSON from code block with conversation context');
        
        // Validate completeness
        const validation = validateStructuredData(parsed);
        if (validation.isComplete) {
          console.log('✅ Complete structured data found with conversation awareness');
          parsed.is_update = isUpdateResponse(parsed, responseText);
          return validateAndFixStructuredData(parsed);
        } else {
          console.log('⚠️ Incomplete structured data:', validation.missing);
          // Try to enhance with extracted data
          const enhanced = enhanceWithExtractedData(parsed, responseText);
          enhanced.is_update = isUpdateResponse(enhanced, responseText);
          return validateAndFixStructuredData(enhanced);
        }
      } catch (e) {
        console.log('❌ JSON in code block malformed, attempting advanced fix...');
        const fixed = advancedJsonFix(jsonCodeBlockMatch[1]);
        if (fixed) {
          try {
            const parsed = JSON.parse(fixed);
            console.log('✅ Fixed and parsed JSON from code block');
            parsed.is_update = isUpdateResponse(parsed, responseText);
            return validateAndFixStructuredData(parsed);
          } catch (e2) {
            console.log('❌ Advanced JSON fix failed');
          }
        }
      }
    }

    // Method 2: Complete JSON objects with validation
    const jsonObjectMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      let jsonStr = extractCompleteJson(jsonObjectMatch[0]);
      
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          console.log('✅ Successfully parsed complete JSON object with context');
          
          const validation = validateStructuredData(parsed);
          if (validation.isComplete) {
            parsed.is_update = isUpdateResponse(parsed, responseText);
            return validateAndFixStructuredData(parsed);
          } else {
            const enhanced = enhanceWithExtractedData(parsed, responseText);
            enhanced.is_update = isUpdateResponse(enhanced, responseText);
            return validateAndFixStructuredData(enhanced);
          }
        } catch (e) {
          console.log('❌ JSON object malformed, attempting advanced fix...');
          const fixed = advancedJsonFix(jsonStr);
          if (fixed) {
            try {
              const parsed = JSON.parse(fixed);
              console.log('✅ Fixed and parsed JSON object');
              parsed.is_update = isUpdateResponse(parsed, responseText);
              return validateAndFixStructuredData(parsed);
            } catch (e2) {
              console.log('❌ Advanced JSON object fix failed');
            }
          }
        }
      }
    }

    // Method 3: Enhanced text extraction as fallback with conversation awareness
    const extractedData = enhancedExtractDataFromText(responseText);
    if (extractedData && Object.keys(extractedData).length > 0) {
      console.log('✅ Extracted enhanced structured data from text patterns with context');
      extractedData.is_update = isUpdateResponse(extractedData, responseText);
      return validateAndFixStructuredData(extractedData);
    }

    console.log('❌ No structured data found');
    return null;
    
  } catch (error) {
    console.error('❌ Error in enhanced parseStructuredResponse:', error);
    return null;
  }
};

// Enhanced validation function
const validateStructuredData = (data: any): { isComplete: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!data.summary || data.summary.length < 10) {
    missing.push('summary');
  }
  
  if (!data.steps || !Array.isArray(data.steps) || data.steps.length < 3) {
    missing.push('steps (minimum 3 required)');
  }
  
  return {
    isComplete: missing.length === 0,
    missing
  };
};

// Enhanced data extraction with conversation context awareness
const enhancedExtractDataFromText = (text: string): StructuredResponse | null => {
  const data: StructuredResponse = {};

  // Enhanced summary extraction with conversation context
  const summaryPatterns = [
    /(?:Summary|Automation Summary|This automation)[:\s]*([^.\n]+(?:\.[^.\n]+){0,2})/i,
    /^([^.\n]*(?:automation|workflow|system)[^.\n]*\.)/i,
    /I['']ll help you create ([^.\n]+automation[^.\n]*\.)/i,
    /(?:Based on our conversation|Following our discussion)[:\s]*([^.\n]+\.)/i
  ];
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 15) {
      data.summary = match[1].trim();
      break;
    }
  }

  // Enhanced steps extraction with multiple patterns
  const stepsPatterns = [
    /(?:Steps?|Step-by-Step|Workflow|Process)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*[^\n]+\n?){3,})/i,
    /(?:Here's how it works|The process includes)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*[^\n]+\n?){3,})/i
  ];

  for (const pattern of stepsPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const steps = match[1]
        .split(/(?:\d+\.|\*|\-)/)
        .filter(step => step.trim())
        .map(step => step.trim().replace(/\n/g, ' '))
        .filter(step => step.length > 10);
      
      if (steps.length >= 3) {
        data.steps = steps;
        break;
      }
    }
  }

  // Enhanced agent extraction with conversation context awareness
  const agentPatterns = [
    /(?:Agent|AI Agent|Assistant)[s]?\s*(?:recommended?|suggested?|needed?)[:\s]*([^.\n]+)/gi,
    /(?:I recommend|I suggest|You'll need).*?([A-Z][a-zA-Z]*(?:Agent|Manager|Analyzer|Handler|Processor))/gi,
    /(?:Based on our discussion|From our conversation).*?([A-Z][a-zA-Z]*(?:Agent|Manager))/gi
  ];

  const agentNames = new Set<string>();
  agentPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        agentNames.add(match[1].trim());
      }
    }
  });

  if (agentNames.size > 0) {
    data.agents = Array.from(agentNames).map(agentName => ({
      name: agentName,
      role: `${agentName} specialist for automation workflows`,
      goal: `Manage and coordinate ${agentName.toLowerCase().replace('agent', '').replace('manager', '')} related tasks`,
      rules: `Follow best practices for ${agentName.toLowerCase()} operations and error handling`,
      memory: `Previous ${agentName.toLowerCase()} interactions and successful automation patterns`,
      why_needed: `Essential for reliable ${agentName.toLowerCase()} automation execution and monitoring`
    }));
  }

  // Add conversation context awareness
  const contextPatterns = [
    /(?:Based on our conversation|Following our discussion|From our chat)/i,
    /(?:As we discussed|From what we talked about)/i,
    /(?:Context acknowledged|Conversation understood)/i
  ];

  const hasContextAwareness = contextPatterns.some(pattern => pattern.test(text));
  if (hasContextAwareness) {
    data.conversation_updates = {
      context_acknowledged: "AI has acknowledged conversation history and context"
    };
  }

  console.log('📊 Enhanced extracted data with conversation context:', {
    hasSummary: !!data.summary,
    stepsCount: data.steps?.length || 0,
    platformsCount: data.platforms?.length || 0,
    agentsCount: data.agents?.length || 0,
    hasConversationContext: !!data.conversation_updates
  });

  return Object.keys(data).length > 0 ? data : null;
};

// Advanced JSON fixing with better error handling
const advancedJsonFix = (jsonStr: string): string | null => {
  try {
    let fixed = jsonStr
      // Fix unquoted keys
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix single quotes to double quotes
      .replace(/'/g, '"')
      // Remove trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix escaped characters
      .replace(/\\n/g, '\\n')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t')
      // Fix common quote issues
      .replace(/"([^"]*)"([^",}\]]*)"([^"]*)":/g, '"$1$2$3":');

    // Test if fixed JSON is valid
    JSON.parse(fixed);
    return fixed;
  } catch (e) {
    console.log('❌ Advanced JSON fix failed');
    return null;
  }
};

// Extract complete JSON object by counting braces
const extractCompleteJson = (jsonStr: string): string | null => {
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
  
  return endIndex > 0 ? jsonStr.substring(0, endIndex) : null;
};

// Enhance parsed data with extracted information
const enhanceWithExtractedData = (parsedData: any, responseText: string): StructuredResponse => {
  const extracted = enhancedExtractDataFromText(responseText);
  
  return {
    summary: parsedData.summary || extracted?.summary || "Automation workflow created with conversation context",
    steps: parsedData.steps || extracted?.steps || [],
    platforms: parsedData.platforms || extracted?.platforms || [],
    platforms_to_remove: parsedData.platforms_to_remove || [],
    agents: parsedData.agents || extracted?.agents || [],
    clarification_questions: parsedData.clarification_questions || [],
    automation_blueprint: parsedData.automation_blueprint || null,
    is_update: parsedData.is_update || false,
    conversation_updates: parsedData.conversation_updates || extracted?.conversation_updates || {}
  };
};

export const validateAndFixStructuredData = (data: any): StructuredResponse => {
  const validated: StructuredResponse = {
    summary: data.summary || "Automation workflow created with conversation awareness",
    steps: data.steps || [],
    platforms: data.platforms || [],
    platforms_to_remove: data.platforms_to_remove || [],
    agents: data.agents || [],
    clarification_questions: data.clarification_questions || [],
    automation_blueprint: data.automation_blueprint || null,
    is_update: data.is_update || false,
    conversation_updates: data.conversation_updates || {}
  };

  // Ensure platforms array has proper structure
  if (validated.platforms) {
    validated.platforms = validated.platforms.map(platform => ({
      name: platform.name || "Unknown Platform",
      credentials: Array.isArray(platform.credentials) ? platform.credentials.map(cred => ({
        field: cred.field || "api_key",
        placeholder: cred.placeholder || "Enter credential",
        link: cred.link || "https://platform.com",
        why_needed: cred.why_needed || "Required for platform access"
      })) : []
    }));
  }

  // Ensure agents array has proper structure
  if (validated.agents) {
    validated.agents = validated.agents.map(agent => ({
      name: agent.name || "AI Assistant",
      role: agent.role || "Assistant",
      goal: agent.goal || "Help with automation tasks",
      rules: agent.rules || "Follow best practices",
      memory: agent.memory || "No initial memory",
      why_needed: agent.why_needed || "Enhances automation capabilities"
    }));
  }

  console.log('✅ Validated structured data with conversation context:', {
    hasSummary: !!validated.summary,
    stepsCount: validated.steps?.length || 0,
    platformsCount: validated.platforms?.length || 0,
    platformsToRemoveCount: validated.platforms_to_remove?.length || 0,
    agentsCount: validated.agents?.length || 0,
    hasBlueprint: !!validated.automation_blueprint,
    hasConversationUpdates: !!validated.conversation_updates
  });

  return validated;
};

// Helper function to detect if this is an update response vs new automation with conversation context
const isUpdateResponse = (parsed: any, responseText: string): boolean => {
  const updateKeywords = [
    'update', 'modify', 'change', 'adjust', 'edit', 'revise',
    'improved', 'enhanced', 'refined', 'optimized', 'fixed'
  ];
  
  const conversationKeywords = [
    'based on our conversation', 'from our discussion', 'as we talked about',
    'following our chat', 'from what we discussed'
  ];
  
  const hasUpdateKeywords = updateKeywords.some(keyword => 
    responseText.toLowerCase().includes(keyword)
  );

  const hasConversationContext = conversationKeywords.some(keyword =>
    responseText.toLowerCase().includes(keyword)
  );

  // If response contains comprehensive platform data or blueprint, it's NOT an update
  const isComprehensiveResponse = !!parsed.automation_blueprint || 
                                 (parsed.platforms && Array.isArray(parsed.platforms) && parsed.platforms.length > 0) ||
                                 (parsed.agents && Array.isArray(parsed.agents) && parsed.agents.length > 0);

  // If it's a comprehensive response with actual data, and no explicit update keywords, it's NOT an update
  // However, if it has conversation context, it might be an update based on discussion
  if (isComprehensiveResponse && !hasUpdateKeywords && !hasConversationContext) {
    return false;
  }

  const hasMinimalStructure = !parsed.automation_blueprint && 
                             (!parsed.platforms || parsed.platforms.length === 0) &&
                             (!parsed.agents || parsed.agents.length === 0);

  const hasQuestions = parsed.clarification_questions && parsed.clarification_questions.length > 0;

  // Return true if explicit update keywords OR minimal structure with questions OR conversation-based updates
  return hasUpdateKeywords || (hasMinimalStructure && hasQuestions) || (hasConversationContext && hasUpdateKeywords);
};

const fixMalformedJson = (jsonStr: string): string | null => {
  try {
    let fixed = jsonStr
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/\\n/g, '\\n')
      .replace(/\\r/g, '\\r')
      .replace(/\\t/g, '\\t');

    JSON.parse(fixed);
    return fixed;
  } catch (e) {
    console.log('❌ Could not fix malformed JSON');
    return null;
  }
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
  
  // If text is empty after cleaning, provide a default message with conversation awareness
  if (!cleanText) {
    cleanText = "Here's your automation configuration based on our conversation:";
  }
  
  return cleanText;
};
