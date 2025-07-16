
export interface StructuredResponse {
  summary?: string;
  steps?: string[];
  platforms?: Array<{
    name: string;
    credentials: Array<{
      field: string;
      why_needed: string;
      link?: string;
    }>;
  }>;
  automation_blueprint?: any;
  api_configurations?: any[];
  agents?: Array<{
    name: string;
    role: string;
    why_needed: string;
  }>;
  clarification_questions?: string[];
  conversation_updates?: any;
}

export function parseStructuredResponse(responseText: string): StructuredResponse | null {
  try {
    console.log('🔍 Parsing structured response from text:', responseText.substring(0, 200));
    
    // First try to extract JSON from the response
    const jsonMatches = responseText.match(/\{[\s\S]*\}/g);
    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed && (parsed.platforms || parsed.steps || parsed.summary)) {
            console.log('✅ Found structured data in JSON:', parsed);
            return parsed;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // If no JSON found, try to extract structured information from text
    const structuredData: StructuredResponse = {};

    // Extract platforms mentioned in the text
    const platformMatches = responseText.match(/(?:platform|service|integration)[\s:]*([A-Za-z]+(?:\s+[A-Za-z]+)*)/gi);
    if (platformMatches) {
      const platforms = platformMatches
        .map(match => match.replace(/(?:platform|service|integration)[\s:]*/gi, '').trim())
        .filter(name => name.length > 2 && name.length < 20);
      
      if (platforms.length > 0) {
        structuredData.platforms = platforms.map(name => ({
          name: name,
          credentials: [
            {
              field: 'api_key',
              why_needed: `Required for ${name} integration`,
              link: `https://${name.toLowerCase().replace(/\s+/g, '')}.com/developers`
            }
          ]
        }));
      }
    }

    // Extract steps from numbered lists
    const stepMatches = responseText.match(/(?:^|\n)\s*\d+\.\s*(.+?)(?=\n|$)/gm);
    if (stepMatches) {
      structuredData.steps = stepMatches.map(step => 
        step.replace(/^\s*\d+\.\s*/, '').trim()
      );
    }

    // Extract summary from the beginning
    const sentences = responseText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      structuredData.summary = sentences[0].trim() + '.';
    }

    console.log('📊 Extracted structured data:', structuredData);
    return Object.keys(structuredData).length > 0 ? structuredData : null;

  } catch (error) {
    console.error('❌ Error parsing structured response:', error);
    return null;
  }
}

export function cleanDisplayText(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'Processing automation details...';
  }

  // Remove JSON blocks from display text
  let cleanText = text.replace(/\{[\s\S]*\}/g, '').trim();
  
  // Clean up extra whitespace
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  // If text is too short after cleaning, provide a default
  if (cleanText.length < 20) {
    return 'I\'m ready to help you create comprehensive automations with platform integrations.';
  }
  
  return cleanText;
}
