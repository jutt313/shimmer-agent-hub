import { supabase } from '@/integrations/supabase/client';

export interface UniversalPlatformConfig {
  platform_name: string;
  base_url: string;
  test_endpoint: {
    method: string;
    path: string;
    description: string;
    requires_automation_data?: boolean;
  };
  auth_config: {
    type: string;
    location: string;
    parameter_name: string;
    format: string;
    field_names: string[];
    oauth2_config?: {
      authorization_url: string;
      token_url: string;
      scopes: string[];
    };
  };
  automation_operations: Array<{
    name: string;
    method: string;
    path: string;
    description: string;
    sample_request: any;
    sample_response: any;
    automation_context_required: boolean;
  }>;
  error_patterns: Array<{
    status: number;
    pattern: string;
    action: string;
  }>;
  rate_limits: {
    requests_per_minute: number;
    requests_per_hour: number;
    burst_limit: number;
  };
}

export class UniversalPlatformManager {
  private static configCache = new Map<string, UniversalPlatformConfig>();

  /**
   * ENHANCED AUTOMATION-CONTEXT-AWARE PLATFORM CONFIGURATION
   * Uses Universal Knowledge Store + AI-powered dynamic configuration generation
   */
  static async getPlatformConfig(platformName: string, automationContext?: any): Promise<UniversalPlatformConfig> {
    console.log(`🤖 Getting automation-context-aware config for ${platformName}`);
    
    // Enhanced cache key includes automation context
    const contextHash = automationContext ? JSON.stringify(automationContext).slice(0, 50) : 'general';
    const cacheKey = `${platformName.toLowerCase()}_${contextHash}`;
    const cached = this.configCache.get(cacheKey);
    if (cached) {
      console.log(`✅ Using cached automation-context config for ${platformName}`);
      return cached;
    }

    try {
      // First, try to get configuration from Universal Knowledge Store
      const knowledgeConfig = await this.getKnowledgeStoreConfig(platformName, automationContext);
      if (knowledgeConfig) {
        console.log(`📚 Using Universal Knowledge Store config for ${platformName}`);
        this.configCache.set(cacheKey, knowledgeConfig);
        return knowledgeConfig;
      }

      // Fallback to AI-generated config with automation context
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate complete automation-context-aware API configuration for ${platformName} platform.

**AUTOMATION CONTEXT:**
${automationContext ? JSON.stringify(automationContext, null, 2) : 'General platform integration'}

**REQUIREMENTS:**
- Generate REAL API operations that serve the automation workflow
- Include proper authentication configuration
- Provide sample requests/responses with automation data
- No generic test endpoints - only real operations

**RESPONSE FORMAT:**
Return ONLY valid JSON with complete platform configuration including real automation operations.`,
          requestType: 'automation_context_platform_config',
          platformName: platformName,
          automationContext: automationContext,
          messages: []
        }
      });

      if (error) {
        throw new Error(`AI config generation failed: ${error.message}`);
      }

      let config;
      if (typeof data === 'string') {
        const jsonMatch = data.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          config = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } else {
        config = data;
      }

      // Enhanced validation and transformation
      const enhancedConfig = this.enhanceConfigWithAutomationContext(config, platformName, automationContext);
      
      // Cache the enhanced configuration
      this.configCache.set(cacheKey, enhancedConfig);
      console.log(`✅ Automation-context-aware AI config generated and cached for ${platformName}`);
      return enhancedConfig;

    } catch (error) {
      console.error(`Failed to get automation-context config for ${platformName}:`, error);
      console.log(`🔄 Using enhanced intelligent fallback for ${platformName}`);
      return this.generateAutomationContextFallback(platformName, automationContext);
    }
  }

  /**
   * GET CONFIGURATION FROM UNIVERSAL KNOWLEDGE STORE
   */
  private static async getKnowledgeStoreConfig(platformName: string, automationContext?: any): Promise<UniversalPlatformConfig | null> {
    try {
      const { data, error } = await supabase
        .from('universal_knowledge_store')
        .select('*')
        .eq('category', 'platform_knowledge')
        .or(`platform_name.ilike.%${platformName}%,title.ilike.%${platformName}%`)
        .order('usage_count', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      const knowledge = data[0];
      const apiConfig = knowledge.details?.api_config || {};
      
      return {
        platform_name: knowledge.platform_name || platformName,
        base_url: apiConfig.base_url || `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
        test_endpoint: this.generateAutomationAwareTestEndpoint(platformName, automationContext, apiConfig),
        auth_config: {
          type: apiConfig.auth_config?.type || 'bearer',
          location: 'header',
          parameter_name: 'Authorization',
          format: apiConfig.auth_config?.format || 'Bearer {token}',
          field_names: knowledge.credential_fields?.map((c: any) => c.field) || ['api_key', 'access_token'],
          oauth2_config: apiConfig.oauth2_config
        },
        automation_operations: this.generateAutomationOperations(platformName, automationContext, apiConfig),
        error_patterns: this.getStandardErrorPatterns(),
        rate_limits: {
          requests_per_minute: 60,
          requests_per_hour: 1000,
          burst_limit: 10
        }
      };
    } catch (error) {
      console.error('Error getting knowledge store config:', error);
      return null;
    }
  }

  /**
   * GENERATE AUTOMATION-AWARE TEST ENDPOINT
   */
  private static generateAutomationAwareTestEndpoint(platformName: string, automationContext?: any, apiConfig?: any): any {
    const lowerName = platformName.toLowerCase();
    
    // Real automation-context-aware endpoints
    if (lowerName.includes('openai')) {
      return {
        method: 'POST',
        path: '/v1/chat/completions',
        description: `Test OpenAI with real completion request${automationContext ? ' based on automation workflow' : ''}`,
        requires_automation_data: true
      };
    }
    
    if (lowerName.includes('notion')) {
      return {
        method: 'GET',
        path: '/v1/users/me',
        description: `Test Notion authentication and get user info${automationContext ? ' for automation setup' : ''}`,
        requires_automation_data: false
      };
    }
    
    if (lowerName.includes('typeform')) {
      return {
        method: 'GET', 
        path: '/me',
        description: `Test Typeform authentication${automationContext ? ' for form automation' : ''}`,
        requires_automation_data: false
      };
    }
    
    if (lowerName.includes('google') && lowerName.includes('sheet')) {
      return {
        method: 'GET',
        path: '/v4/spreadsheets',
        description: `Test Google Sheets access${automationContext ? ' for spreadsheet automation' : ''}`,
        requires_automation_data: false
      };
    }
    
    if (lowerName.includes('slack')) {
      return {
        method: 'GET',
        path: '/api/auth.test',
        description: `Test Slack authentication${automationContext ? ' for messaging automation' : ''}`,
        requires_automation_data: false
      };
    }

    // Enhanced fallback based on automation context
    return {
      method: 'GET',
      path: apiConfig?.test_endpoint?.path || '/me',
      description: `Test ${platformName} authentication${automationContext ? ' for automation workflow' : ''}`,
      requires_automation_data: false
    };
  }

  /**
   * GENERATE REAL AUTOMATION OPERATIONS
   */
  private static generateAutomationOperations(platformName: string, automationContext?: any, apiConfig?: any): Array<any> {
    const lowerName = platformName.toLowerCase();
    const operations = [];
    
    // OpenAI - Real completion operations
    if (lowerName.includes('openai')) {
      operations.push({
        name: 'Generate AI Response',
        method: 'POST',
        path: '/v1/chat/completions',
        description: `Generate AI response${automationContext ? ' based on automation workflow data' : ''}`,
        sample_request: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: automationContext ? 
              `You are an AI assistant processing data for automation: ${automationContext.title || 'Unnamed Automation'}` : 
              'You are a helpful AI assistant'
            },
            { role: 'user', content: automationContext ? 
              'Process this automation data: {automation_data}' : 
              'Hello, how can you help?'
            }
          ],
          max_tokens: 1000
        },
        sample_response: {
          choices: [{ message: { content: 'AI response based on automation context' } }]
        },
        automation_context_required: true
      });
    }
    
    // Notion - Real database operations
    if (lowerName.includes('notion')) {
      operations.push({
        name: 'Query Database',
        method: 'POST',
        path: '/v1/databases/{database_id}/query',
        description: `Query Notion database${automationContext ? ' for automation data processing' : ''}`,
        sample_request: {
          filter: automationContext ? 
            { property: 'Status', select: { equals: 'Active' } } : 
            { property: 'Name', title: { is_not_empty: true } }
        },
        sample_response: {
          results: [{ id: 'page_id', properties: { Name: { title: [{ text: { content: 'Sample Entry' } }] } }]
        },
        automation_context_required: true
      });
      
      operations.push({
        name: 'Create Page',
        method: 'POST',
        path: '/v1/pages',
        description: `Create new Notion page${automationContext ? ' with automation data' : ''}`,
        sample_request: {
          parent: { database_id: '{database_id}' },
          properties: {
            Name: { title: [{ text: { content: automationContext?.title || 'New Page' } }] }
          }
        },
        sample_response: {
          id: 'new_page_id',
          properties: { Name: { title: [{ text: { content: 'Created Page' } }] } }
        },
        automation_context_required: true
      });
    }
    
    // Typeform - Real form operations
    if (lowerName.includes('typeform')) {
      operations.push({
        name: 'Create Form',
        method: 'POST',
        path: '/forms',
        description: `Create new Typeform${automationContext ? ' for automation data collection' : ''}`,
        sample_request: {
          title: automationContext?.title ? `${automationContext.title} - Data Collection` : 'New Form',
          fields: [
            { title: 'What is your name?', type: 'short_text', required: true },
            { title: 'Your email address?', type: 'email', required: true }
          ]
        },
        sample_response: {
          id: 'form_id',
          title: 'Created Form',
          self: { href: 'https://api.typeform.com/forms/form_id' }
        },
        automation_context_required: true
      });
      
      operations.push({
        name: 'Get Form Responses',
        method: 'GET',
        path: '/forms/{form_id}/responses',
        description: `Get form responses${automationContext ? ' for automation processing' : ''}`,
        sample_request: {},
        sample_response: {
          items: [
            { submitted_at: '2024-01-01T00:00:00Z', answers: [{ text: 'John Doe' }, { email: 'john@example.com' }] }
          ]
        },
        automation_context_required: false
      });
    }
    
    // Google Sheets - Real spreadsheet operations
    if (lowerName.includes('google') && lowerName.includes('sheet')) {
      operations.push({
        name: 'Read Spreadsheet Data',
        method: 'GET',
        path: '/v4/spreadsheets/{spreadsheetId}/values/{range}',
        description: `Read data from Google Sheets${automationContext ? ' for automation processing' : ''}`,
        sample_request: {},
        sample_response: {
          values: [
            ['Name', 'Email', 'Status'],
            ['John Doe', 'john@example.com', 'Active']
          ]
        },
        automation_context_required: false
      });
      
      operations.push({
        name: 'Write Spreadsheet Data',
        method: 'PUT',
        path: '/v4/spreadsheets/{spreadsheetId}/values/{range}',
        description: `Write data to Google Sheets${automationContext ? ' from automation results' : ''}`,
        sample_request: {
          values: [
            ['Updated Name', 'updated@example.com', 'Processed']
          ]
        },
        sample_response: {
          updatedRows: 1,
          updatedColumns: 3,
          updatedCells: 3
        },
        automation_context_required: true
      });
    }
    
    // Slack - Real messaging operations
    if (lowerName.includes('slack')) {
      operations.push({
        name: 'Send Message',
        method: 'POST',
        path: '/api/chat.postMessage',
        description: `Send Slack message${automationContext ? ' with automation results' : ''}`,
        sample_request: {
          channel: '#general',
          text: automationContext ? 
            `Automation "${automationContext.title}" completed successfully!` : 
            'Hello from automation!'
        },
        sample_response: {
          ok: true,
          channel: 'C1234567890',
          ts: '1234567890.123'
        },
        automation_context_required: true
      });
    }

    // Default operation if no specific platform matched
    if (operations.length === 0) {
      operations.push({
        name: `${platformName} Operation`,
        method: 'POST',
        path: '/action',
        description: `Perform an action using ${platformName}`,
        sample_request: {
          url: `https://api.${lowerName.replace(/\s+/g, '')}.com/action`,
          method: 'POST',
          headers: { 'Authorization': 'Bearer {access_token}' },
          body: { action: 'automation_action', data: automationContext || {} }
        },
        sample_response: {
          success: { result: 'success', data: 'operation_completed' },
          error: { error: 'operation_failed', message: 'Action could not be completed' }
        },
        automation_context_required: !!automationContext
      });
    }
    
    return operations;
  }

  /**
   * ENHANCE CONFIG WITH AUTOMATION CONTEXT
   */
  private static enhanceConfigWithAutomationContext(config: any, platformName: string, automationContext?: any): UniversalPlatformConfig {
    return {
      platform_name: config.platform_name || platformName,
      base_url: config.base_url || `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
      test_endpoint: config.test_endpoint || this.generateAutomationAwareTestEndpoint(platformName, automationContext),
      auth_config: {
        type: config.auth_config?.type || 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: config.auth_config?.format || 'Bearer {token}',
        field_names: config.auth_config?.field_names || ['api_key', 'access_token'],
        oauth2_config: config.auth_config?.oauth2_config
      },
      automation_operations: config.automation_operations || this.generateAutomationOperations(platformName, automationContext),
      error_patterns: config.error_patterns || this.getStandardErrorPatterns(),
      rate_limits: config.rate_limits || {
        requests_per_minute: 60,
        requests_per_hour: 1000,
        burst_limit: 10
      }
    };
  }

  /**
   * GENERATE AUTOMATION-CONTEXT FALLBACK
   */
  private static generateAutomationContextFallback(platformName: string, automationContext?: any): UniversalPlatformConfig {
    console.log(`🔧 Generating automation-context fallback for ${platformName}`);
    
    return {
      platform_name: platformName,
      base_url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
      test_endpoint: this.generateAutomationAwareTestEndpoint(platformName, automationContext),
      auth_config: {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {token}',
        field_names: ['api_key', 'access_token', 'token'],
        oauth2_config: {
          authorization_url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com/oauth/authorize`,
          token_url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com/oauth/token`,
          scopes: ['read', 'write']
        }
      },
      automation_operations: this.generateAutomationOperations(platformName, automationContext),
      error_patterns: this.getStandardErrorPatterns(),
      rate_limits: {
        requests_per_minute: 60,
        requests_per_hour: 1000,
        burst_limit: 10
      }
    };
  }

  /**
   * ENHANCED AUTOMATION-CONTEXT-AWARE CREDENTIAL TESTING
   */
  static async testCredentials(
    platformName: string,
    credentials: Record<string, string>,
    automationContext?: any
  ): Promise<{
    success: boolean;
    message: string;
    request_details: any;
    response_details: any;
    status_code: number;
  }> {
    console.log(`🧪 Automation-context-aware testing for ${platformName}`);

    try {
      // Get automation-context-aware platform config
      const config = await this.getPlatformConfig(platformName, automationContext);
      
      // Enhanced credential detection
      const credentialValue = this.findCredentialValueIntelligently(credentials, config.auth_config.field_names);
      if (!credentialValue) {
        return {
          success: false,
          message: `No valid credential found. Expected fields: ${config.auth_config.field_names.join(', ')}`,
          request_details: {
            error: 'credential_not_found',
            expected_fields: config.auth_config.field_names,
            provided_fields: Object.keys(credentials),
            automation_context: !!automationContext
          },
          response_details: { error: 'No valid credentials provided' },
          status_code: 0
        };
      }

      // Build real API request
      const testUrl = config.base_url + config.test_endpoint.path;
      
      // Enhanced authorization building
      let authValue = config.auth_config.format;
      const placeholders = ['{token}', '{api_key}', '{personal_access_token}', '{access_token}', '{bearer_token}', '{auth_token}'];
      placeholders.forEach(placeholder => {
        authValue = authValue.replace(placeholder, credentialValue);
      });
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'YusrAI-Automation-Context-Tester/1.0'
      };
      
      if (config.auth_config.location === 'header') {
        headers[config.auth_config.parameter_name] = authValue;
      }

      // Generate automation-context-aware request body
      let requestBody = null;
      if (config.test_endpoint.method === 'POST' && config.test_endpoint.requires_automation_data) {
        requestBody = this.generateAutomationContextRequestBody(platformName, automationContext, config);
      }

      const requestDetails = {
        url: testUrl,
        method: config.test_endpoint.method,
        headers: { 
          ...headers, 
          [config.auth_config.parameter_name]: headers[config.auth_config.parameter_name]?.replace(credentialValue, '***HIDDEN***')
        },
        body: requestBody,
        platform: platformName,
        automation_context_aware: true,
        automation_context: !!automationContext
      };

      console.log(`📡 Making automation-context-aware API call to: ${testUrl}`);

      // Make API call with timeout
      const startTime = Date.now();
      const response = await fetch(testUrl, {
        method: config.test_endpoint.method,
        headers,
        signal: AbortSignal.timeout(15000),
        ...(requestBody && { body: JSON.stringify(requestBody) })
      });
      const requestTime = Date.now() - startTime;

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw_response: responseText.substring(0, 500) };
      }

      const responseDetails = {
        status: response.status,
        data: responseData,
        request_time_ms: requestTime,
        headers: Object.fromEntries(response.headers.entries()),
        platform: platformName,
        automation_context_aware: true,
        automation_context: !!automationContext
      };

      const success = response.ok;
      const message = success 
        ? `✅ ${platformName} credentials verified successfully with automation-context testing!`
        : `❌ ${platformName} automation-context test failed: ${response.status} ${response.statusText}`;

      return {
        success,
        message,
        request_details: requestDetails,
        response_details: responseDetails,
        status_code: response.status
      };

    } catch (error: any) {
      console.error(`Automation-context testing failed for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Automation-context test failed: ${error.message}`,
        request_details: { 
          error: error.message, 
          platform: platformName,
          automation_context_aware: true,
          automation_context: !!automationContext
        },
        response_details: { error: error.message },
        status_code: 0
      };
    }
  }

  /**
   * GENERATE AUTOMATION CONTEXT REQUEST BODY
   */
  private static generateAutomationContextRequestBody(platformName: string, automationContext?: any, config?: any): any {
    const lowerName = platformName.toLowerCase();
    
    // OpenAI - Real completion request with automation context
    if (lowerName.includes('openai')) {
      return {
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: automationContext ? 
              `You are an AI assistant for automation: ${automationContext.title || 'Automation'}. ${automationContext.description || ''}` :
              'You are a helpful AI assistant for automation tasks.'
          },
          { 
            role: 'user', 
            content: automationContext ? 
              `Test automation workflow processing. Automation goal: ${automationContext.goal || 'Process data efficiently'}` :
              'Hello! Please confirm you can process automation requests.'
          }
        ],
        max_tokens: 100
      };
    }
    
    // Default empty body for other platforms
    return {};
  }

  /**
   * ENHANCED INTELLIGENT CREDENTIAL DETECTION
   * Finds ANY credential field dynamically using advanced pattern matching
   */
  private static findCredentialValueIntelligently(credentials: Record<string, string>, fieldNames: string[]): string | null {
    console.log('🔍 Intelligent credential detection from fields:', fieldNames);
    console.log('📋 Available credentials:', Object.keys(credentials));
    
    // ENHANCED UNIVERSAL FIELD MATCHING PATTERNS
    const universalPatterns = [
      // Direct field names from AI
      ...fieldNames,
      // Common API key variations
      'api_key', 'API Key', 'apikey', 'apiKey', 'key', 'Key',
      'access_token', 'Access Token', 'accesstoken', 'accessToken', 'token', 'Token',
      'personal_access_token', 'Personal Access Token', 'personalAccessToken', 'pat', 'PAT',
      'bearer_token', 'Bearer Token', 'bearerToken', 'bearer', 'Bearer',
      'auth_token', 'Auth Token', 'authToken', 'auth', 'Auth',
      'client_secret', 'Client Secret', 'clientSecret', 'secret', 'Secret',
      'authorization', 'Authorization', 'AUTH', 'auth_key', 'Auth Key',
      // Platform-specific patterns
      'password', 'Password', 'pwd', 'PWD', 'pass', 'Pass'
    ];
    
    // INTELLIGENT MATCHING ALGORITHM
    for (const pattern of universalPatterns) {
      // Exact match
      if (credentials[pattern] && credentials[pattern].trim()) {
        console.log(`✅ Found credential via exact match: ${pattern}`);
        return credentials[pattern].trim();
      }
      
      // Case variations
      const variations = [
        pattern.toLowerCase(),
        pattern.toUpperCase(),
        pattern.replace(/[_\s]/g, ''),
        pattern.replace(/[_\s]/g, '').toLowerCase(),
        pattern.replace(/[_\s]/g, '').toUpperCase(),
        pattern.replace(/_/g, ' '),
        pattern.replace(/\s/g, '_')
      ];
      
      for (const variation of variations) {
        if (credentials[variation] && credentials[variation].trim()) {
          console.log(`✅ Found credential via variation: ${variation} (original: ${pattern})`);
          return credentials[variation].trim();
        }
      }
    }
    
    // FALLBACK: Any non-empty credential
    for (const [key, value] of Object.entries(credentials)) {
      if (value && value.trim()) {
        console.log(`⚠️ Using fallback credential from field: ${key}`);
        return value.trim();
      }
    }
    
    console.log('❌ No credential value found with intelligent detection');
    return null;
  }

  private static getStandardErrorPatterns(): Array<any> {
    return [
      { status: 401, pattern: 'unauthorized|invalid.*token', action: 'refresh_credentials' },
      { status: 429, pattern: 'rate.*limit', action: 'retry_with_backoff' },
      { status: 403, pattern: 'forbidden|insufficient.*permissions', action: 'check_scopes' },
      { status: 400, pattern: 'bad.*request|invalid.*input', action: 'validate_input' },
      { status: 500, pattern: 'server.*error|internal.*error', action: 'retry_later' }
    ];
  }

  /**
   * AUTOMATION-AWARE SAMPLE CALL GENERATION
   */
  static async generateSampleCall(platformName: string, credentials: Record<string, string>, automationContext?: any): Promise<any> {
    try {
      const config = await this.getPlatformConfig(platformName, automationContext);
      const credentialValue = this.findCredentialValueIntelligently(credentials, config.auth_config.field_names);
      
      // Use automation operations if available, otherwise use test endpoint
      const operation = config.automation_operations?.[0] || {
        name: 'Authentication Test',
        method: config.test_endpoint.method,
        path: config.test_endpoint.path,
        description: config.test_endpoint.description,
        sample_request: {
          url: config.base_url + config.test_endpoint.path,
          method: config.test_endpoint.method,
          headers: {},
          body: config.test_endpoint.requires_automation_data ? 
            this.generateAutomationContextRequestBody(platformName, automationContext, config) : null
        },
        sample_response: {
          success: { authenticated: true, user: 'test_user' },
          error: { error: 'authentication_failed' }
        },
        automation_context_required: config.test_endpoint.requires_automation_data || false
      };
      
      // Build authorization
      let authValue = config.auth_config.format;
      const placeholders = ['{token}', '{api_key}', '{personal_access_token}', '{access_token}', '{bearer_token}', '{auth_token}'];
      placeholders.forEach(placeholder => {
        authValue = authValue.replace(placeholder, credentialValue || '[TOKEN]');
      });
      
      return {
        task_description: `${operation.description} for ${platformName}`,
        automation_context: automationContext ? 'Automation-context-aware operation' : 'General platform operation',
        automation_workflow: automationContext?.title || 'Standard workflow',
        request: {
          ...operation.sample_request,
          headers: {
            ...operation.sample_request.headers,
            [config.auth_config.parameter_name]: authValue
          }
        },
        expected_response: operation.sample_response,
        platform: platformName,
        automation_context_aware: true,
        intelligent_detection: true
      };
    } catch (error) {
      console.error(`Sample call generation failed for ${platformName}:`, error);
      return {
        task_description: `${platformName} API operation`,
        automation_context: automationContext ? 'Automation-context-aware fallback' : 'General operation',
        request: {
          url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com/v1/action`,
          method: 'POST',
          headers: { Authorization: 'Bearer [TOKEN]' },
          body: { action: 'sample', automation_context: automationContext }
        },
        expected_response: { status: 200, data: 'success' },
        platform: platformName,
        fallback: true,
        automation_context_aware: true
      };
    }
  }

  /**
   * Clear cache when needed
   */
  static clearCache(): void {
    this.configCache.clear();
    console.log('🗑️ Automation-context-aware platform config cache cleared');
  }
}
