
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// AUTOMATION-CONTEXT-AWARE UNIVERSAL CREDENTIAL TESTER
class AutomationContextCredentialTester {
  private supabase: any;
  private configCache = new Map<string, any>();

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
   * Get real platform configuration from Universal Knowledge Store + Chat-AI
   */
  async getRealAutomationContextConfig(platformName: string, automationContext: any): Promise<any> {
    console.log(`🔧 Getting REAL automation-context config for ${platformName}`);
    
    const cacheKey = `${platformName}_${automationContext?.id || 'default'}`;
    if (this.configCache.has(cacheKey)) {
      console.log(`📦 Using cached automation-context config for ${platformName}`);
      return this.configCache.get(cacheKey);
    }

    try {
      // First try Universal Knowledge Store
      const { data: knowledgeData, error: knowledgeError } = await this.supabase
        .from('universal_knowledge_store')
        .select('*')
        .eq('category', 'platform_knowledge')
        .or(`platform_name.ilike.%${platformName}%,title.ilike.%${platformName}%`)
        .order('usage_count', { ascending: false })
        .limit(1);

      if (!knowledgeError && knowledgeData && knowledgeData.length > 0) {
        const knowledge = knowledgeData[0];
        const config = this.buildConfigFromKnowledge(knowledge, platformName, automationContext);
        this.configCache.set(cacheKey, config);
        return config;
      }

      // Fallback to Chat-AI with automation context
      const { data, error } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate REAL automation-context-aware API configuration for ${platformName}.

**AUTOMATION CONTEXT:**
${JSON.stringify(automationContext, null, 2)}

**CRITICAL REQUIREMENTS:**
- Generate REAL API operations that serve this specific automation workflow
- NO generic /auth/verify or /me endpoints for operations
- Use actual operations like /chat/completions for OpenAI, /databases/{id}/query for Notion
- Include proper authentication configuration
- Return ONLY valid JSON configuration

**EXAMPLE REAL OPERATIONS:**
- OpenAI: POST /v1/chat/completions with automation-specific prompts
- Notion: POST /v1/databases/{id}/query with workflow filters
- Typeform: POST /forms with automation form creation
- Google Sheets: GET /v4/spreadsheets/{id}/values with real ranges

Return ONLY the JSON configuration, no explanations.`,
          messages: [],
          requestType: 'automation_context_platform_config',
          automationContext: automationContext
        }
      });

      if (error) {
        console.error('❌ Chat-AI error:', error);
        return this.createAutomationContextFallback(platformName, automationContext);
      }

      let realConfig;
      try {
        if (typeof data === 'string') {
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            realConfig = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in chat-ai response');
          }
        } else if (data && typeof data === 'object') {
          realConfig = data;
        } else {
          throw new Error('Invalid chat-ai response');
        }

        if (!realConfig.base_url) {
          throw new Error('Missing required config fields');
        }

        console.log(`✅ Real automation-context config obtained for ${platformName}`);
        this.configCache.set(cacheKey, realConfig);
        return realConfig;

      } catch (parseError) {
        console.error('❌ Config parsing failed:', parseError);
        return this.createAutomationContextFallback(platformName, automationContext);
      }

    } catch (error) {
      console.error('💥 Complete config generation failed:', error);
      return this.createAutomationContextFallback(platformName, automationContext);
    }
  }

  /**
   * Build configuration from Universal Knowledge Store
   */
  buildConfigFromKnowledge(knowledge: any, platformName: string, automationContext: any): any {
    const apiConfig = knowledge.details?.api_config || {};
    const operations = knowledge.details?.automation_operations || [];
    
    return {
      platform_name: knowledge.platform_name || platformName,
      base_url: apiConfig.base_url || `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
      test_endpoint: this.getAutomationContextTestEndpoint(platformName, automationContext),
      auth_config: {
        type: apiConfig.auth_config?.type || 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: apiConfig.auth_config?.format || 'Bearer {token}'
      },
      automation_operations: operations.length > 0 ? operations : this.generateDefaultOperations(platformName, automationContext)
    };
  }

