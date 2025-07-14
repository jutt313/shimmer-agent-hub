
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// FIXED REAL AUTOMATION EXECUTOR - Uses validated credentials for real execution
class FixedRealAutomationExecutor {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * FIXED: Execute automation using REAL validated credentials
   */
  async executeAutomation(automationId: string, userId: string, triggerData?: any): Promise<any> {
    console.log(`🚀 FIXED REAL EXECUTION: Starting automation ${automationId} for user ${userId}`);
    
    try {
      // Get automation blueprint
      const { data: automation, error: autoError } = await this.supabase
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .eq('user_id', userId)
        .single();

      if (autoError || !automation) {
        throw new Error('Automation not found');
      }

      // Get all VALIDATED credentials for this automation
      const { data: credentials, error: credError } = await this.supabase
        .from('automation_platform_credentials')
        .select('*')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_tested', true)
        .eq('test_status', 'success');

      if (credError) {
        throw new Error('Failed to get validated credentials');
      }

      console.log(`🔑 Found ${credentials?.length || 0} validated credentials`);

      if (!credentials || credentials.length === 0) {
        throw new Error('No validated credentials found for automation');
      }

      // Create execution run record
      const { data: run, error: runError } = await this.supabase
        .from('automation_runs')
        .insert({
          automation_id: automationId,
          user_id: userId,
          status: 'running',
          trigger_data: triggerData || {},
          details_log: { 
            started_at: new Date().toISOString(), 
            steps: [],
            execution_type: 'real_api_calls'
          }
        })
        .select()
        .single();

      if (runError) {
        throw new Error('Failed to create execution run');
      }

      console.log(`📝 Created execution run: ${run.id}`);

      // Execute automation steps with REAL API calls
      const blueprint = automation.automation_blueprint;
      const executionResult = await this.executeRealAutomationSteps(
        blueprint, 
        credentials, 
        triggerData, 
        run.id
      );

      // Update run with final result
      await this.supabase
        .from('automation_runs')
        .update({
          status: executionResult.success ? 'completed' : 'failed',
          details_log: executionResult.logs,
          duration_ms: executionResult.duration
        })
        .eq('id', run.id);

      console.log(`✅ FIXED REAL EXECUTION completed for automation ${automationId}`);

      return {
        success: executionResult.success,
        message: executionResult.success 
          ? 'Automation executed successfully with real API calls using validated credentials'
          : 'Automation execution failed',
        run_id: run.id,
        details: executionResult.logs,
        duration_ms: executionResult.duration
      };

    } catch (error: any) {
      console.error(`💥 FIXED REAL EXECUTION failed:`, error);
      
      return {
        success: false,
        message: `Automation execution failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * FIXED: Execute automation steps with REAL API calls using validated credentials
   */
  async executeRealAutomationSteps(
    blueprint: any, 
    credentials: any[], 
    triggerData: any, 
    runId: string
  ): Promise<any> {
    const startTime = Date.now();
    const logs = { 
      started_at: new Date().toISOString(), 
      steps: [],
      real_execution: true,
      validated_credentials: true
    };

    try {
      console.log('🔄 Executing automation steps with REAL API calls using validated credentials');

      // Create credential map for easy access
      const credMap = new Map();
      credentials.forEach(cred => {
        credMap.set(cred.platform_name.toLowerCase(), JSON.parse(cred.credentials));
      });

      console.log(`🗝️ Available validated platforms: ${Array.from(credMap.keys()).join(', ')}`);

      // Execute each step in the blueprint
      if (blueprint?.steps && Array.isArray(blueprint.steps)) {
        for (let i = 0; i < blueprint.steps.length; i++) {
          const step = blueprint.steps[i];
          const stepPlatform = step.platform?.toLowerCase();
          
          console.log(`📋 Executing step ${i + 1}: ${step.action || 'Unknown action'} on ${step.platform || 'Unknown platform'}`);

          if (!stepPlatform || !credMap.has(stepPlatform)) {
            throw new Error(`No validated credentials found for platform: ${step.platform}`);
          }

          const stepResult = await this.executeRealStep(step, credMap.get(stepPlatform), triggerData, stepPlatform);
          
          logs.steps.push({
            step_number: i + 1,
            step_name: step.action || 'Unknown',
            platform: step.platform || 'Unknown',
            status: stepResult.success ? 'success' : 'failed',
            result: stepResult.result,
            error: stepResult.error,
            executed_at: new Date().toISOString(),
            real_api_call: true,
            validated_credentials: true,
            api_endpoint: stepResult.api_endpoint,
            response_status: stepResult.response_status
          });

          // If step fails and is critical, stop execution
          if (!stepResult.success && step.critical !== false) {
            throw new Error(`Critical step failed: ${stepResult.error}`);
          }

          // Pass result to next step
          triggerData = { ...triggerData, ...stepResult.result };
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ All steps executed successfully with REAL API calls in ${duration}ms`);

      return {
        success: true,
        logs,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Step execution failed:', error);

      logs.steps.push({
        step_name: 'execution_error',
        status: 'failed',
        error: error.message,
        executed_at: new Date().toISOString(),
        real_execution: true
      });

      return {
        success: false,
        logs,
        duration,
        error: error.message
      };
    }
  }

  /**
   * FIXED: Execute individual step with REAL API call using validated credentials
   */
  async executeRealStep(step: any, credentials: any, data: any, platformName: string): Promise<any> {
    console.log(`🔧 Executing REAL step: ${step.action} on ${platformName} with validated credentials`);

    try {
      // Get real execution configuration
      const executionConfig = await this.getRealExecutionConfig(step, platformName);
      
      // Build real request with validated credentials
      const { headers, url, body } = this.buildRealExecutionRequest(
        executionConfig, 
        credentials, 
        step, 
        data,
        platformName
      );

      console.log(`📡 Making REAL API call to: ${executionConfig.method || 'POST'} ${url}`);

      // Make REAL API call
      const startTime = Date.now();
      const response = await fetch(url, {
        method: executionConfig.method || 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      const requestTime = Date.now() - startTime;

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw_response: responseText };
      }

      console.log(`📊 REAL API Response: Status ${response.status}, Time ${requestTime}ms`);

      if (!response.ok) {
        throw new Error(`REAL API call failed with status ${response.status}: ${responseText}`);
      }

      console.log(`✅ Step executed successfully with REAL API call`);

      return {
        success: true,
        result: responseData,
        response_status: response.status,
        api_endpoint: url,
        request_time_ms: requestTime
      };

    } catch (error: any) {
      console.error(`❌ REAL step execution failed:`, error);
      
      return {
        success: false,
        error: error.message,
        result: null,
        api_endpoint: 'execution_failed'
      };
    }
  }

  /**
   * FIXED: Get real execution configuration for platform-specific actions
   */
  async getRealExecutionConfig(step: any, platformName: string): Promise<any> {
    console.log(`🔧 Getting REAL execution config for ${step.action} on ${platformName}`);
    
    try {
      const { data, error } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate REAL API execution configuration for ${platformName} to perform: ${step.action}

Return ONLY valid JSON:
{
  "method": "POST",
  "base_url": "https://api.platform.com",
  "endpoint": "/v1/action/endpoint",
  "description": "Perform the action"
}

REAL endpoints for specific platforms:
- OpenAI: base_url "https://api.openai.com", for text generation use "/v1/chat/completions"
- Typeform: base_url "https://api.typeform.com", for form operations use "/forms"
- Google Sheets: base_url "https://sheets.googleapis.com", for data operations use "/v4/spreadsheets"

Return ONLY the JSON configuration.`,
          messages: [],
          requestType: 'execution_config'
        }
      });

      if (error) {
        console.warn('⚠️ Chat-AI execution config failed, using fallback');
        return this.getDefaultExecutionConfig(step, platformName);
      }

      let executionConfig;
      try {
        if (typeof data === 'string') {
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          executionConfig = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } else {
          executionConfig = data;
        }
      } catch {
        executionConfig = this.getDefaultExecutionConfig(step, platformName);
      }

      return executionConfig.method ? executionConfig : this.getDefaultExecutionConfig(step, platformName);

    } catch (error) {
      console.warn('⚠️ Execution config generation failed, using fallback');
      return this.getDefaultExecutionConfig(step, platformName);
    }
  }

  /**
   * FIXED: Build real execution request with validated credentials
   */
  buildRealExecutionRequest(config: any, credentials: any, step: any, data: any, platformName: string): any {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Real-Executor/2.0'
    };

    // FIXED: Platform-specific authentication with validated credentials
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
        
      case 'google sheets':
      case 'google_sheets':
        const googleToken = credentials.access_token;
        if (googleToken) {
          headers['Authorization'] = `Bearer ${googleToken}`;
        }
        break;
        
      default:
        const token = credentials.access_token || credentials.api_key || credentials.token || credentials.key;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Build URL and body based on action
    const baseUrl = config.base_url || this.getDefaultBaseUrl(platformName);
    const endpoint = config.endpoint || this.getDefaultEndpoint(step.action, platformName);
    const url = baseUrl + endpoint;

    const body = this.buildRealRequestBody(step, data, config, platformName);

    return { headers, url, body };
  }

  /**
   * FIXED: Build real request body for platform-specific actions
   */
  buildRealRequestBody(step: any, data: any, config: any, platformName: string): any {
    const platform = platformName.toLowerCase();
    const action = step.action?.toLowerCase();
    
    switch (platform) {
      case 'openai':
        if (action?.includes('generate') || action?.includes('summary') || action?.includes('text')) {
          return {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are a helpful assistant.' },
              { role: 'user', content: step.parameters?.prompt || `Perform: ${step.action}` }
            ],
            max_tokens: step.parameters?.max_tokens || 150
          };
        }
        break;
        
      case 'typeform':
        if (action?.includes('create') || action?.includes('form')) {
          return {
            title: step.parameters?.title || `Form created by automation`,
            type: 'quiz'
          };
        }
        break;
        
      case 'google sheets':
      case 'google_sheets':
        if (action?.includes('add') || action?.includes('write')) {
          return {
            range: step.parameters?.range || 'Sheet1!A1',
            values: step.parameters?.values || [['Data from automation']]
          };
        }
        break;
    }

    // Default request body
    const body: any = {};
    if (step.parameters) {
      Object.entries(step.parameters).forEach(([key, value]) => {
        if (typeof value === 'string' && value.includes('{{')) {
          const placeholder = value.match(/\{\{(\w+)\}\}/);
          if (placeholder && data[placeholder[1]]) {
            body[key] = data[placeholder[1]];
          } else {
            body[key] = value.replace(/\{\{\w+\}\}/g, 'automation_data');
          }
        } else {
          body[key] = value;
        }
      });
    }

    return Object.keys(body).length > 0 ? body : null;
  }

  /**
   * Get default execution config when chat-ai fails
   */
  getDefaultExecutionConfig(step: any, platformName: string): any {
    const platform = platformName.toLowerCase();
    const action = step.action?.toLowerCase();
    
    const configs = {
      'openai': {
        method: 'POST',
        base_url: 'https://api.openai.com',
        endpoint: '/v1/chat/completions'
      },
      'typeform': {
        method: 'POST',
        base_url: 'https://api.typeform.com',
        endpoint: '/forms'
      },
      'google sheets': {
        method: 'POST',
        base_url: 'https://sheets.googleapis.com',
        endpoint: '/v4/spreadsheets/values'
      }
    };

    return configs[platform] || {
      method: 'POST',
      base_url: `https://api.${platform.replace(/\s+/g, '')}.com`,
      endpoint: '/v1/execute'
    };
  }

  /**
   * Get default base URL for platform
   */
  getDefaultBaseUrl(platformName: string): string {
    const platform = platformName.toLowerCase();
    const urls = {
      'openai': 'https://api.openai.com',
      'typeform': 'https://api.typeform.com',
      'google sheets': 'https://sheets.googleapis.com'
    };
    return urls[platform] || `https://api.${platform.replace(/\s+/g, '')}.com`;
  }

  /**
   * Get default endpoint based on action and platform
   */
  getDefaultEndpoint(action: string, platformName: string): string {
    const platform = platformName.toLowerCase();
    const actionLower = action?.toLowerCase() || '';
    
    if (platform === 'openai') return '/v1/chat/completions';
    if (platform === 'typeform') return '/forms';
    if (platform === 'google sheets') return '/v4/spreadsheets/values';
    
    const actionMap: Record<string, string> = {
      'send_email': '/v1/mail/send',
      'create_document': '/v1/documents',
      'add_row': '/v1/spreadsheets/values',
      'send_message': '/v1/chat/messages',
      'create_task': '/v1/tasks',
      'upload_file': '/v1/files'
    };

    return actionMap[actionLower] || '/v1/execute';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { automation_id, user_id, trigger_data } = await req.json();
    
    console.log(`🌟 FIXED REAL AUTOMATION EXECUTION: ${automation_id} for user ${user_id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const executor = new FixedRealAutomationExecutor(supabase);
    const result = await executor.executeAutomation(automation_id, user_id, trigger_data);
    
    console.log(`📊 EXECUTION RESULT:`, result.success ? '✅ SUCCESS' : '❌ FAILED');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ EXECUTION SYSTEM ERROR:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Execution system error: ${error.message}`,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
