
interface ProblemAnalysis {
  category: string;
  problem: string;
  solution: string;
  steps: string[];
  platforms: string[];
  error_type: string;
}

interface ProblemKeywords {
  [key: string]: string[];
}

export const analyzeProblem = (userMessage: string, aiResponse: string): ProblemAnalysis | null => {
  const problemKeywords: ProblemKeywords = {
    workflow: ['step', 'flow', 'process', 'sequence', 'workflow', 'missing step', 'automation', 'when', 'then', 'trigger'],
    platform: ['gmail', 'google', 'slack', 'notion', 'openai', 'zapier', 'platform', 'api', 'integration', 'connect'],
    error: ['error', 'failed', 'broken', 'not working', 'issue', 'problem', 'bug', 'fix'],
    automation: ['automation', 'automate', 'trigger', 'when', 'then', 'schedule', 'monitor', 'watch'],
    credential: ['api key', 'token', 'credential', 'auth', 'login', 'access', 'permission'],
    agent: ['agent', 'ai agent', 'bot', 'assistant', 'help', 'manage']
  };

  const extractedPlatforms = extractPlatforms(userMessage + ' ' + aiResponse);
  const category = detectCategory(userMessage, problemKeywords);
  const steps = extractSteps(aiResponse);
  
  // Only create problem analysis if it's a clear automation request with actionable steps
  if (!category || steps.length === 0) return null;

  return {
    category: category,
    problem: extractProblem(userMessage),
    solution: extractSolution(aiResponse),
    steps: steps,
    platforms: extractedPlatforms,
    error_type: category === 'error' ? 'automation_error' : 'workflow_pattern'
  };
};

const detectCategory = (message: string, keywords: ProblemKeywords): string | null => {
  const lowerMessage = message.toLowerCase();
  
  // Priority order - more specific categories first
  const categoryPriority = ['automation', 'workflow', 'platform', 'credential', 'agent', 'error'];
  
  for (const category of categoryPriority) {
    const words = keywords[category];
    if (words.some((word: string) => lowerMessage.includes(word.toLowerCase()))) {
      return category;
    }
  }
  
  return null;
};

const extractPlatforms = (text: string): string[] => {
  const platformNames = [
    'gmail', 'google', 'slack', 'discord', 'notion', 'airtable', 'zapier', 
    'microsoft', 'teams', 'trello', 'asana', 'salesforce', 'hubspot', 
    'zendesk', 'stripe', 'paypal', 'twilio', 'sendgrid', 'openai', 
    'anthropic', 'github', 'jira', 'confluence', 'zoom', 'calendly',
    'shopify', 'woocommerce', 'facebook', 'instagram', 'twitter', 
    'linkedin', 'youtube', 'aws', 'azure', 'gcp', 'dropbox', 'onedrive',
    'mailchimp', 'convertkit', 'typeform', 'surveymonkey', 'webflow', 'wordpress'
  ];
  
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  platformNames.forEach(platform => {
    if (lowerText.includes(platform)) {
      found.push(platform);
    }
  });
  
  return [...new Set(found)];
};

const extractProblem = (message: string): string => {
  // Clean and extract the main problem statement
  const cleaned = message.replace(/^Context:\s*[^-]*-\s*/, ''); // Remove context prefix
  return cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned;
};

const extractSolution = (response: string): string => {
  // Extract solution from AI response, looking for JSON or structured content
  const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed.summary || 'Structured automation solution provided';
    } catch (e) {
      // Fall through to text extraction
    }
  }

  // Look for solution indicators in text
  const solutionMarkers = ['solution:', 'to fix this:', 'you should:', 'suggestion:', 'here\'s how:'];
  
  for (const marker of solutionMarkers) {
    const index = response.toLowerCase().indexOf(marker);
    if (index !== -1) {
      const solution = response.substring(index).split('\n')[0];
      return solution.length > 300 ? solution.substring(0, 300) + '...' : solution;
    }
  }
  
  // Default to first part of response
  const firstPart = response.split('\n')[0];
  return firstPart.length > 200 ? firstPart.substring(0, 200) + '...' : firstPart;
};

const extractSteps = (response: string): string[] => {
  const steps: string[] = [];
  
  // First try to extract from JSON
  const jsonMatch = response.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.steps && Array.isArray(parsed.steps)) {
        return parsed.steps.filter((step: string) => step.length > 5);
      }
    } catch (e) {
      // Fall through to text extraction
    }
  }
  
  // Extract from text format
  const lines = response.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    // Look for numbered steps, bullet points, or step indicators
    if (trimmed.match(/^\d+\./) || 
        trimmed.match(/^[-*]\s/) || 
        trimmed.toLowerCase().startsWith('step ')) {
      
      let step = trimmed
        .replace(/^\d+\.\s*/, '')
        .replace(/^[-*]\s*/, '')
        .replace(/^step\s+\d+:?\s*/i, '');
      
      if (step.length > 10) {
        steps.push(step);
      }
    }
  });
  
  return steps;
};
