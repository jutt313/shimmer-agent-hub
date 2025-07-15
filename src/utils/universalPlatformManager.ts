
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
   * ENHANCED: Generate automation-context-aware sample API call
   */
  static async generateSampleCall(
    platformName: string, 
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<any> {
    try {
      console.log(`🔧 Generating AUTOMATION-CONTEXT sample call for ${platformName}`);
      
      const config = await this.getPlatformConfiguration(platformName, automationContext);
      const operation = config.automation_operations[0];
      
      if (!operation) {
        throw new Error(`No automation operations found for ${platformName}`);
      }

      // Generate automation-context-aware request
      const automationAwareRequest = {
        task_description: `${platformName} operation for automation: ${automationContext?.title || 'Automation Workflow'}`,
        automation_context: {
          workflow_title: automationContext?.title || 'Automation Workflow',
          workflow_description: automationContext?.description || 'Automated workflow process',
          platform_role: `${platformName} integration for workflow automation`
        },
        request: {
          method: operation.method,
          url: `${config.base_url}${operation.path}`,
          headers: {
            "Content-Type": "application/json",
            "Authorization": this.formatAuthHeader(config.authentication, credentials),
            "User-Agent": "YusrAI-Automation-Context/2.0"
          },
          body: operation.sample_request || {
            automation_context: true,
            workflow_integration: platformName,
            real_operation: true
          }
        },
        expected_response: operation.sample_response || {
          success: true,
          message: `${platformName} automation operation successful`,
          automation_context: true
        }
      };

      return automationAwareRequest;

    } catch (error) {
      console.error(`❌ Error generating sample call for ${platformName}:`, error);
      
      // Enhanced fallback with automation context
      return {
        task_description: `${platformName} integration for automation workflow`,
        automation_context: {
          workflow_title: automationContext?.title || 'Automation Workflow',
          platform_role: `${platformName} integration`
        },
        request: {
          method: "GET",
          url: `https://api.${platformName.toLowerCase()}.com/v1/automation`,
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer [YOUR_API_KEY]",
            "User-Agent": "YusrAI-Automation-Context/2.0"
          }
        },
        expected_response: {
          success: true,
          message: "Automation context integration successful"
        }
      };
    }
  }

  /**
   * ENHANCED: Test credentials with automation context
   */
  static async testCredentials(
    platformName: string, 
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<{ success: boolean; message: string; response_details?: any }> {
    try {
      console.log(`🧪 Testing ${platformName} credentials with AUTOMATION CONTEXT`);
      
      // Get platform configuration with automation context
      const config = await this.getPlatformConfiguration(platformName, automationContext);
      const operation = config.automation_operations[0];
      
      if (!operation) {
        return {
          success: false,
          message: `No automation operations configured for ${platformName}`
        };
      }

      // Build authentication header
      const authHeader = this.formatAuthHeader(config.authentication, credentials);
      
      // Make automation-context-aware test request
      const testUrl = `${config.base_url}${operation.path}`;
      const response = await fetch(testUrl, {
        method: operation.method === 'POST' ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'User-Agent': 'YusrAI-Automation-Test/2.0'
        },
        body: operation.method === 'POST' ? JSON.stringify(operation.sample_request || {
          test: true,
          automation_context: automationContext?.title || 'Test Automation'
        }) : undefined
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (response.ok || response.status === 200 || response.status === 201) {
        return {
          success: true,
          message: `✅ ${platformName} credentials work perfectly with automation context!`,
          response_details: {
            status: response.status,
            data: responseData,
            automation_ready: true,
            operation_tested: operation.name,
            context_aware: true
          }
        };
      } else {
        return {
          success: false,
          message: `❌ ${platformName} credentials test failed: ${response.status} ${response.statusText}`,
          response_details: {
            status: response.status,
            error: responseData,
            suggestion: "Please check your credentials and try again"
          }
        };
      }

    } catch (error: any) {
      console.error(`💥 Error testing ${platformName} credentials:`, error);
      
      return {
        success: false,
        message: `Connection test failed for ${platformName}: ${error.message}`,
        response_details: {
          error: error.message,
          suggestion: "Please verify your credentials and network connection"
        }
      };
    }
  }

  /**
   * ENHANCED: Get comprehensive platform configuration with automation context
   */
  static async getPlatformConfiguration(
    platformName: string,
    automationContext?: any
  ): Promise<PlatformConfiguration> {
    try {
      console.log(`🔍 Getting ENHANCED platform configuration for ${platformName} with automation context`);
      
      // Get platform from universal knowledge store
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
        console.warn(`Platform ${platformName} not found in knowledge store, generating enhanced fallback`);
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
          format: apiConfig.auth_config?.format || 'Bearer {token}',
          field_names: credentialFields?.map((c: any) => c.field) || ['api_key', 'access_token'],
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

  /**
   * ENHANCED: Generate real automation operations based on context
   */
  private static generateAutomationOperations(
    platformName: string,
    automationContext?: any,
    apiConfig?: any
  ): Array<any> {
    const contextTitle = automationContext?.title || 'Automation Workflow';
    const contextDesc = automationContext?.description || 'Automated process';
    
    // Platform-specific REAL operations
    switch (platformName.toLowerCase()) {
      case 'openai':
        return [{
          name: 'Generate AI Content',
          method: 'POST',
          path: '/v1/chat/completions',
          description: `Generate AI content for ${contextTitle}`,
          sample_request: {
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Process this automation data: ${contextDesc}`
            }]
          },
          sample_response: {
            choices: [{ message: { content: 'AI-generated content based on automation context' } }]
          }
        }];
        
      case 'notion':
        return [{
          name: 'Query Database',
          method: 'POST',
          path: '/v1/databases/{database_id}/query',
          description: `Query Notion database for ${contextTitle}`,
          sample_request: {
            filter: {
              property: 'Status',
              select: { equals: 'Active' }
            }
          },
          sample_response: {
            results: [{ properties: { Name: { title: [{ text: { content: 'Automation Data' } }] } } }]
          }
        }];
        
      case 'gmail':
        return [{
          name: 'Send Email',
          method: 'POST',
          path: '/gmail/v1/users/me/messages/send',
          description: `Send email for ${contextTitle}`,
          sample_request: {
            raw: 'base64_encoded_email_content'
          },
          sample_response: {
            id: 'email_id',
            threadId: 'thread_id'
          }
        }];
        
      case 'slack':
        return [{
          name: 'Post Message',
          method: 'POST', 
          path: '/api/chat.postMessage',
          description: `Post Slack message for ${contextTitle}`,
          sample_request: {
            channel: '#automation',
            text: `Automation update: ${contextDesc}`
          },
          sample_response: {
            ok: true,
            ts: 'timestamp'
          }
        }];
        
      default:
        return [{
          name: `${platformName} Operation`,
          method: 'POST',
          path: '/v1/automation/operation',
          description: `${platformName} operation for ${contextTitle}`,
          sample_request: {
            automation_context: contextDesc,
            operation_type: 'workflow_automation'
          },
          sample_response: {
            success: true,
            operation_id: 'automation_op_id'
          }
        }];
    }
  }

  /**
   * Format credential fields with enhanced structure
   */
  private static formatCredentialFields(
    credentialFields: any[],
    platformName: string
  ): PlatformCredential[] {
    if (!credentialFields || credentialFields.length === 0) {
      return [{
        field: 'api_key',
        placeholder: `Enter your ${platformName} API key`,
        link: `https://${platformName.toLowerCase()}.com/developers`,
        why_needed: `Required for ${platformName} API access and automation integration`
      }];
    }

    return credentialFields.map(field => ({
      field: field.field || 'api_key',
      placeholder: field.placeholder || `Enter your ${field.field}`,
      link: field.link || `https://${platformName.toLowerCase()}.com/api`,
      why_needed: field.why_needed || `Required for ${platformName} integration`
    }));
  }

  /**
   * Generate enhanced fallback configuration
   */
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
      credentials: [{
        field: 'api_key',
        placeholder: `Enter your ${platformName} API key`,
        link: `https://${platformName.toLowerCase()}.com/developers`,
        why_needed: `Required for ${platformName} automation integration`
      }]
    };
  }

  /**
   * Format authentication header
   */
  private static formatAuthHeader(
    authConfig: any,
    credentials: Record<string, string>
  ): string {
    const format = authConfig.format || 'Bearer {api_key}';
    let authHeader = format;
    
    // Replace credential placeholders
    Object.entries(credentials).forEach(([key, value]) => {
      authHeader = authHeader.replace(`{${key}}`, value);
    });
    
    return authHeader;
  }
}
