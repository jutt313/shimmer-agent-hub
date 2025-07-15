
import { supabase } from '@/integrations/supabase/client';

export interface PlatformCredential {
  field: string;
  placeholder: string;
  link: string;
  why_needed: string;
}

export interface PlatformConfiguration {
  platform_name: string;
  base_url: string;
  authentication: {
    type: string;
    location: string;
    parameter_name: string;
    format: string;
    field_names: string[];
    oauth2_config?: any;
  };
  automation_operations: Array<{
    name: string;
    method: string;
    path: string;
    description: string;
    sample_request?: any;
    sample_response?: any;
  }>;
  credentials: PlatformCredential[];
}

export class UniversalPlatformManager {
  /**
   * ENHANCED: Test credentials using Supabase Edge Function (fixes CORS)
   */
  static async testCredentials(
    platformName: string, 
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<{ success: boolean; message: string; response_details?: any }> {
    try {
      console.log(`🧪 EDGE FUNCTION TESTING: ${platformName} with real credentials via server-side`);
      
      // Use Supabase Edge Function to avoid CORS issues
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platformName,
          credentials,
          automationId: automationContext?.id
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        return {
          success: false,
          message: `Failed to test ${platformName} credentials: ${error.message}`,
          response_details: {
            error: error.message,
            suggestion: "Server-side credential testing failed"
          }
        };
      }

      console.log(`✅ Edge function response for ${platformName}:`, data);
      
      return {
        success: data.success,
        message: data.message,
        response_details: data.details || {}
      };

    } catch (error: any) {
      console.error(`💥 Credential testing error for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Credential testing failed for ${platformName}: ${error.message}`,
        response_details: {
          error: error.message,
          suggestion: "Please check your credentials and try again"
        }
      };
    }
  }

  /**
   * ENHANCED: Generate sample API call with real credential preview
   */
  static async generateSampleCall(
    platformName: string, 
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<any> {
    try {
      console.log(`🔧 Generating REAL sample call for ${platformName}`);
      
      const config = await this.getPlatformConfiguration(platformName, automationContext);
      const operation = config.automation_operations[0];
      
      if (!operation) {
        throw new Error(`No automation operations found for ${platformName}`);
      }

      // Build URL with real credential substitution
      let apiUrl = `${config.base_url}${operation.path}`;
      apiUrl = this.performCredentialSubstitution(apiUrl, credentials);
      
      // Build headers with real credentials
      const authHeader = this.formatAuthHeader(config.authentication, credentials);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "YusrAI-Universal-API-Tester/4.0"
      };
      
      if (authHeader && !authHeader.includes('{')) {
        headers["Authorization"] = authHeader;
      }
      
      // Add platform-specific headers
      if (platformName.toLowerCase() === 'notion' && credentials.integration_token) {
        headers['Notion-Version'] = '2022-06-28';
      }
      
      // Build request body with credential substitution
      const requestBody = this.buildRequestBody(operation.sample_request, credentials, automationContext);

      return {
        task_description: `${platformName} API operation with REAL credentials`,
        automation_context: {
          workflow_title: automationContext?.title || 'Universal Testing',
          platform_role: `${platformName} integration with real credential injection`,
          universal_system: true
        },
        request: {
          method: operation.method,
          url: apiUrl,
          headers,
          body: operation.method === 'POST' ? requestBody : null
        },
        expected_response: operation.sample_response || {
          success: true,
          message: `${platformName} operation successful with real credentials`,
          universal_testing: true
        }
      };

    } catch (error) {
      console.error(`❌ Error generating sample call for ${platformName}:`, error);
      
      return {
        task_description: `${platformName} integration with credential injection`,
        request: {
          method: "GET",
          url: `https://api.${platformName.toLowerCase()}.com/v1/test`,
          headers: {
            "Content-Type": "application/json",
            "Authorization": this.performCredentialSubstitution("Bearer {api_key}", credentials),
            "User-Agent": "YusrAI-Universal-Tester/4.0"
          }
        },
        expected_response: {
          success: true,
          message: "Universal credential testing successful"
        }
      };
    }
  }

