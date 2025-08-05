import { cleanText } from "./stringUtils";

/**
 * PHASE 3: Enhanced JSON parsing with improved extraction and cleaning
 */
export const parseStructuredResponse = (responseText: string): { structuredData: any; displayText: string } => {
  try {
    if (!responseText || typeof responseText !== 'string') {
      return { structuredData: null, displayText: responseText || '' };
    }

    // Attempt to extract JSON using regex
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/m);
    let structuredData = null;

    if (jsonMatch) {
      try {
        const jsonString = jsonMatch[1] || jsonMatch[2];
        structuredData = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
    }

    const cleanedText = cleanText(responseText);

    return { structuredData, displayText: cleanedText };
  } catch (error) {
    console.error("Error in parseStructuredResponse:", error);
    return { structuredData: null, displayText: responseText };
  }
};

/**
 * Enhanced text cleaning to remove JSON-like structures and code blocks
 */
export const cleanDisplayText = (text: string): string => {
  if (!text) return '';

  // Remove JSON-like structures
  let cleanedText = text.replace(/\{[\s\S]*?\}/g, '');

  // Remove code blocks
  cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');

  // Remove excessive whitespace
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

  return cleanedText;
};

/**
 * ENHANCED PHASE 3: Advanced YusrAI structured response parsing with comprehensive extraction
 * Handles complex nested structures and edge cases for better blueprint data extraction
 */
