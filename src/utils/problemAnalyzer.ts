
interface ProblemAnalysis {
  category: string;
  problem: string;
  solution: string;
  steps: string[];
  platforms: string[];
  error_type: string;
}

export const analyzeProblem = (userMessage: string, aiResponse: string): ProblemAnalysis | null => {
  const problemKeywords = {
    workflow: ['step', 'flow', 'process', 'sequence', 'workflow', 'missing step'],
    platform: ['gmail', 'google', 'slack', 'notion', 'openai', 'zapier', 'platform'],
    error: ['error', 'failed', 'broken', 'not working', 'issue', 'problem'],
    automation: ['automation', 'automate', 'trigger', 'when', 'then'],
    credential: ['api key', 'token', 'credential', 'auth', 'login'],
    agent: ['agent', 'ai agent', 'bot', 'assistant']
  };

  const extractedPlatforms = extractPlatforms(userMessage + ' ' + aiResponse);
  const category = detectCategory(userMessage, problemKeywords);
  const steps = extractSteps(aiResponse);
  
  if (!category) return null;

  return {
    category: category,
    problem: extractProblem(userMessage),
    solution: extractSolution(aiResponse),
    steps: steps,
    platforms: extractedPlatforms,
    error_type: category === 'error' ? 'automation_error' : 'general'
  };
};

const detectCategory = (message: string, keywords: any): string | null => {
  const lowerMessage = message.toLowerCase();
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word: string) => lowerMessage.includes(word.toLowerCase()))) {
      return category;
    }
  }
  
  return null;
};

const extractPlatforms = (text: string): string[] => {
  const platformNames = ['gmail', 'google', 'slack', 'notion', 'openai', 'zapier', 'sheets', 'drive', 'zendesk', 'hubspot', 'salesforce'];
  const found: string[] = [];
  
  platformNames.forEach(platform => {
    if (text.toLowerCase().includes(platform)) {
      found.push(platform);
    }
  });
  
  return [...new Set(found)];
};

const extractProblem = (message: string): string => {
  // Clean and extract the main problem statement
  return message.length > 200 ? message.substring(0, 200) + '...' : message;
};

const extractSolution = (response: string): string => {
  // Extract solution from AI response
  const solutionMarkers = ['solution:', 'to fix this:', 'you should:', 'suggestion:'];
  
  for (const marker of solutionMarkers) {
    const index = response.toLowerCase().indexOf(marker);
    if (index !== -1) {
      const solution = response.substring(index).split('\n')[0];
      return solution.length > 300 ? solution.substring(0, 300) + '...' : solution;
    }
  }
  
  return response.length > 200 ? response.substring(0, 200) + '...' : response;
};

const extractSteps = (response: string): string[] => {
  const steps: string[] = [];
  const lines = response.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    // Look for numbered steps or bullet points
    if (trimmed.match(/^\d+\./) || trimmed.match(/^[-*]\s/)) {
      const step = trimmed.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '');
      if (step.length > 5) {
        steps.push(step);
      }
    }
  });
  
  return steps;
};