  /**
   * FIXED: Enhanced credential substitution - REAL credential injection
   */
  private static performCredentialSubstitution(
    template: string,
    credentials: Record<string, string>
  ): string {
    let result = template;
    
    // Handle all possible credential field patterns with exact matching
    Object.entries(credentials).forEach(([fieldName, fieldValue]) => {
      if (fieldValue && fieldValue.trim()) {
        // Create regex for exact field name matching
        const regex = new RegExp(`\\{${fieldName}\\}`, 'g');
        result = result.replace(regex, fieldValue);
        
        // Also handle common variations
        const variations = [
          fieldName.toLowerCase(),
          fieldName.toUpperCase(),
          fieldName.replace(/_/g, '-'),
          fieldName.replace(/-/g, '_')
        ];
        
        variations.forEach(variation => {
          const variationRegex = new RegExp(`\\{${variation}\\}`, 'g');
          result = result.replace(variationRegex, fieldValue);
        });
      }
    });
    
    // Handle common token patterns
    const commonPatterns = [
      { pattern: /\{token\}/g, getValue: () => credentials.access_token || credentials.token || credentials.api_key || credentials.integration_token },
      { pattern: /\{api_key\}/g, getValue: () => credentials.api_key || credentials.key },
      { pattern: /\{access_token\}/g, getValue: () => credentials.access_token || credentials.token },
      { pattern: /\{bearer_token\}/g, getValue: () => credentials.bearer_token || credentials.access_token || credentials.token }
    ];
    
    commonPatterns.forEach(({ pattern, getValue }) => {
      const value = getValue();
      if (value) {
        result = result.replace(pattern, value);
      }
    });
    
    return result;
  }

  /**
   * FIXED: Enhanced authentication header building with REAL credential injection
   */
  private static formatAuthHeader(
    authConfig: any,
    credentials: Record<string, string>
  ): string {
    const format = authConfig.format || 'Bearer {token}';
    
    // Use enhanced credential substitution
    const authHeader = this.performCredentialSubstitution(format, credentials);
    
    console.log('🔧 Enhanced Auth Header:', { 
      original: format, 
      final: authHeader,
      credentials: Object.keys(credentials) 
    });
    
    return authHeader;
  }

  /**
   * NEW: Build request body with credential substitution
   */
  private static buildRequestBody(
    sampleRequest: any,
    credentials: Record<string, string>,
    automationContext?: any
  ): any {
    if (!sampleRequest) {
      return {
        test: true,
        automation_context: automationContext?.title || 'Universal Testing',
        universal_platform_manager: true
      };
    }
    
    const requestBody = JSON.parse(JSON.stringify(sampleRequest));
    const requestString = JSON.stringify(requestBody);
    const substitutedString = this.performCredentialSubstitution(requestString, credentials);
    
    return JSON.parse(substitutedString);
  }

  static async getPlatformConfiguration(
    platformName: string,
    automationContext?: any
  ): Promise<PlatformConfiguration> {
    try {
      console.log(`🔍 Getting ENHANCED platform configuration for ${platformName}`);
      
      const { data, error } = await supabase
        .from('universal_knowledge_store')
        .select('*')
        .ilike('platform_name', `%${platformName}%`)
        .eq('category', 'platform_knowledge')
        .limit(1);

      if (error) {
        console.error('Error fetching platform knowledge:', error);
        return this.generateFallbackConfiguration(platformName, automationContext);
      }

      if (!data || data.length === 0) {
        console.warn(`Platform ${platformName} not found, generating enhanced fallback`);
        return this.generateFallbackConfiguration(platformName, automationContext);
      }

      const knowledge = data[0];
      const details = knowledge.details as any;
      const apiConfig = details?.api_config || {};
      const credentialFields = knowledge.credential_fields as any[];
      
      return {
        platform_name: knowledge.platform_name || platformName,
        base_url: apiConfig.base_url || `https://api.${platformName.toLowerCase()}.com`,
        authentication: {
          type: apiConfig.auth_type || 'Bearer',
          location: 'header',
          parameter_name: 'Authorization',
          format: apiConfig.auth_config?.format || 'Bearer {api_key}',
          field_names: credentialFields?.map((c: any) => c.field) || ['api_key'],
          oauth2_config: apiConfig.oauth2_config
        },
        automation_operations: this.generateAutomationOperations(platformName, automationContext, apiConfig),
        credentials: this.formatCredentialFields(credentialFields, platformName)
      };

    } catch (error) {
      console.error(`Error getting platform configuration for ${platformName}:`, error);
      return this.generateFallbackConfiguration(platformName, automationContext);
    }
  }

