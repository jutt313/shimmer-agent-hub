
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
  is_update?: boolean;
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
        console.log('📊 Parsed data keys:', Object.keys(parsed));
        parsed.is_update = isUpdateResponse(parsed, responseText);
        return validateAndFixStructuredData(parsed);
      } catch (e) {
        console.log('❌ JSON in code block malformed, attempting fix...');
        const fixed = fixMalformedJson(jsonCodeBlockMatch[1]);
        if (fixed) {
          try {
            const parsed = JSON.parse(fixed);
            console.log('✅ Fixed and parsed JSON from code block');
            parsed.is_update = isUpdateResponse(parsed, responseText);
            return validateAndFixStructuredData(parsed);
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
          console.log('📊 Parsed data keys:', Object.keys(parsed));
          parsed.is_update = isUpdateResponse(parsed, responseText);
          return validateAndFixStructuredData(parsed);
        } catch (e) {
          console.log('❌ JSON object malformed, attempting fix...');
          const fixed = fixMalformedJson(jsonStr);
          if (fixed) {
            try {
              const parsed = JSON.parse(fixed);
              console.log('✅ Fixed and parsed JSON object');
              parsed.is_update = isUpdateResponse(parsed, responseText);
              return validateAndFixStructuredData(parsed);
            } catch (e2) {
              console.log('❌ Could not fix JSON object');
            }
          }
        }
      }
    }

    // Method 3: Extract data from text patterns as fallback
    const extractedData = extractDataFromText(responseText);
    if (extractedData && Object.keys(extractedData).length > 0) {
      console.log('✅ Extracted structured data from text patterns');
      extractedData.is_update = isUpdateResponse(extractedData, responseText);
      return validateAndFixStructuredData(extractedData);
    }

    console.log('❌ No structured data found');
    return null;
    
  } catch (error) {
    console.error('❌ Error in parseStructuredResponse:', error);
    return null;
  }
};

