
interface YusrAIResponseMetadata {
  hasStructuredData: boolean;
  yusraiPowered: boolean;
  sevenSectionsValidated: boolean;
  hasExecutionBlueprint: boolean;
  platformsCount: number;
  workflowSteps: number;
  score: number;
}

interface ParseResult {
  structuredData: any;
  metadata: YusrAIResponseMetadata;
  platformNames: string[];
}

// Enhanced platform extraction
function extractPlatformNames(data: any): string[] {
  const platforms: string[] = [];
  
  if (data?.platforms_and_credentials && Array.isArray(data.platforms_and_credentials)) {
    data.platforms_and_credentials.forEach((platform: any) => {
      if (platform?.platform && typeof platform.platform === 'string') {
        platforms.push(platform.platform);
      }
    });
  }
  
  return platforms;
}

export function parseYusrAIStructuredResponse(response: string): ParseResult {
  console.log('🔍 ENHANCED: Starting advanced YusrAI response parsing');
  
  let bestStructuredData: any = null;
  let bestScore = 0;
  let yusraiPowered = false;
  let sevenSectionsValidated = false;
  let hasExecutionBlueprint = false;
  let workflowSteps = 0;

  // Handle markdown-wrapped JSON
  let jsonString = response.trim();
  if (jsonString.startsWith('```json') && jsonString.endsWith('```')) {
    jsonString = jsonString.slice(7, -3).trim();
    console.log('🔧 ENHANCED: Removed ```json markdown wrapper');
  } else if (jsonString.startsWith('```') && jsonString.endsWith('```')) {
    jsonString = jsonString.slice(3, -3).trim();
    console.log('🔧 ENHANCED: Removed ``` markdown wrapper');
  }

  // Try to parse the main JSON
  try {
    const parsed = JSON.parse(jsonString);
    const score = calculateStructureScore(parsed);
    
    console.log(`📊 ENHANCED: JSON candidate scored ${score} points with keys: [${Object.keys(parsed).join(', ')}]`);
    
    if (score > bestScore) {
      console.log('🎯 ENHANCED: New best structured data candidate found');
      bestScore = score;
      bestStructuredData = parsed;
    }
  } catch (parseError) {
    console.log('⚠️ ENHANCED: JSON parsing failed for pattern, trying next');
  }

  // If no complete JSON found, try partial extraction
  if (!bestStructuredData) {
    console.log('🔧 ENHANCED: No complete JSON found, attempting partial extraction');
    bestStructuredData = attemptPartialExtraction(response);
    if (bestStructuredData) {
      bestScore = calculateStructureScore(bestStructuredData);
    }
  }

  // Normalize the structured data if found
  if (bestStructuredData && typeof bestStructuredData === 'object') {
    console.log('🔧 ENHANCED: Normalizing structured data format');
    bestStructuredData = normalizeStructuredData(bestStructuredData);
    console.log('✅ ENHANCED: Structured data normalization completed');
    
    // Calculate metadata
    const requiredSections = ['summary', 'step_by_step_explanation', 'platforms_and_credentials', 'clarification_questions', 'ai_agents', 'test_payloads', 'execution_blueprint'];
    const presentSections = requiredSections.filter(section => bestStructuredData[section]);
    
    // Smart validation - not requiring all 7 sections
    if (bestStructuredData.summary) {
      yusraiPowered = true;
      
      // Check if it's a comprehensive automation response
      if (presentSections.includes('step_by_step_explanation') && 
          presentSections.includes('platforms_and_credentials') && 
          presentSections.length >= 3) {
        sevenSectionsValidated = true;
      }
      
      // Check for execution blueprint
      if (bestStructuredData.execution_blueprint && 
          bestStructuredData.execution_blueprint.workflow && 
          Array.isArray(bestStructuredData.execution_blueprint.workflow)) {
        hasExecutionBlueprint = true;
        workflowSteps = bestStructuredData.execution_blueprint.workflow.length;
      }
    }
    
    console.log('✅ ENHANCED: Structured data extracted and normalized');
  }

  const platformNames = bestStructuredData ? extractPlatformNames(bestStructuredData) : [];
  
  const finalResult = {
    hasStructuredData: !!bestStructuredData,
    score: bestScore,
    yusraiPowered,
    sevenSectionsValidated,
    hasExecutionBlueprint,
    workflowSteps
  };

  console.log('🎯 ENHANCED: Final parsing result:', finalResult);

  return {
    structuredData: bestStructuredData,
    metadata: {
      ...finalResult,
      platformsCount: platformNames.length
    },
    platformNames
  };
}

function calculateStructureScore(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  
  let score = 0;
  
  // Essential sections scoring
  if (data.summary) score += 20;
  if (data.step_by_step_explanation) score += 15;
  if (data.platforms_and_credentials) score += 15;
  if (data.execution_blueprint) score += 15;
  
  // Additional sections
  if (data.clarification_questions) score += 10;
  if (data.ai_agents) score += 10;
  if (data.test_payloads) score += 10;
  
  // Quality bonuses
  if (data.execution_blueprint?.workflow && Array.isArray(data.execution_blueprint.workflow)) {
    score += data.execution_blueprint.workflow.length * 2;
  }
  
  if (data.platforms_and_credentials && Array.isArray(data.platforms_and_credentials)) {
    score += data.platforms_and_credentials.length * 3;
  }
  
  return score;
}

function attemptPartialExtraction(response: string): any | null {
  console.log('🔧 ENHANCED: Attempting partial structured data extraction');
  
  // Look for JSON-like structures in the response
  const jsonPattern = /\{[\s\S]*?\}/g;
  const matches = response.match(jsonPattern);
  
  if (matches) {
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match);
        if (parsed && typeof parsed === 'object' && parsed.summary) {
          return parsed;
        }
      } catch (e) {
        // Continue trying other matches
      }
    }
  }
  
  return null;
}

function normalizeStructuredData(data: any): any {
  // Ensure arrays are properly formatted
  if (data.step_by_step_explanation && !Array.isArray(data.step_by_step_explanation)) {
    if (typeof data.step_by_step_explanation === 'string') {
      data.step_by_step_explanation = [data.step_by_step_explanation];
    }
  }
  
  if (data.platforms_and_credentials && !Array.isArray(data.platforms_and_credentials)) {
    data.platforms_and_credentials = [];
  }
  
  if (data.clarification_questions && !Array.isArray(data.clarification_questions)) {
    if (typeof data.clarification_questions === 'string') {
      data.clarification_questions = [data.clarification_questions];
    }
  }
  
  if (data.ai_agents && !Array.isArray(data.ai_agents)) {
    data.ai_agents = [];
  }
  
  return data;
}