  private static generateAutomationOperations(
    platformName: string,
    automationContext?: any,
    apiConfig?: any
  ): Array<any> {
    const contextTitle = automationContext?.title || 'Universal Testing';
    
    switch (platformName.toLowerCase()) {
      case 'openai':
        return [{
          name: 'Generate Content',
          method: 'POST',
          path: '/v1/chat/completions',
          description: `Generate AI content for ${contextTitle}`,
          sample_request: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Test message' }]
          }
        }];
        
      case 'notion':
        return [{
          name: 'Query Database',
          method: 'POST',
          path: '/v1/databases/{database_id}/query',
          description: `Query Notion database for ${contextTitle}`,
          sample_request: {
            filter: { property: 'Status', select: { equals: 'Active' } }
          }
        }];
        
      case 'slack':
        return [{
          name: 'Post Message',
          method: 'POST', 
          path: '/api/chat.postMessage',
          description: `Post message for ${contextTitle}`,
          sample_request: {
            channel: '#general',
            text: `Universal testing: ${contextTitle}`
          }
        }];
        
      case 'google sheets':
      case 'googlesheets':
        return [{
          name: 'Read Sheet Data',
          method: 'GET',
          path: '/v4/spreadsheets/{spreadsheet_id}/values/{sheet_name}!{range}',
          description: `Read Google Sheets data for ${contextTitle}`,
          sample_request: {}
        }];
        
      default:
        return [{
          name: `${platformName} Operation`,
          method: 'GET',
          path: '/v1/me',
          description: `${platformName} operation for ${contextTitle}`,
          sample_request: {}
        }];
    }
  }

  private static formatCredentialFields(
    credentialFields: any[],
    platformName: string
  ): PlatformCredential[] {
    if (!credentialFields || credentialFields.length === 0) {
      // Platform-specific default credentials
      switch (platformName.toLowerCase()) {
        case 'notion':
          return [
            {
              field: 'integration_token',
              placeholder: 'secret_xxx...',
              link: 'https://www.notion.so/my-integrations',
              why_needed: 'Required to access Notion API and databases'
            },
            {
              field: 'database_id',
              placeholder: 'Database ID from Notion URL',
              link: 'https://developers.notion.com/docs/working-with-databases',
              why_needed: 'Identifies which Notion database to access'
            }
          ];
          
        case 'slack':
          return [
            {
              field: 'bot_token',
              placeholder: 'xoxb-xxx...',
              link: 'https://api.slack.com/apps',
              why_needed: 'Bot token for Slack API access'
            },
            {
              field: 'channel_id',
              placeholder: 'C1234567890',
              link: 'https://slack.com/help/articles/201402297-View-channel-details',
              why_needed: 'Channel where messages will be posted'
            }
          ];
          
        case 'google sheets':
        case 'googlesheets':
          return [
            {
              field: 'service_account_json',
              placeholder: 'Service account JSON key',
              link: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
              why_needed: 'Service account for Google Sheets API access'
            },
            {
              field: 'spreadsheet_id',
              placeholder: 'Spreadsheet ID from URL',
              link: 'https://developers.google.com/sheets/api/guides/concepts',
              why_needed: 'Identifies which spreadsheet to access'
            },
            {
              field: 'sheet_name',
              placeholder: 'Sheet1',
              link: 'https://support.google.com/docs/answer/181110',
              why_needed: 'Name of the specific sheet tab'
            },
            {
              field: 'range',
              placeholder: 'A1:Z100',
              link: 'https://developers.google.com/sheets/api/guides/concepts#cell',
              why_needed: 'Cell range to read/write data'
            }
          ];
          
        default:
          return [{
            field: 'api_key',
            placeholder: `Enter your ${platformName} API key`,
            link: `https://${platformName.toLowerCase()}.com/developers`,
            why_needed: `Required for ${platformName} API access`
          }];
      }
    }

    return credentialFields.map(field => ({
      field: field.field || 'api_key',
      placeholder: field.placeholder || `Enter your ${field.field}`,
      link: field.link || `https://${platformName.toLowerCase()}.com/api`,
      why_needed: field.why_needed || `Required for ${platformName} integration`
    }));
  }

  private static generateFallbackConfiguration(
    platformName: string,
    automationContext?: any
  ): PlatformConfiguration {
    return {
      platform_name: platformName,
      base_url: `https://api.${platformName.toLowerCase()}.com`,
      authentication: {
        type: 'Bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {api_key}',
        field_names: ['api_key']
      },
      automation_operations: this.generateAutomationOperations(platformName, automationContext),
      credentials: this.formatCredentialFields([], platformName)
    };
  }
}