export const parseYusrAIStructuredResponse = (responseText: string): { 
  structuredData: any; 
  displayText: string; 
  metadata: any 
} => {
  console.log('🔍 ENHANCED: Starting advanced YusrAI response parsing');
  
  try {
    if (!responseText || typeof responseText !== 'string') {
      console.warn('⚠️ ENHANCED: Invalid response text provided');
      return { structuredData: null, displayText: responseText || '', metadata: {} };
    }

    // ENHANCED: Multiple JSON extraction patterns with better regex
    const jsonPatterns = [
      /\{[\s\S]*"execution_blueprint"[\s\S]*\}/g,
      /\{[\s\S]*"workflow"[\s\S]*\}/g,
      /\{[\s\S]*"platforms"[\s\S]*\}/g,
      /\{[\s\S]*"summary"[\s\S]*\}/g,
      /```json\n?([\s\S]*?)\n?```/g,
      /```\n?([\s\S]*?)\n?```/g,
      /\{[\s\S]*\}/g
    ];

    let bestStructuredData = null;
    let bestScore = 0;
    let yusraiPowered = false;
    let sevenSectionsValidated = false;
    
    // ENHANCED: YusrAI detection with multiple markers
    const yusraiMarkers = [
      'YusrAI',
      'seven_sections_validated',
      'execution_blueprint',
      'yusrai_powered',
      'comprehensive_workflow'
    ];
    
    yusraiPowered = yusraiMarkers.some(marker => 
      responseText.toLowerCase().includes(marker.toLowerCase())
    );

    // ENHANCED: Try each pattern with scoring system
    for (const pattern of jsonPatterns) {
      let match;
      while ((match = pattern.exec(responseText)) !== null) {
        try {
          const jsonStr = match[1] || match[0];
          const parsed = JSON.parse(jsonStr);
          
          // ENHANCED: Scoring system for best JSON structure
          let score = 0;
          
          // Score based on blueprint-relevant content
          if (parsed.execution_blueprint) score += 50;
          if (parsed.workflow && Array.isArray(parsed.workflow)) score += 40;
          if (parsed.platforms && Array.isArray(parsed.platforms)) score += 30;
          if (parsed.summary || parsed.description) score += 20;
          if (parsed.test_payloads) score += 15;
          if (parsed.steps && Array.isArray(parsed.steps)) score += 25;
          if (parsed.seven_sections_validated) {
            score += 35;
            sevenSectionsValidated = true;
          }
          if (parsed.yusrai_powered) {
            score += 30;
            yusraiPowered = true;
          }
          
          // ENHANCED: Additional quality checks
          if (parsed.workflow?.length > 0) score += parsed.workflow.length * 5;
          if (parsed.platforms?.length > 0) score += parsed.platforms.length * 3;
          if (parsed.execution_blueprint?.workflow?.length > 0) score += parsed.execution_blueprint.workflow.length * 6;
          
          console.log(`📊 ENHANCED: JSON candidate scored ${score} points with keys:`, Object.keys(parsed));
          
          if (score > bestScore) {
            bestScore = score;
            bestStructuredData = parsed;
            console.log('🎯 ENHANCED: New best structured data candidate found');
          }
          
        } catch (parseError) {
          console.log('⚠️ ENHANCED: JSON parsing failed for pattern, trying next');
          continue;
        }
      }
    }

    // ENHANCED: Fallback extraction for partial structures
    if (!bestStructuredData) {
      console.log('🔧 ENHANCED: No complete JSON found, attempting partial extraction');
      bestStructuredData = extractPartialStructuredData(responseText);
    }

    // ENHANCED: Post-processing to normalize structure
    if (bestStructuredData) {
      bestStructuredData = normalizeStructuredData(bestStructuredData);
      console.log('✅ ENHANCED: Structured data extracted and normalized');
    }

    const cleanedText = cleanDisplayText(responseText);
    
    const result = {
      structuredData: bestStructuredData,
      displayText: cleanedText,
      metadata: {
        yusrai_powered: yusraiPowered,
        seven_sections_validated: sevenSectionsValidated,
        extraction_score: bestScore,
        has_execution_blueprint: !!(bestStructuredData?.execution_blueprint),
        has_workflow: !!(bestStructuredData?.workflow),
        workflow_steps: bestStructuredData?.workflow?.length || 0,
        platforms_count: bestStructuredData?.platforms?.length || 0
      }
    };
    
    console.log('🎯 ENHANCED: Final parsing result:', {
      hasStructuredData: !!result.structuredData,
      score: bestScore,
      yusraiPowered,
      sevenSectionsValidated,
      hasExecutionBlueprint: result.metadata.has_execution_blueprint,
      workflowSteps: result.metadata.workflow_steps
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ ENHANCED: Error in YusrAI response parsing:', error);
    return {
      structuredData: null,
      displayText: cleanDisplayText(responseText),
      metadata: { parsing_error: error.message }
    };
  }
};

/**
 * ENHANCED: Extract partial structured data from text when full JSON parsing fails
 */
const extractPartialStructuredData = (text: string): any => {
  console.log('🔧 ENHANCED: Attempting partial structured data extraction');
  
  const partialData: any = {};
  
  // ENHANCED: Extract workflow steps from text patterns
  const workflowMatches = text.match(/(?:workflow|steps?):\s*\n((?:\d+\.\s*.*\n?)+)/gi);
  if (workflowMatches) {
    const steps = workflowMatches[0]
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map((line, index) => {
        const cleaned = line.replace(/^\d+\.\s*/, '').trim();
        const platformMatch = cleaned.match(/\(([^)]+)\)$/);
        return {
          step: index + 1,
          action: cleaned.replace(/\([^)]+\)$/, '').trim(),
          platform: platformMatch ? platformMatch[1] : 'system'
        };
      });
    
    if (steps.length > 0) {
      partialData.workflow = steps;
      console.log('✅ ENHANCED: Extracted workflow from text patterns');
    }
  }
  
  // ENHANCED: Extract platforms from text
  const platformMatches = text.match(/(?:platforms?|integrations?):\s*([\w\s,]+)/gi);
  if (platformMatches) {
    const platforms = platformMatches[0]
      .replace(/^[^:]+:\s*/, '')
      .split(/[,\n]/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(name => ({ name }));
    
    if (platforms.length > 0) {
      partialData.platforms = platforms;
      console.log('✅ ENHANCED: Extracted platforms from text patterns');
    }
  }
  
  // ENHANCED: Extract summary from text
  const summaryMatch = text.match(/(?:summary|description):\s*([^\n]+)/i);
  if (summaryMatch) {
    partialData.summary = summaryMatch[1].trim();
    console.log('✅ ENHANCED: Extracted summary from text patterns');
  }
  
  return Object.keys(partialData).length > 0 ? partialData : null;
};

/**
 * ENHANCED: Normalize structured data to ensure consistent format
 */
const normalizeStructuredData = (data: any): any => {
  console.log('🔧 ENHANCED: Normalizing structured data format');
  
  const normalized = { ...data };
  
  // ENHANCED: Normalize workflow format
  if (normalized.workflow && Array.isArray(normalized.workflow)) {
    normalized.workflow = normalized.workflow.map((item: any, index: number) => ({
      step: item.step || index + 1,
      action: item.action || item.name || item.description || `Step ${index + 1}`,
      platform: item.platform || item.integration || 'system',
      method: item.method || 'execute',
      parameters: item.parameters || {},
      config: item.config || {},
      headers: item.headers || {},
      data_mapping: item.data_mapping || {},
      base_url: item.base_url || item.url,
      endpoint: item.endpoint,
      ...item
    }));
  }
  
  // ENHANCED: Normalize execution_blueprint
  if (normalized.execution_blueprint) {
    if (!normalized.execution_blueprint.trigger) {
      normalized.execution_blueprint.trigger = { type: 'manual' };
    }
    
    // Normalize workflow within execution_blueprint
    if (normalized.execution_blueprint.workflow && Array.isArray(normalized.execution_blueprint.workflow)) {
      normalized.execution_blueprint.workflow = normalized.execution_blueprint.workflow.map((item: any, index: number) => ({
        step: item.step || index + 1,
        action: item.action || item.name || `Step ${index + 1}`,
        platform: item.platform || 'system',
        method: item.method || 'execute',
        ...item
      }));
    }
  }
  
  // ENHANCED: Normalize platforms
  if (normalized.platforms && Array.isArray(normalized.platforms)) {
    normalized.platforms = normalized.platforms.map((platform: any) => ({
      name: platform.name || platform.platform || 'Unknown',
      credentials: platform.credentials || [],
      config: platform.config || {},
      ...platform
    }));
  }
  
  console.log('✅ ENHANCED: Structured data normalization completed');
  return normalized;
};
