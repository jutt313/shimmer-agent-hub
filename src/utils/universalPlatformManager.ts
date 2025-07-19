
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

// COMPREHENSIVE REAL PLATFORM CONFIGURATIONS
const REAL_PLATFORM_CONFIGS = {
  'OpenAI': {
    platform_name: 'OpenAI',
    base_url: 'https://api.openai.com',
    authentication: {
      type: 'Bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {api_key}',
      field_names: ['api_key']
    },
    credentials: [
      {
        field: 'api_key',
        placeholder: 'sk-...',
        link: 'https://platform.openai.com/api-keys',
        why_needed: 'Required to authenticate API requests to OpenAI services'
      }
    ]
  },
  'Typeform': {
    platform_name: 'Typeform',
    base_url: 'https://api.typeform.com',
    authentication: {
      type: 'Bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {personal_access_token}',
      field_names: ['personal_access_token']
    },
    credentials: [
      {
        field: 'api_key', // Frontend shows api_key but maps to personal_access_token
        placeholder: 'tfp_...',
        link: 'https://admin.typeform.com/account#/section/tokens',
        why_needed: 'Required to access Typeform responses and form data'
      }
    ]
  },
  'Google Sheets': {
    platform_name: 'Google Sheets',
    base_url: 'https://sheets.googleapis.com',
    authentication: {
      type: 'Bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {access_token}',
      field_names: ['access_token', 'spreadsheet_id']
    },
    credentials: [
      {
        field: 'api_key', // Frontend shows api_key but maps to access_token
        placeholder: 'OAuth access token',
        link: 'https://console.cloud.google.com/apis/credentials',
        why_needed: 'Required to authenticate API requests for reading/writing Google Sheets data'
      },
      {
        field: 'spreadsheet_id',
        placeholder: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        link: 'https://developers.google.com/sheets/api/guides/concepts',
        why_needed: 'Identifies which Google Sheets spreadsheet to access'
      }
    ]
  },
  'Notion': {
    platform_name: 'Notion',
    base_url: 'https://api.notion.com',
    authentication: {
      type: 'Bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {integration_token}',
      field_names: ['integration_token']
    },
    credentials: [
      {
        field: 'api_key', // Frontend shows api_key but maps to integration_token
        placeholder: 'secret_...',
        link: 'https://www.notion.so/my-integrations',
        why_needed: 'Required to access Notion databases and pages'
      }
    ]
  },
  'Slack': {
    platform_name: 'Slack',
    base_url: 'https://slack.com/api',
    authentication: {
      type: 'Bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {bot_token}',
      field_names: ['bot_token']
    },
    credentials: [
      {
        field: 'api_key', // Frontend shows api_key but maps to bot_token
        placeholder: 'xoxb-...',
        link: 'https://api.slack.com/apps',
        why_needed: 'Required to post messages and interact with Slack workspace'
      }
    ]
  },
  'GitHub': {
    platform_name: 'GitHub',
    base_url: 'https://api.github.com',
    authentication: {
      type: 'Bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {access_token}',
      field_names: ['access_token']
    },
    credentials: [
      {
        field: 'api_key', // Frontend shows api_key but maps to access_token
        placeholder: 'ghp_...',
        link: 'https://github.com/settings/tokens',
        why_needed: 'Required to access GitHub repositories and perform actions'
      }
    ]
  }
};