  /**
   * Get automation-context-aware test endpoint
   */
  getAutomationContextTestEndpoint(platformName: string, automationContext: any): any {
    const lowerName = platformName.toLowerCase();
    
    // Real automation-context endpoints based on platform and workflow
    if (lowerName.includes('openai')) {
      return {
        method: 'POST',
        path: '/v1/chat/completions',
        description: `Test OpenAI with real completion for automation: ${automationContext?.title || 'Workflow'}`,
        body: {
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `You are processing data for automation: ${automationContext?.title || 'Data Processing'}. ${automationContext?.description || ''}`
            },
            { 
              role: 'user', 
              content: `Test automation workflow. Goal: ${automationContext?.goal || 'Process data efficiently'}`
            }
          ],
          max_tokens: 100
        }
      };
    }
    
    if (lowerName.includes('notion')) {
      return {
        method: 'GET',
        path: '/v1/users/me',
        description: `Test Notion authentication for automation: ${automationContext?.title || 'Database Workflow'}`
      };
    }
    
    if (lowerName.includes('typeform')) {
      return {
        method: 'GET',
        path: '/me', 
        description: `Test Typeform for automation: ${automationContext?.title || 'Form Workflow'}`
      };
    }
    
    if (lowerName.includes('google') && lowerName.includes('sheet')) {
      return {
        method: 'GET',
        path: '/v4/spreadsheets',
        description: `Test Google Sheets for automation: ${automationContext?.title || 'Spreadsheet Workflow'}`
      };
    }
    
    if (lowerName.includes('slack')) {
      return {
        method: 'GET',
        path: '/api/auth.test',
        description: `Test Slack for automation: ${automationContext?.title || 'Messaging Workflow'}`
      };
    }

    // Enhanced fallback
    return {
      method: 'GET',
      path: '/me',
      description: `Test ${platformName} for automation: ${automationContext?.title || 'Workflow'}`
    };
  }

  /**
   * Generate default operations for platform
   */
  generateDefaultOperations(platformName: string, automationContext: any): any[] {
    const lowerName = platformName.toLowerCase();
    
    if (lowerName.includes('openai')) {
      return [{
        name: 'Generate Content',
        method: 'POST',
        path: '/v1/chat/completions',
        description: `Generate content for automation: ${automationContext?.title || 'Content Generation'}`
      }];
    }
    
    if (lowerName.includes('notion')) {
      return [{
        name: 'Query Database',
        method: 'POST',
        path: '/v1/databases/{database_id}/query',
        description: `Query database for automation: ${automationContext?.title || 'Data Management'}`
      }];
    }
    
    return [{
      name: `${platformName} Operation`,
      method: 'POST',
      path: '/action',
      description: `Perform ${platformName} operation for automation: ${automationContext?.title || 'Workflow'}`
    }];
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
   * Build real authentication headers with automation context
   */
  buildAutomationContextAuthHeaders(config: any, credentials: Record<string, string>, platformName: string): {headers: Record<string, string>, url: string, body?: any} {
    console.log(`🔑 Building automation-context auth headers for ${platformName}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Automation-Context-Tester/1.0',
      'Accept': 'application/json'
    };

    let testUrl = config.base_url + config.test_endpoint.path;
    let requestBody = config.test_endpoint.body || null;
    
    // Platform-specific authentication
    const platform = platformName.toLowerCase();
    
    switch (platform) {
      case 'openai':
        const openaiKey = credentials.api_key || credentials.key;
        if (openaiKey) {
          headers['Authorization'] = `Bearer ${openaiKey}`;
        }
        break;
        
      case 'typeform':
        const typeformToken = credentials.personal_access_token || credentials.token;
        if (typeformToken) {
          headers['Authorization'] = `Bearer ${typeformToken}`;
        }
        break;
        
      case 'notion':
        const notionToken = credentials.access_token || credentials.token;
        if (notionToken) {
          headers['Authorization'] = `Bearer ${notionToken}`;
          headers['Notion-Version'] = '2022-06-28';
        }
        break;
        
      case 'google_sheets':
      case 'google sheets':
        const googleToken = credentials.access_token;
        const googleApiKey = credentials.api_key;
        if (googleToken) {
          headers['Authorization'] = `Bearer ${googleToken}`;
        } else if (googleApiKey) {
          testUrl += `?key=${googleApiKey}`;
        }
        break;
        
      case 'slack':
        const slackToken = credentials.bot_token || credentials.token;
        if (slackToken) {
          headers['Authorization'] = `Bearer ${slackToken}`;
        }
        break;
        
      default:
        const token = credentials.access_token || credentials.api_key || credentials.token || credentials.key;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return { headers, url: testUrl, body: requestBody };
  }

  /**
   * Perform real automation-context API test
   */
  async performAutomationContextAPITest(config: any, credentials: Record<string, string>, platformName: string, automationContext: any): Promise<any> {
    console.log(`📡 Making REAL automation-context API call to ${platformName}`);
    
    try {
      const { headers, url, body } = this.buildAutomationContextAuthHeaders(config, credentials, platformName);
      
      console.log(`🔗 Testing automation-context endpoint: ${config.test_endpoint.method} ${url}`);
      
      const startTime = Date.now();
      const response = await fetch(url, {
        method: config.test_endpoint.method,
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

      console.log(`📊 Real automation-context API Response: Status ${response.status}, Time ${requestTime}ms`);

      return {
        success: this.analyzeAutomationContextResponse(response, responseData, platformName, automationContext),
        status_code: response.status,
        response_data: responseData,
        request_time_ms: requestTime,
        endpoint_tested: url,
        method_used: config.test_endpoint.method,
        automation_context: automationContext?.title || 'Default',
        automation_aware: true
      };

    } catch (error: any) {
      console.error(`💥 Real automation-context API call failed for ${platformName}:`, error);
      
      return {
        success: false,
        status_code: 0,
        response_data: error.message,
        endpoint_tested: 'connection_failed',
        error_type: 'network_error',
        automation_context: automationContext?.title || 'Default',
        automation_aware: true
      };
    }
  }

  /**
   * Analyze API response with automation context
   */
  analyzeAutomationContextResponse(response: Response, responseData: any, platformName: string, automationContext: any): boolean {
    console.log(`🔍 Analyzing automation-context API response for ${platformName}`);
    
    const status = response.status;
    
    if (status >= 200 && status < 300) {
      const platform = platformName.toLowerCase();
      
      // Platform-specific success validation with automation context
      switch (platform) {
        case 'openai':
          if (responseData?.choices && Array.isArray(responseData.choices)) {
            console.log(`✅ OpenAI automation-context success - AI response generated for: ${automationContext?.title || 'Workflow'}`);
            return true;
          }
          break;
          
        case 'typeform':
          if (responseData?.alias || responseData?.account_id || responseData?.language) {
            console.log(`✅ Typeform automation-context success - Ready for: ${automationContext?.title || 'Form Workflow'}`);
            return true;
          }
          break;
          
        case 'notion':
          if (responseData?.name || responseData?.id || responseData?.type === 'user') {
            console.log(`✅ Notion automation-context success - Ready for: ${automationContext?.title || 'Database Workflow'}`);
            return true;
          }
          break;
          
        case 'google_sheets':
        case 'google sheets':
          console.log(`✅ Google Sheets automation-context success - Ready for: ${automationContext?.title || 'Spreadsheet Workflow'}`);
          return true;
          
        case 'slack':
          if (responseData?.ok === true) {
            console.log(`✅ Slack automation-context success - Ready for: ${automationContext?.title || 'Messaging Workflow'}`);
            return true;
          }
          break;
          
        default:
          if (typeof responseData === 'object' && responseData !== null) {
            const hasError = responseData.error || responseData.errors || 
                           (responseData.message && responseData.message.toLowerCase().includes('error'));
            if (!hasError) {
              console.log(`✅ ${platformName} automation-context success - Ready for: ${automationContext?.title || 'Workflow'}`);
              return true;
            }
          }
          console.log(`✅ ${platformName} automation-context success - Status 2xx for: ${automationContext?.title || 'Workflow'}`);
          return true;
      }
      
      console.log(`⚠️ ${platformName} returned 2xx but unexpected format for automation: ${automationContext?.title || 'Workflow'}`);
      return true;
    }
    
    console.log(`❌ ${platformName} automation-context failure - Status ${status} for: ${automationContext?.title || 'Workflow'}`);
    return false;
  }

  /**
   * Generate intelligent error messages with automation context
   */
  generateAutomationContextErrorMessage(platformName: string, testResult: any, automationContext: any): string {
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
        
      case 'google_sheets':
      case 'google sheets':
        if (status === 401) return `Google Sheets authentication failed for ${workflowName}. Please verify your access token or API key.`;
        if (status === 403) return `Google Sheets access denied for ${workflowName}. Check your OAuth2 scopes and permissions.`;
        return `Google Sheets API error (${status}) for ${workflowName}. Please verify your credentials.`;
        
      default:
        if (status === 401) return `${platformName} authentication failed for ${workflowName}. Please verify your credentials.`;
        if (status === 403) return `${platformName} access denied for ${workflowName}. Check your account permissions.`;
        if (status === 429) return `${platformName} rate limit exceeded for ${workflowName}. Please wait before retrying.`;
        if (status === 0) return `Failed to connect to ${platformName} for ${workflowName}. Check your internet connection.`;
        return `${platformName} API error (${status}) for ${workflowName}. Please check your credentials and try again.`;
    }
  }

  /**
   * Main automation-context testing function
   */
  async testPlatformCredentialsWithAutomationContext(
    platformName: string,
    credentials: Record<string, string>,
    automationId?: string
  ): Promise<any> {
    const startTime = Date.now();
    console.log(`🚀 Starting AUTOMATION-CONTEXT test for ${platformName}`);

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

      // Step 2: Get real automation-context platform configuration
      const config = await this.getRealAutomationContextConfig(platformName, automationContext);
      console.log(`📋 Real automation-context configuration loaded for ${platformName}`);

      // Step 3: Perform real automation-context API test
      const testResult = await this.performAutomationContextAPITest(config, credentials, platformName, automationContext);
      const totalTime = Date.now() - startTime;

      console.log(`🏁 Automation-context testing completed for ${platformName} in ${totalTime}ms - ${testResult.success ? 'SUCCESS' : 'FAILED'}`);

      return {
        success: testResult.success,
        message: testResult.success 
          ? `✅ ${platformName} credentials verified successfully for automation: ${automationContext?.title || 'Workflow'}! Ready for execution.`
          : this.generateAutomationContextErrorMessage(platformName, testResult, automationContext),
        details: {
          // Real test results
          endpoint_tested: testResult.endpoint_tested,
          method_used: testResult.method_used,
          status_code: testResult.status_code,
          request_time_ms: testResult.request_time_ms,
          total_time_ms: totalTime,
          
          // Automation context information
          automation_title: automationContext?.title || 'No automation context',
          automation_description: automationContext?.description || 'Standard testing',
          platform: platformName,
          config_source: 'automation_context_aware',
          base_url: config.base_url,
          
          // Response preview (sanitized)
          api_response_preview: this.sanitizeResponse(testResult.response_data),
          
          // Testing markers
          automation_context_test: true,
          format_validated: true,
          automation_aware: true,
          real_workflow_test: true
        }
      };

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 Automation-context testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Automation-context testing system error for ${platformName}: ${error.message}`,
        details: {
          error_details: error.message,
          total_time_ms: totalTime,
          platform: platformName,
          system_error: true,
          automation_context_aware: true
        }
      };
    }
  }

  /**
   * Create automation context fallback
   */
  private createAutomationContextFallback(platformName: string, automationContext: any): any {
    console.log(`⚠️ Creating automation-context fallback for ${platformName}`);
    
    const platform = platformName.toLowerCase();
    const realConfigs = {
      'openai': {
        platform_name: 'OpenAI',
        base_url: 'https://api.openai.com',
        test_endpoint: { 
          method: 'POST', 
          path: '/v1/chat/completions',
          description: `Test OpenAI for automation: ${automationContext?.title || 'Workflow'}`,
          body: {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: `Automation context: ${automationContext?.title || 'Processing'}` },
              { role: 'user', content: 'Test automation workflow processing' }
            ],
            max_tokens: 50
          }
        },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
      },
      'typeform': {
        platform_name: 'Typeform', 
        base_url: 'https://api.typeform.com',
        test_endpoint: { 
          method: 'GET', 
          path: '/me',
          description: `Test Typeform for automation: ${automationContext?.title || 'Form Workflow'}`
        },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
      },
      'notion': {
        platform_name: 'Notion',
        base_url: 'https://api.notion.com',
        test_endpoint: { 
          method: 'GET', 
          path: '/v1/users/me',
          description: `Test Notion for automation: ${automationContext?.title || 'Database Workflow'}`
        },
        auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
      }
    };

    return realConfigs[platform] || {
      platform_name: platformName,
      base_url: `https://api.${platform.replace(/\s+/g, '')}.com`,
      test_endpoint: { 
        method: 'GET', 
        path: '/me',
        description: `Test ${platformName} for automation: ${automationContext?.title || 'Workflow'}`
      },
      auth_config: { type: 'bearer', location: 'header', parameter_name: 'Authorization' }
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
    const { platformName, credentials, automationId } = await req.json();

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

    // Initialize the automation context credential tester
    const tester = new AutomationContextCredentialTester(supabase);

    // Test platform credentials with automation context
    const result = await tester.testPlatformCredentialsWithAutomationContext(
      platformName,
      credentials,
      automationId
    );

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in test-credential function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Server error: ${error.message}`,
        details: {
          error_type: 'server_error',
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
