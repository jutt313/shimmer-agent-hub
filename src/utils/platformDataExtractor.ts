
import { supabase } from '@/integrations/supabase/client';

export interface PlatformCredentialField {
  field: string;
  placeholder: string;
  link: string;
  why_needed: string;
  required?: boolean;
  type?: string;
}

export interface ExtractedPlatformData {
  platformName: string;
  credentials: PlatformCredentialField[];
  description?: string;
  apiUrl?: string;
}

export class PlatformDataExtractor {
  /**
   * Extract platform credentials from automation responses structured data
   */
  static async extractPlatformCredentials(
    automationId: string,
    platformName: string
  ): Promise<PlatformCredentialField[]> {
    try {
      console.log(`🔍 Extracting platform credentials for ${platformName} from automation ${automationId}`);
      
      // Get the latest automation response with structured data
      const { data: responseData, error } = await supabase
        .from('automation_responses')
        .select('structured_data, created_at')
        .eq('automation_id', automationId)
        .not('structured_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5); // Get recent responses to find platform data

      if (error) {
        console.error('❌ Error fetching automation responses:', error);
        return [];
      }

      if (!responseData || responseData.length === 0) {
        console.log('⚠️ No structured data found in automation responses');
        return [];
      }

      // Search through responses for platform data
      for (const response of responseData) {
        const structuredData = response.structured_data;
        
        if (structuredData?.platforms && structuredData.platforms[platformName]) {
          const platformData = structuredData.platforms[platformName];
          console.log(`✅ Found platform data for ${platformName}:`, platformData);
          
          if (platformData.credentials && Array.isArray(platformData.credentials)) {
            return platformData.credentials.map((cred: any) => ({
              field: cred.field || cred.name || 'unknown_field',
              placeholder: cred.placeholder || `Enter your ${cred.field || 'credential'}`,
              link: cred.link || cred.documentation_url || '',
              why_needed: cred.why_needed || cred.description || `Required for ${platformName} integration`,
              required: cred.required !== false,
              type: cred.type || 'string'
            }));
          }
        }
        
        // Also check if platform data is in workflow steps
        if (structuredData?.workflow_steps) {
          for (const step of structuredData.workflow_steps) {
            if (step.platform === platformName && step.required_credentials) {
              console.log(`✅ Found platform credentials in workflow step for ${platformName}`);
              return step.required_credentials.map((cred: any) => ({
                field: cred.field || cred.name || 'unknown_field',
                placeholder: cred.placeholder || `Enter your ${cred.field || 'credential'}`,
                link: cred.link || '',
                why_needed: cred.why_needed || `Required for ${platformName} integration`,
                required: cred.required !== false,
                type: cred.type || 'string'
              }));
            }
          }
        }
      }

      console.log(`⚠️ No platform credentials found for ${platformName} in structured data`);
      return [];
      
    } catch (error) {
      console.error(`❌ Error extracting platform credentials for ${platformName}:`, error);
      return [];
    }
  }

  /**
   * Extract all platform data from automation
   */
  static async extractAllPlatformData(automationId: string): Promise<ExtractedPlatformData[]> {
    try {
      const { data: responseData, error } = await supabase
        .from('automation_responses')
        .select('structured_data')
        .eq('automation_id', automationId)
        .not('structured_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !responseData || responseData.length === 0) {
        return [];
      }

      const structuredData = responseData[0].structured_data;
      const platformsData: ExtractedPlatformData[] = [];

      if (structuredData?.platforms) {
        for (const [platformName, platformInfo] of Object.entries(structuredData.platforms)) {
          const info = platformInfo as any;
          
          if (info.credentials && Array.isArray(info.credentials)) {
            platformsData.push({
              platformName,
              credentials: info.credentials.map((cred: any) => ({
                field: cred.field || cred.name || 'unknown_field',
                placeholder: cred.placeholder || `Enter your ${cred.field || 'credential'}`,
                link: cred.link || '',
                why_needed: cred.why_needed || `Required for ${platformName} integration`,
                required: cred.required !== false,
                type: cred.type || 'string'
              })),
              description: info.description,
              apiUrl: info.api_url
            });
          }
        }
      }

      return platformsData;
      
    } catch (error) {
      console.error('❌ Error extracting all platform data:', error);
      return [];
    }
  }

  /**
   * Generate default credential fields for a platform if none found
   */
  static generateDefaultCredentials(platformName: string): PlatformCredentialField[] {
    const lowerPlatform = platformName.toLowerCase();
    
    // Common patterns for different platforms
    if (lowerPlatform.includes('slack')) {
      return [
        {
          field: 'bot_token',
          placeholder: 'xoxb-your-bot-token',
          link: 'https://api.slack.com/authentication/basics',
          why_needed: 'Bot token is required to send messages and interact with Slack workspace'
        }
      ];
    }
    
    if (lowerPlatform.includes('discord')) {
      return [
        {
          field: 'bot_token',
          placeholder: 'Your Discord bot token',
          link: 'https://discord.com/developers/applications',
          why_needed: 'Bot token is required to send messages to Discord servers'
        }
      ];
    }
    
    if (lowerPlatform.includes('notion')) {
      return [
        {
          field: 'integration_token',
          placeholder: 'secret_your-notion-integration-token',
          link: 'https://developers.notion.com/docs/getting-started',
          why_needed: 'Integration token is required to read and write Notion pages'
        }
      ];
    }
    
    if (lowerPlatform.includes('openai') || lowerPlatform.includes('chatgpt')) {
      return [
        {
          field: 'api_key',
          placeholder: 'sk-your-openai-api-key',
          link: 'https://platform.openai.com/api-keys',
          why_needed: 'API key is required to access OpenAI models for AI functionality'
        }
      ];
    }
    
    // Generic fallback
    return [
      {
        field: 'api_key',
        placeholder: `Enter your ${platformName} API key`,
        link: '',
        why_needed: `API key is required for ${platformName} integration`
      }
    ];
  }
}

console.log('✅ PlatformDataExtractor loaded for dynamic credential extraction');
