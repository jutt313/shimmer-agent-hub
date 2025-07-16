
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// FRESH AI CONFIG CREDENTIAL TESTER
class FreshAICredentialTester {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Get automation context for testing
   */
  async getAutomationContext(automationId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single();

      if (error) {
        console.error('Failed to get automation context:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception getting automation context:', error);
      return null;
    }
  }

  /**
   * Enhanced credential validation with automation context
   */
  validateCredentialFormat(platformName: string, credentials: Record<string, string>, automationContext: any): { valid: boolean; message: string } {
    console.log(`🔍 Validating credentials for ${platformName} in automation context`);
    
    const platform = platformName.toLowerCase();
    
    switch (platform) {
      case 'openai':
        const openaiKey = credentials.api_key || credentials.key;
        if (!openaiKey) return { valid: false, message: `OpenAI API key required for automation: ${automationContext?.title || 'Workflow'}` };
        if (!openaiKey.startsWith('sk-')) return { valid: false, message: 'OpenAI API key must start with "sk-"' };
        if (openaiKey.length < 20) return { valid: false, message: 'OpenAI API key appears invalid (too short)' };
        return { valid: true, message: `OpenAI API key validated for automation: ${automationContext?.title || 'Workflow'}` };
        
      case 'typeform':
        const typeformToken = credentials.personal_access_token || credentials.token;
        if (!typeformToken) return { valid: false, message: `Typeform token required for automation: ${automationContext?.title || 'Form Workflow'}` };
        if (!typeformToken.startsWith('tfp_')) return { valid: false, message: 'Typeform token must start with "tfp_"' };
        return { valid: true, message: `Typeform token validated for automation: ${automationContext?.title || 'Form Workflow'}` };
        
      case 'notion':
        const notionToken = credentials.access_token || credentials.token;
        if (!notionToken) return { valid: false, message: `Notion token required for automation: ${automationContext?.title || 'Database Workflow'}` };
        return { valid: true, message: `Notion token validated for automation: ${automationContext?.title || 'Database Workflow'}` };
        
      default:
        const hasCredentials = Object.values(credentials).some(val => val && val.trim());
        if (!hasCredentials) return { valid: false, message: `${platformName} credentials required for automation: ${automationContext?.title || 'Workflow'}` };
        return { valid: true, message: `${platformName} credentials validated for automation: ${automationContext?.title || 'Workflow'}` };
    }
  }