// New function to validate and ensure all required fields are present
const validateAndFixStructuredData = (data: any): StructuredResponse => {
  const validated: StructuredResponse = {
    summary: data.summary || "Automation workflow created",
    steps: data.steps || [],
    platforms: data.platforms || [],
    agents: data.agents || [],
    clarification_questions: data.clarification_questions || [],
    automation_blueprint: data.automation_blueprint || null,
    is_update: data.is_update || false
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

  console.log('✅ Validated structured data:', {
    hasSummary: !!validated.summary,
    stepsCount: validated.steps?.length || 0,
    platformsCount: validated.platforms?.length || 0,
    agentsCount: validated.agents?.length || 0,
    hasBlueprint: !!validated.automation_blueprint
  });

  return validated;
};

// Helper function to detect if this is an update response vs new automation
const isUpdateResponse = (parsed: any, responseText: string): boolean => {
  const updateKeywords = [
    'update', 'modify', 'change', 'adjust', 'edit', 'revise',
    'improved', 'enhanced', 'refined', 'optimized', 'fixed'
  ];
  
  const hasUpdateKeywords = updateKeywords.some(keyword => 
    responseText.toLowerCase().includes(keyword)
  );

  const hasMinimalStructure = !parsed.automation_blueprint && 
                             (!parsed.platforms || parsed.platforms.length === 0) &&
                             (!parsed.agents || parsed.agents.length === 0);

  const hasQuestions = parsed.clarification_questions && parsed.clarification_questions.length > 0;

  return hasUpdateKeywords || hasMinimalStructure || hasQuestions;
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

const extractDataFromText = (text: string): StructuredResponse | null => {
  const data: StructuredResponse = {};

  // Extract summary - more aggressive pattern matching
  const summaryMatches = [
    text.match(/(?:Summary|Automation Summary)[:\s]*\n?([^\n#]*?)(?:\n|$)/i),
    text.match(/(?:This automation|This workflow|This system)[^.]*?[.]/i),
    text.match(/^([^.\n]*automation[^.\n]*[.])/i)
  ];
  
  for (const match of summaryMatches) {
    if (match && match[1] && match[1].trim().length > 10) {
      data.summary = match[1].trim();
      break;
    }
  }

  // Extract steps with multiple patterns
  const stepsPatterns = [
    /(?:Steps?|Step-by-Step|Workflow)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*.*\n?)*)/i,
    /(?:Process|Flow)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*.*\n?)*)/i,
    /(?:How it works)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*.*\n?)*)/i
  ];

  for (const pattern of stepsPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const steps = match[1]
        .split(/(?:\d+\.|\*|\-)/)
        .filter(step => step.trim())
        .map(step => step.trim().replace(/\n/g, ' '))
        .filter(step => step.length > 5);
      
      if (steps.length > 0) {
        data.steps = steps;
        break;
      }
    }
  }

  // Enhanced platform extraction
  const platformKeywords = ['Gmail', 'Google', 'Slack', 'Discord', 'Trello', 'Asana', 'Notion', 'Zapier', 'Salesforce', 'HubSpot', 'OpenAI', 'Anthropic', 'SendGrid', 'Twilio', 'Stripe', 'PayPal', 'Zoom', 'Microsoft', 'Teams', 'Office365', 'Dropbox', 'OneDrive', 'Jira', 'Confluence', 'GitHub', 'GitLab', 'AWS', 'Azure', 'GCP'];
  
  const foundPlatforms = new Set<string>();
  platformKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      foundPlatforms.add(keyword);
    }
  });

  if (foundPlatforms.size > 0) {
    data.platforms = Array.from(foundPlatforms).map(platformName => ({
      name: platformName,
      credentials: [
        {
          field: "api_key",
          placeholder: `Enter your ${platformName} API key`,
          link: `https://${platformName.toLowerCase()}.com/developers`,
          why_needed: `Required to connect and interact with ${platformName} services`
        }
      ]
    }));
  }

  // Enhanced AI agent extraction
  const agentPatterns = [
    /(?:Agent|Bot|AI)[s]?.*?(?:recommend|suggest|need)[:\s]*\n?([\s\S]*?)(?:\n\n|\n#|$)/i,
    /(?:AI|Intelligence|Assistant|Analyzer|Manager|Handler)/gi
  ];

  const agentKeywords = ['EmailSummarizer', 'DataAnalyzer', 'ContentCreator', 'TaskManager', 'SentimentAnalyzer', 'LeadQualifier', 'CustomerSupport', 'ProjectManager', 'ReportGenerator', 'QualityChecker'];
  
  const foundAgents = new Set<string>();
  agentKeywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      foundAgents.add(keyword);
    }
  });

  // If no specific agents found, create a generic one based on context
  if (foundAgents.size === 0 && (data.summary || data.steps)) {
    foundAgents.add('AutomationAssistant');
  }

  if (foundAgents.size > 0) {
    data.agents = Array.from(foundAgents).map(agentName => ({
      name: agentName,
      role: `${agentName} specialist`,
      goal: `Handle ${agentName.toLowerCase()} related tasks automatically`,
      rules: `Follow best practices for ${agentName.toLowerCase()} operations`,
      memory: `Previous ${agentName.toLowerCase()} interactions and preferences`,
      why_needed: `Essential for automating ${agentName.toLowerCase()} workflows efficiently`
    }));
  }

  // Extract clarification questions
  const clarificationPatterns = [
    /(?:clarification|questions?|need to know)[:\s]*\n?((?:(?:\d+\.|\*|\-)\s*.*\n?)*)/i,
    /(?:Before we proceed|First, I need to understand)[:\s]*\n?([\s\S]*?)(?:\n\n|$)/i
  ];

  for (const pattern of clarificationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const questions = match[1]
        .split(/(?:\d+\.|\*|\-)/)
        .filter(q => q.trim())
        .map(q => q.trim().replace(/\n/g, ' '))
        .filter(q => q.length > 10 && q.includes('?'));
      
      if (questions.length > 0) {
        data.clarification_questions = questions;
        break;
      }
    }
  }

  console.log('📊 Extracted data from text:', {
    hasSummary: !!data.summary,
    hasSteps: !!(data.steps && data.steps.length > 0),
    hasPlatforms: !!(data.platforms && data.platforms.length > 0),
    hasAgents: !!(data.agents && data.agents.length > 0),
    hasClarificationQuestions: !!(data.clarification_questions && data.clarification_questions.length > 0)
  });

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
    cleanText = "Here's your automation configuration:";
  }
  
  return cleanText;
};