export class UniversalPlatformManager {
  /**
   * COMPREHENSIVE: Test credentials using real API validation
   */
  static async testCredentials(
    platformName: string, 
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<{ success: boolean; message: string; response_details?: any }> {
    try {
      console.log(`🧪 COMPREHENSIVE TESTING: ${platformName} with real API validation`);
      
      // Use Supabase Edge Function with comprehensive validation
      const { data, error } = await supabase.functions.invoke('test-credential', {
        body: {
          platformName,
          credentials,
          automationId: automationContext?.id,
          comprehensiveTest: true
        }
      });

      if (error) {
        console.error('❌ Comprehensive test error:', error);
        return {
          success: false,
          message: `Failed comprehensive testing for ${platformName}: ${error.message}`,
          response_details: {
            error: error.message,
            test_type: "comprehensive_real_api"
          }
        };
      }

      console.log(`✅ Comprehensive test response for ${platformName}:`, data);
      
      return {
        success: data.success,
        message: data.message,
        response_details: {
          ...data.details,
          test_type: "comprehensive_real_api",
          platform_validated: true
        }
      };

    } catch (error: any) {
      console.error(`💥 Comprehensive testing error for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Comprehensive testing failed for ${platformName}: ${error.message}`,
        response_details: {
          error: error.message,
          test_type: "comprehensive_real_api",
          system_error: true
        }
      };
    }
  }

  /**
   * COMPREHENSIVE: Get real platform configuration
   */
  static async getPlatformConfiguration(
    platformName: string,
    automationContext?: any
  ): Promise<PlatformConfiguration> {
    try {
      console.log(`🔍 Getting COMPREHENSIVE platform configuration for ${platformName}`);
      
      // First check if we have a real configuration
      const realConfig = REAL_PLATFORM_CONFIGS[platformName];
      if (realConfig) {
        console.log(`✅ Found real comprehensive config for ${platformName}`);
        return {
          ...realConfig,
          automation_operations: this.generateRealAutomationOperations(platformName, automationContext, realConfig)
        };
      }

      // Fallback to database lookup
      const { data, error } = await supabase
        .from('universal_knowledge_store')
        .select('*')
        .ilike('platform_name', `%${platformName}%`)
        .eq('category', 'platform_knowledge')
        .limit(1);

      if (error) {
        console.error('Error fetching platform knowledge:', error);
        return this.generateComprehensiveFallbackConfiguration(platformName, automationContext);
      }

      if (!data || data.length === 0) {
        console.warn(`Platform ${platformName} not found, generating comprehensive fallback`);
        return this.generateComprehensiveFallbackConfiguration(platformName, automationContext);
      }

      const knowledge = data[0];
      const details = knowledge.details as any;
      const apiConfig = details?.api_config || {};
      const credentialFields = knowledge.credential_fields as any[];
      
      return {
        platform_name: knowledge.platform_name || platformName,
        base_url: apiConfig.base_url || this.getRealBaseUrl(platformName),
        authentication: {
          type: apiConfig.auth_type || 'Bearer',
          location: 'header',
          parameter_name: 'Authorization',
          format: apiConfig.auth_config?.format || 'Bearer {api_key}',
          field_names: credentialFields?.map((c: any) => c.field) || ['api_key'],
          oauth2_config: apiConfig.oauth2_config
        },
        automation_operations: this.generateRealAutomationOperations(platformName, automationContext, apiConfig),
        credentials: this.formatRealCredentialFields(credentialFields, platformName)
      };

    } catch (error) {
      console.error(`Error getting comprehensive platform configuration for ${platformName}:`, error);
      return this.generateComprehensiveFallbackConfiguration(platformName, automationContext);
    }
  }

  /**
   * Generate real automation operations with comprehensive API endpoints
   */
  private static generateRealAutomationOperations(
    platformName: string,
    automationContext?: any,
    apiConfig?: any
  ): Array<any> {
    const contextTitle = automationContext?.title || 'Comprehensive Testing';
    
    switch (platformName.toLowerCase()) {
      case 'openai':
        return [{
          name: 'Generate AI Content',
          method: 'POST',
          path: '/v1/chat/completions',
          description: `Generate AI content using OpenAI for ${contextTitle}`,
          sample_request: {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Test comprehensive validation' }],
            max_tokens: 50
          },
          sample_response: {
            choices: [{ message: { content: 'Test response' } }]
          }
        }];
        
      case 'typeform':
        return [{
          name: 'Get User Profile',
          method: 'GET',
          path: '/me',
          description: `Get Typeform user profile for ${contextTitle}`,
          sample_response: {
            alias: 'user',
            account_id: '12345',
            language: 'en'
          }
        }];
        
      case 'google sheets':
        return [{
          name: 'Read Spreadsheet Data',
          method: 'GET',
          path: '/v4/spreadsheets/{spreadsheet_id}',
          description: `Read Google Sheets data for ${contextTitle}`,
          sample_response: {
            spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
            properties: { title: 'Test Sheet' }
          }
        }];
        
      case 'notion':
        return [{
          name: 'Get User Info',
          method: 'GET',
          path: '/v1/users/me',
          description: `Get Notion user info for ${contextTitle}`,
          sample_response: {
            name: 'Test User',
            id: '12345',
            type: 'person'
          }
        }];
        
      case 'slack':
        return [{
          name: 'Test Authentication',
          method: 'POST',
          path: '/auth.test',
          description: `Test Slack authentication for ${contextTitle}`,
          sample_response: {
            ok: true,
            user_id: 'U1234',
            team_id: 'T1234'
          }
        }];
        
      case 'github':
        return [{
          name: 'Get User Profile',
          method: 'GET',
          path: '/user',
          description: `Get GitHub user profile for ${contextTitle}`,
          sample_response: {
            login: 'testuser',
            id: 12345,
            node_id: 'ABC123'
          }
        }];
        
      default:
        return [{
          name: `${platformName} Operation`,
          method: 'GET',
          path: '/user',
          description: `${platformName} operation for ${contextTitle}`,
          sample_request: {},
          sample_response: { success: true }
        }];
    }
  }

  /**
   * Get real base URLs for platforms
   */
  private static getRealBaseUrl(platformName: string): string {
    const realBaseUrls: Record<string, string> = {
      'OpenAI': 'https://api.openai.com',
      'Typeform': 'https://api.typeform.com',
      'Google Sheets': 'https://sheets.googleapis.com',
      'Notion': 'https://api.notion.com',
      'Slack': 'https://slack.com/api',
      'GitHub': 'https://api.github.com',
      'Discord': 'https://discord.com/api',
      'Salesforce': 'https://login.salesforce.com',
      'HubSpot': 'https://api.hubapi.com',
      'Mailchimp': 'https://us1.api.mailchimp.com/3.0'
    };

    return realBaseUrls[platformName] || `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  /**
   * Format real credential fields with comprehensive validation
   */
  private static formatRealCredentialFields(
    credentialFields: any[],
    platformName: string
  ): PlatformCredential[] {
    // Use real config if available
    const realConfig = REAL_PLATFORM_CONFIGS[platformName];
    if (realConfig) {
      return realConfig.credentials;
    }

    if (!credentialFields || credentialFields.length === 0) {
      // Platform-specific comprehensive default credentials
      switch (platformName.toLowerCase()) {
        case 'salesforce':
          return [
            {
              field: 'access_token',
              placeholder: 'OAuth access token',
              link: 'https://help.salesforce.com/articleView?id=connected_app_create.htm',
              why_needed: 'Required to access Salesforce API and data'
            },
            {
              field: 'instance_url',
              placeholder: 'https://yourinstance.salesforce.com',
              link: 'https://help.salesforce.com/articleView?id=faq_integration_what_is_my_salesforce_url.htm',
              why_needed: 'Your Salesforce instance URL for API calls'
            }
          ];
          
        case 'hubspot':
          return [
            {
              field: 'access_token',
              placeholder: 'Private app access token',
              link: 'https://developers.hubspot.com/docs/api/private-apps',
              why_needed: 'Required to access HubSpot CRM data and perform actions'
            }
          ];
          
        case 'mailchimp':
          return [
            {
              field: 'api_key',
              placeholder: 'API key from Mailchimp',
              link: 'https://mailchimp.com/help/about-api-keys/',
              why_needed: 'Required to access Mailchimp audiences and send campaigns'
            }
          ];
          
        default:
          return [{
            field: 'api_key',
            placeholder: `Enter your ${platformName} API key`,
            link: `https://${platformName.toLowerCase()}.com/developers`,
            why_needed: `Required for ${platformName} API access with comprehensive validation`
          }];
      }
    }

    return credentialFields.map(field => ({
      field: field.field || 'api_key',
      placeholder: field.placeholder || `Enter your ${field.field}`,
      link: field.link || `https://${platformName.toLowerCase()}.com/api`,
      why_needed: field.why_needed || `Required for ${platformName} integration with comprehensive testing`
    }));
  }

  /**
   * Generate comprehensive fallback configuration
   */
  private static generateComprehensiveFallbackConfiguration(
    platformName: string,
    automationContext?: any
  ): PlatformConfiguration {
    return {
      platform_name: platformName,
      base_url: this.getRealBaseUrl(platformName),
      authentication: {
        type: 'Bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {api_key}',
        field_names: ['api_key']
      },
      automation_operations: this.generateRealAutomationOperations(platformName, automationContext),
      credentials: this.formatRealCredentialFields([], platformName)
    };
  }

  /**
   * COMPREHENSIVE: Generate sample API call with real credentials
   */
  static async generateSampleCall(
    platformName: string, 
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<any> {
    try {
      console.log(`🔧 Generating COMPREHENSIVE sample call for ${platformName}`);
      
      const config = await this.getPlatformConfiguration(platformName, automationContext);
      const operation = config.automation_operations[0];
      
      if (!operation) {
        throw new Error(`No operations found for ${platformName}`);
      }

      // Build URL with comprehensive credential substitution
      let apiUrl = `${config.base_url}${operation.path}`;
      apiUrl = this.performComprehensiveCredentialSubstitution(apiUrl, credentials);
      
      // Build headers with comprehensive authentication
      const authHeader = this.formatComprehensiveAuthHeader(config.authentication, credentials);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "YusrAI-Comprehensive-API-Tester/2.0"
      };
      
      if (authHeader && !authHeader.includes('{')) {
        headers["Authorization"] = authHeader;
      }
      
      // Add platform-specific headers for comprehensive testing
      if (platformName === 'Notion' && credentials.integration_token) {
        headers['Notion-Version'] = '2022-06-28';
      }
      
      if (platformName === 'GitHub' && credentials.access_token) {
        headers['Accept'] = 'application/vnd.github+json';
      }
      
      // Build request body with comprehensive substitution
      const requestBody = this.buildComprehensiveRequestBody(operation.sample_request, credentials, automationContext);

      return {
        task_description: `${platformName} API operation with COMPREHENSIVE real credential validation`,
        automation_context: {
          workflow_title: automationContext?.title || 'Comprehensive Testing',
          platform_role: `${platformName} integration with comprehensive validation`,
          comprehensive_system: true,
          real_api_endpoints: true
        },
        request: {
          method: operation.method,
          url: apiUrl,
          headers,
          body: operation.method === 'POST' ? requestBody : null
        },
        expected_response: operation.sample_response || {
          success: true,
          message: `${platformName} operation successful with comprehensive validation`,
          comprehensive_testing: true
        }
      };

    } catch (error) {
      console.error(`❌ Error generating comprehensive sample call for ${platformName}:`, error);
      
      return {
        task_description: `${platformName} integration with comprehensive credential validation`,
        request: {
          method: "GET",
          url: `${this.getRealBaseUrl(platformName)}/user`,
          headers: {
            "Content-Type": "application/json",
            "Authorization": this.performComprehensiveCredentialSubstitution("Bearer {api_key}", credentials),
            "User-Agent": "YusrAI-Comprehensive-Tester/2.0"
          }
        },
        expected_response: {
          success: true,
          message: "Comprehensive credential testing successful",
          comprehensive_validation: true
        }
      };
    }
  }

  /**
   * COMPREHENSIVE: Enhanced credential substitution with real validation
   */
  private static performComprehensiveCredentialSubstitution(
    template: string,
    credentials: Record<string, string>
  ): string {
    let result = template;
    
    // Handle comprehensive credential field patterns
    Object.entries(credentials).forEach(([fieldName, fieldValue]) => {
      if (fieldValue && fieldValue.trim()) {
        // Create regex for exact field name matching
        const regex = new RegExp(`\\{${fieldName}\\}`, 'g');
        result = result.replace(regex, fieldValue);
        
        // Handle comprehensive variations
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
    
    // Handle comprehensive platform-specific patterns
    const comprehensivePatterns = [
      { pattern: /\{token\}/g, getValue: () => credentials.personal_access_token || credentials.access_token || credentials.token || credentials.api_key || credentials.integration_token },
      { pattern: /\{api_key\}/g, getValue: () => credentials.api_key || credentials.key },
      { pattern: /\{access_token\}/g, getValue: () => credentials.access_token || credentials.token },
      { pattern: /\{personal_access_token\}/g, getValue: () => credentials.personal_access_token || credentials.access_token },
      { pattern: /\{integration_token\}/g, getValue: () => credentials.integration_token || credentials.access_token },
      { pattern: /\{bot_token\}/g, getValue: () => credentials.bot_token || credentials.access_token }
    ];
    
    comprehensivePatterns.forEach(({ pattern, getValue }) => {
      const value = getValue();
      if (value) {
        result = result.replace(pattern, value);
      }
    });
    
    return result;
  }

  /**
   * COMPREHENSIVE: Enhanced authentication header building
   */
  private static formatComprehensiveAuthHeader(
    authConfig: any,
    credentials: Record<string, string>
  ): string {
    const format = authConfig.format || 'Bearer {token}';
    
    // Use comprehensive credential substitution
    const authHeader = this.performComprehensiveCredentialSubstitution(format, credentials);
    
    console.log('🔧 Comprehensive Auth Header:', { 
      original: format, 
      final: authHeader,
      credentials: Object.keys(credentials) 
    });
    
    return authHeader;
  }

  /**
   * COMPREHENSIVE: Build request body with credential substitution
   */
  private static buildComprehensiveRequestBody(
    sampleRequest: any,
    credentials: Record<string, string>,
    automationContext?: any
  ): any {
    if (!sampleRequest) {
      return {
        test: true,
        automation_context: automationContext?.title || 'Comprehensive Testing',
        comprehensive_platform_manager: true,
        real_api_validation: true
      };
    }
    
    const requestBody = JSON.parse(JSON.stringify(sampleRequest));
    const requestString = JSON.stringify(requestBody);
    const substitutedString = this.performComprehensiveCredentialSubstitution(requestString, credentials);
    
    return JSON.parse(substitutedString);
  }
}