  /**
   * Build authentication headers with fresh AI config
   */
  buildFreshAIAuthHeaders(aiConfig: any, credentials: Record<string, string>, platformName: string): {headers: Record<string, string>, url: string, body?: any} {
    console.log(`🔑 Building fresh AI auth headers for ${platformName}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-FreshAI-Tester/1.0',
      'Accept': 'application/json'
    };

    let testUrl = aiConfig.base_url + aiConfig.test_endpoint.path;
    let requestBody = aiConfig.test_endpoint.body || null;
    
    // Use AI config authentication settings
    const authConfig = aiConfig.authentication || {};
    const testEndpoint = aiConfig.test_endpoint || {};
    
    // Apply headers from AI config
    if (testEndpoint.headers) {
      Object.keys(testEndpoint.headers).forEach(headerKey => {
        let headerValue = testEndpoint.headers[headerKey];
        
        // Replace credential placeholders with real values
        Object.keys(credentials).forEach(credKey => {
          if (credentials[credKey]) {
            headerValue = headerValue.replace(`{${credKey}}`, credentials[credKey]);
          }
        });
        
        headers[headerKey] = headerValue;
      });
    }
    
    // Fallback authentication if not in test endpoint headers
    if (!headers['Authorization'] && authConfig.type) {
      const firstCredValue = Object.values(credentials)[0];
      if (firstCredValue) {
        switch (authConfig.type.toLowerCase()) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${firstCredValue}`;
            break;
          case 'basic':
            headers['Authorization'] = `Basic ${btoa(firstCredValue)}`;
            break;
          case 'api_key':
            if (authConfig.location === 'header') {
              headers[authConfig.parameter_name || 'X-API-Key'] = firstCredValue;
            } else if (authConfig.location === 'query') {
              testUrl += `?${authConfig.parameter_name || 'api_key'}=${firstCredValue}`;
            }
            break;
          default:
            headers['Authorization'] = `Bearer ${firstCredValue}`;
        }
      }
    }

    return { headers, url: testUrl, body: requestBody };
  }

  /**
   * Perform real API test with fresh AI config
   */
  async performFreshAIAPITest(aiConfig: any, credentials: Record<string, string>, platformName: string, automationContext: any): Promise<any> {
    console.log(`📡 Making REAL API call to ${platformName} with fresh AI config`);
    
    try {
      const { headers, url, body } = this.buildFreshAIAuthHeaders(aiConfig, credentials, platformName);
      
      console.log(`🔗 Testing fresh AI endpoint: ${aiConfig.test_endpoint.method} ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: aiConfig.test_endpoint.method || 'GET',
        headers,
        signal: AbortSignal.timeout(15000),
        ...(body && { body: JSON.stringify(body) })
      });
      const requestTime = Date.now() - startTime;

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText.substring(0, 200);
      }

      console.log(`📊 Fresh AI API Response: Status ${response.status}, Time ${requestTime}ms`);

      return {
        success: this.analyzeFreshAIResponse(response, responseData, aiConfig, platformName, automationContext),
        status_code: response.status,
        response_data: responseData,
        request_time_ms: requestTime,
        endpoint_tested: url,
        method_used: aiConfig.test_endpoint.method || 'GET',
        automation_context: automationContext?.title || 'Default',
        fresh_ai_config: true
      };

    } catch (error: any) {
      console.error(`💥 Fresh AI API call failed for ${platformName}:`, error);
      
      return {
        success: false,
        status_code: 0,
        response_data: error.message,
        endpoint_tested: 'connection_failed',
        error_type: 'network_error',
        automation_context: automationContext?.title || 'Default',
        fresh_ai_config: true
      };
    }
  }

  /**
   * Analyze API response with fresh AI config
   */
  analyzeFreshAIResponse(response: Response, responseData: any, aiConfig: any, platformName: string, automationContext: any): boolean {
    console.log(`🔍 Analyzing fresh AI API response for ${platformName}`);
    
    const status = response.status;
    
    if (status >= 200 && status < 300) {
      const testEndpoint = aiConfig.test_endpoint || {};
      const successIndicators = testEndpoint.expected_success_indicators || ['success', 'data', 'user'];
      const errorIndicators = testEndpoint.expected_error_indicators || ['error', 'invalid', 'unauthorized'];
      
      const responseString = JSON.stringify(responseData).toLowerCase();
      
      // Check for success indicators
      const hasSuccessIndicators = successIndicators.some((indicator: string) =>
        responseString.includes(indicator.toLowerCase())
      );
      
      // Check for error indicators
      const hasErrorIndicators = errorIndicators.some((indicator: string) =>
        responseString.includes(indicator.toLowerCase())
      );
      
      if (hasSuccessIndicators || !hasErrorIndicators) {
        console.log(`✅ ${platformName} fresh AI success - Ready for: ${automationContext?.title || 'Workflow'}`);
        return true;
      }
      
      console.log(`⚠️ ${platformName} returned 2xx but with error indicators for automation: ${automationContext?.title || 'Workflow'}`);
      return false;
    }
    
    console.log(`❌ ${platformName} fresh AI failure - Status ${status} for: ${automationContext?.title || 'Workflow'}`);
    return false;
  }

  /**
   * Generate intelligent error messages with automation context
   */
  generateFreshAIErrorMessage(platformName: string, testResult: any, automationContext: any): string {
    const platform = platformName.toLowerCase();
    const status = testResult.status_code;
    const workflowName = automationContext?.title || 'your automation workflow';
    
    switch (platform) {
      case 'openai':
        if (status === 401) return `OpenAI authentication failed for ${workflowName}. Please verify your API key starts with "sk-" and is active.`;
        if (status === 429) return `OpenAI rate limit exceeded for ${workflowName}. Please wait before retrying.`;
        if (status === 403) return `OpenAI access denied for ${workflowName}. Check your account billing and status.`;
        return `OpenAI API error (${status}) for ${workflowName}. Please verify your API key and account.`;
        
      case 'typeform':
        if (status === 401) return `Typeform authentication failed for ${workflowName}. Please verify your Personal Access Token starts with "tfp_".`;
        if (status === 403) return `Typeform access denied for ${workflowName}. Check your token permissions and scope.`;
        return `Typeform API error (${status}) for ${workflowName}. Please verify your Personal Access Token.`;
        
      case 'notion':
        if (status === 401) return `Notion authentication failed for ${workflowName}. Please verify your integration token.`;
        if (status === 403) return `Notion access denied for ${workflowName}. Check your integration permissions and workspace access.`;
        return `Notion API error (${status}) for ${workflowName}. Please verify your integration token and permissions.`;
        
      default:
        if (status === 401) return `${platformName} authentication failed for ${workflowName}. Please verify your credentials.`;
        if (status === 403) return `${platformName} access denied for ${workflowName}. Check your account permissions.`;
        if (status === 429) return `${platformName} rate limit exceeded for ${workflowName}. Please wait before retrying.`;
        if (status === 0) return `Failed to connect to ${platformName} for ${workflowName}. Check your internet connection.`;
        return `${platformName} API error (${status}) for ${workflowName}. Please check your credentials and try again.`;
    }
  }

  /**
   * Main fresh AI testing function
   */
  async testPlatformCredentialsWithFreshAI(
    platformName: string,
    credentials: Record<string, string>,
    automationId?: string,
    aiGeneratedConfig?: any
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`🚀 Starting FRESH AI test for ${platformName}`);

    try {
      // Get automation context
      const automationContext = automationId ? await this.getAutomationContext(automationId) : null;
      console.log(`📋 Automation context loaded: ${automationContext?.title || 'No context'}`);

      // Step 1: Validate credential format with automation context
      const formatValidation = this.validateCredentialFormat(platformName, credentials, automationContext);
      if (!formatValidation.valid) {
        console.log(`❌ Credential format validation failed for ${platformName}`);
        return {
          success: false,
          message: formatValidation.message,
          details: {
            validation_failed: true,
            platform: platformName,
            automation_context: automationContext?.title || 'None',
            total_time_ms: Date.now() - startTime
          }
        };
      }

      console.log(`✅ Credential format validation passed for ${platformName} with automation context`);

      // Step 2: Use AI-generated config or create fallback
      let config = aiGeneratedConfig;
      if (!config) {
        console.log(`⚠️ No AI config provided, creating fallback for ${platformName}`);
        config = this.createFreshAIFallback(platformName, automationContext);
      }

      console.log(`📋 Fresh AI configuration loaded for ${platformName}`);

      // Step 3: Perform real fresh AI API test
      const testResult = await this.performFreshAIAPITest(config, credentials, platformName, automationContext);
      const totalTime = Date.now() - startTime;

      console.log(`🏁 Fresh AI testing completed for ${platformName} in ${totalTime}ms - ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: testResult.success,
        message: testResult.success 
          ? `✅ ${platformName} credentials verified successfully with fresh AI for automation: ${automationContext?.title || 'Workflow'}! Ready for execution.`
          : this.generateFreshAIErrorMessage(platformName, testResult, automationContext),
        details: {
          // Real test results
          endpoint_tested: testResult.endpoint_tested,
          method_used: testResult.method_used,
          status_code: testResult.status_code,
          request_time_ms: testResult.request_time_ms,
          total_time_ms: totalTime,
          
          // Automation context information
          automation_title: automationContext?.title || 'No automation context',
          automation_description: automationContext?.description || 'Fresh AI testing',
          platform: platformName,
          config_source: 'fresh_ai_generated',
          base_url: config.base_url,
          
          // Response preview (sanitized)
          api_response_preview: this.sanitizeResponse(testResult.response_data),
          
          // Testing markers
          fresh_ai_test: true,
          format_validated: true,
          automation_aware: true,
          real_workflow_test: true
        }
      };

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 Fresh AI testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Fresh AI testing system error for ${platformName}: ${error.message}`,
        details: {
          error_details: error.message,
          total_time_ms: totalTime,
          platform: platformName,
          system_error: true,
          fresh_ai_aware: true
        }
      };
    }
  }

  /**
   * Create fresh AI fallback config
   */
  private createFreshAIFallback(platformName: string, automationContext: any): any {
    console.log(`⚠️ Creating fresh AI fallback for ${platformName}`);
    
    const platform = platformName.toLowerCase();
    const realConfigs = {
      'openai': {
        platform_name: 'OpenAI',
        base_url: 'https://api.openai.com',
        test_endpoint: { 
          method: 'POST', 
          path: '/v1/chat/completions',
          headers: { 'Authorization': 'Bearer {api_key}', 'Content-Type': 'application/json' },
          body: {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `Fresh AI automation test: ${automationContext?.title || 'Processing'}` },
              { role: 'user', content: 'Test fresh AI automation workflow processing' }
            ],
            max_tokens: 50
          },
          expected_success_indicators: ['choices', 'message', 'content'],
          expected_error_indicators: ['error', 'invalid', 'unauthorized']
        },
        authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' }
      },
      'typeform': {
        platform_name: 'Typeform', 
        base_url: 'https://api.typeform.com',
        test_endpoint: { 
          method: 'GET', 
          path: '/me',
          headers: { 'Authorization': 'Bearer {personal_access_token}' },
          expected_success_indicators: ['alias', 'account_id', 'language'],
          expected_error_indicators: ['error', 'invalid', 'unauthorized']
        },
        authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' }
      },
      'notion': {
        platform_name: 'Notion',
        base_url: 'https://api.notion.com',
        test_endpoint: { 
          method: 'GET', 
          path: '/v1/users/me',
          headers: { 'Authorization': 'Bearer {access_token}', 'Notion-Version': '2022-06-28' },
          expected_success_indicators: ['name', 'id', 'type'],
          expected_error_indicators: ['error', 'invalid', 'unauthorized']
        },
        authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' }
      }
    };

    return realConfigs[platform] || {
      platform_name: platformName,
      base_url: `https://api.${platform.replace(/\s+/g, '')}.com`,
      test_endpoint: { 
        method: 'GET', 
        path: '/me',
        headers: { 'Authorization': 'Bearer {api_key}' },
        expected_success_indicators: ['success', 'data', 'user'],
        expected_error_indicators: ['error', 'invalid', 'unauthorized']
      },
      authentication: { type: 'Bearer', location: 'header', parameter_name: 'Authorization' }
    };
  }

  /**
   * Sanitize response data for safe display
   */
  private sanitizeResponse(responseData: any): any {
    if (typeof responseData === 'string') {
      return responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '');
    }
    
    if (typeof responseData === 'object' && responseData !== null) {
      const keys = Object.keys(responseData).slice(0, 5);
      const preview: any = {};
      keys.forEach(key => {
        preview[key] = responseData[key];
      });
      return preview;
    }
    
    return responseData;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platformName, credentials, automationId, aiGeneratedConfig } = await req.json();

    if (!platformName || !credentials) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Platform name and credentials are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize the fresh AI credential tester
    const tester = new FreshAICredentialTester(supabase);

    // Test platform credentials with fresh AI config
    const result = await tester.testPlatformCredentialsWithFreshAI(
      platformName,
      credentials,
      automationId,
      aiGeneratedConfig
    );

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in fresh AI test-credential function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Fresh AI server error: ${error.message}`,
        details: {
          error_type: 'fresh_ai_server_error',
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
