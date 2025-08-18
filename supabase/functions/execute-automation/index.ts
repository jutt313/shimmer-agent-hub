
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// FULLY DYNAMIC REAL AUTOMATION EXECUTOR - Uses AI-generated execution blueprints ONLY
class FullyDynamicRealAutomationExecutor {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * FULLY DYNAMIC: Execute automation using AI-generated execution blueprint ONLY
   */
  async executeAutomation(automationId: string, userId: string, triggerData?: any): Promise<any> {
    console.log(`🚀 FULLY DYNAMIC EXECUTION: Starting automation ${automationId} for user ${userId}`);
    
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
            execution_type: 'fully_dynamic_ai_driven'
          }
        })
        .select()
        .single();

      if (runError) {
        throw new Error('Failed to create execution run');
      }

      console.log(`📝 Created execution run: ${run.id}`);

      // Execute automation steps with FULLY DYNAMIC AI configuration
      const blueprint = automation.automation_blueprint;
      const executionResult = await this.executeFullyDynamicAutomationSteps(
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

      console.log(`✅ FULLY DYNAMIC EXECUTION completed for automation ${automationId}`);

      return {
        success: executionResult.success,
        message: executionResult.success 
          ? 'Automation executed successfully with fully dynamic AI-driven execution using validated credentials'
          : 'Automation execution failed',
        run_id: run.id,
        details: executionResult.logs,
        duration_ms: executionResult.duration
      };

    } catch (error: any) {
      console.error(`💥 FULLY DYNAMIC EXECUTION failed:`, error);
      
      return {
        success: false,
        message: `Automation execution failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * FULLY DYNAMIC: Execute automation steps using AI-generated execution blueprint ONLY
   */
  async executeFullyDynamicAutomationSteps(
    blueprint: any, 
    credentials: any[], 
    triggerData: any, 
    runId: string
  ): Promise<any> {
    const startTime = Date.now();
    const logs = { 
      started_at: new Date().toISOString(), 
      steps: [],
      fully_dynamic_execution: true,
      ai_driven_execution: true,
      validated_credentials: true
    };

    try {
      console.log('🔄 Executing automation steps with FULLY DYNAMIC AI-generated execution blueprint');

      // Create credential map for easy access
      const credMap = new Map();
      credentials.forEach(cred => {
        credMap.set(cred.platform_name.toLowerCase(), JSON.parse(cred.credentials));
      });

      console.log(`🗝️ Available validated platforms: ${Array.from(credMap.keys()).join(', ')}`);

      // Execute each step in the blueprint using FULLY DYNAMIC configuration
      if (blueprint?.steps && Array.isArray(blueprint.steps)) {
        for (let i = 0; i < blueprint.steps.length; i++) {
          const step = blueprint.steps[i];
          const stepPlatform = step.platform?.toLowerCase();
          
          console.log(`📋 Executing DYNAMIC step ${i + 1}: ${step.action || 'Unknown action'} on ${step.platform || 'Unknown platform'}`);

          if (!stepPlatform || !credMap.has(stepPlatform)) {
            throw new Error(`No validated credentials found for platform: ${step.platform}`);
          }

          const stepResult = await this.executeFullyDynamicStep(step, credMap.get(stepPlatform), triggerData, stepPlatform);
          
          logs.steps.push({
            step_number: i + 1,
            step_name: step.action || 'Unknown',
            platform: step.platform || 'Unknown',
            status: stepResult.success ? 'success' : 'failed',
            result: stepResult.result,
            error: stepResult.error,
            executed_at: new Date().toISOString(),
            fully_dynamic_execution: true,
            ai_driven_call: true,
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
      console.log(`✅ All steps executed successfully with FULLY DYNAMIC AI execution in ${duration}ms`);

      return {
        success: true,
        logs,
        duration
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ FULLY DYNAMIC step execution failed:', error);

      logs.steps.push({
        step_name: 'dynamic_execution_error',
        status: 'failed',
        error: error.message,
        executed_at: new Date().toISOString(),
        fully_dynamic_execution: true
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
   * FULLY DYNAMIC: Execute individual step using AI-generated configuration ONLY
   */
  async executeFullyDynamicStep(step: any, credentials: any, data: any, platformName: string): Promise<any> {
    console.log(`🔧 Executing FULLY DYNAMIC step: ${step.action} on ${platformName} with AI-generated config`);

    try {
      // Get AI-generated execution configuration - NO FALLBACKS
      const executionConfig = await this.getAIGeneratedExecutionConfig(step, platformName);
      
      if (!executionConfig || !executionConfig.method || !executionConfig.endpoint) {
        throw new Error(`AI failed to generate complete execution configuration for ${step.action} on ${platformName}`);
      }

      // Build fully dynamic request using AI configuration
      const { headers, url, body } = this.buildFullyDynamicExecutionRequest(
        executionConfig, 
        credentials, 
        step, 
        data,
        platformName
      );

      console.log(`📡 Making FULLY DYNAMIC AI-powered API call to: ${executionConfig.method || 'POST'} ${url}`);

      // Make DYNAMIC API call
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

      console.log(`📊 FULLY DYNAMIC API Response: Status ${response.status}, Time ${requestTime}ms`);

      if (!response.ok) {
        throw new Error(`FULLY DYNAMIC API call failed with status ${response.status}: ${responseText}`);
      }

      console.log(`✅ Step executed successfully with FULLY DYNAMIC AI-powered API call`);

      return {
        success: true,
        result: responseData,
        response_status: response.status,
        api_endpoint: url,
        request_time_ms: requestTime
      };

    } catch (error: any) {
      console.error(`❌ FULLY DYNAMIC step execution failed:`, error);
      
      return {
        success: false,
        error: error.message,
        result: null,
        api_endpoint: 'dynamic_execution_failed'
      };
    }
  }

  /**
   * FULLY DYNAMIC: Get AI-generated execution configuration - NO FALLBACKS
   */
  async getAIGeneratedExecutionConfig(step: any, platformName: string): Promise<any> {
    console.log(`🔧 Getting AI-generated execution config for ${step.action} on ${platformName} - NO FALLBACKS`);
    
    try {
      const { data, error } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate COMPLETE execution configuration for ${platformName} to perform: ${step.action}

CRITICAL: Return ONLY valid JSON with ALL required fields:
{
  "method": "POST",
  "base_url": "https://api.platform.com",
  "endpoint": "/v1/action/endpoint",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {api_key}"
  },
  "request_body": {
    "key": "value"
  },
  "description": "Perform the action"
}

REAL endpoints for specific platforms:
- OpenAI: base_url "https://api.openai.com", for text generation use "/v1/chat/completions"
- Typeform: base_url "https://api.typeform.com", for form operations use "/forms"
- Google Sheets: base_url "https://sheets.googleapis.com", for data operations use "/v4/spreadsheets"

Return ONLY the complete JSON configuration with NO text before or after.`,
          messages: [],
          requestType: 'dynamic_execution_config'
        }
      });

      if (error) {
        console.error('💥 AI execution config generation failed:', error);
        throw new Error(`AI failed to generate execution configuration: ${error.message}`);
      }

      let executionConfig;
      try {
        if (typeof data === 'string') {
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('AI response does not contain valid JSON');
          }
          executionConfig = JSON.parse(jsonMatch[0]);
        } else {
          executionConfig = data;
        }
      } catch (parseError) {
        console.error('💥 Failed to parse AI execution config:', parseError);
        throw new Error(`AI generated invalid execution configuration: ${parseError.message}`);
      }

      // Validate AI-generated config
      if (!executionConfig.method || !executionConfig.base_url || !executionConfig.endpoint) {
        throw new Error('AI generated incomplete execution configuration - missing required fields');
      }

      console.log(`✅ AI-generated execution config validated for ${platformName}`);
      return executionConfig;

    } catch (error: any) {
      console.error('💥 AI execution config generation completely failed:', error);
      throw new Error(`AI execution configuration generation failed: ${error.message}`);
    }
  }

  /**
   * FULLY DYNAMIC: Build execution request using AI configuration ONLY
   */
  buildFullyDynamicExecutionRequest(config: any, credentials: any, step: any, data: any, platformName: string): any {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Fully-Dynamic-Executor/5.0',
      ...config.headers
    };

    // FULLY DYNAMIC: Platform-agnostic authentication using AI config
    Object.keys(headers).forEach(headerKey => {
      Object.keys(credentials).forEach(credKey => {
        if (credentials[credKey]) {
          headers[headerKey] = headers[headerKey].replace(`{${credKey}}`, credentials[credKey]);
          headers[headerKey] = headers[headerKey].replace(`{api_key}`, credentials[credKey]);
          headers[headerKey] = headers[headerKey].replace(`{access_token}`, credentials[credKey]);
          headers[headerKey] = headers[headerKey].replace(`{token}`, credentials[credKey]);
          headers[headerKey] = headers[headerKey].replace(`{bot_token}`, credentials[credKey]);
          headers[headerKey] = headers[headerKey].replace(`{personal_access_token}`, credentials[credKey]);
          headers[headerKey] = headers[headerKey].replace(`{integration_token}`, credentials[credKey]);
        }
      });
    });

    // Build URL using AI configuration
    const baseUrl = config.base_url;
    const endpoint = config.endpoint;
    const url = baseUrl + endpoint;

    // Build body using AI configuration and dynamic data substitution
    const body = this.buildFullyDynamicRequestBody(step, data, config, platformName);

    return { headers, url, body };
  }

  /**
   * FULLY DYNAMIC: Build request body using AI configuration ONLY
   */
  buildFullyDynamicRequestBody(step: any, data: any, config: any, platformName: string): any {
    console.log(`🔧 Building FULLY DYNAMIC request body for ${platformName} using AI config`);

    // Use AI-provided request body as base
    let body = config.request_body || {};

    // Apply step parameters dynamically
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

    // If no specific body structure, merge step parameters
    if (Object.keys(body).length === 0 && step.parameters) {
      body = { ...step.parameters };
    }

    console.log(`✅ FULLY DYNAMIC request body built for ${platformName}`);
    return Object.keys(body).length > 0 ? body : null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let executionRecord: any = null;

  try {
    const { automation_id, user_id, generated_code, trigger_data } = await req.json();
    
    console.log(`🚀 ENHANCED EXECUTION: ${automation_id} with AI-generated code for user ${user_id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get automation details
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('*')
      .eq('id', automation_id)
      .eq('user_id', user_id)
      .single();

    if (automationError || !automation) {
      throw new Error('Automation not found');
    }

    // Create execution record
    const { data: newExecutionRecord, error: executionError } = await supabase
      .from('automation_executions')
      .insert({
        automation_id,
        user_id,
        generated_code,
        status: 'running'
      })
      .select()
      .single();

    if (executionError) {
      throw new Error('Failed to create execution record');
    }

    executionRecord = newExecutionRecord;
    console.log(`📝 Created execution record: ${executionRecord.id}`);

    // If AI-generated code is provided, use it for execution
    if (generated_code) {
      console.log('🤖 Executing AI-generated automation code...');

      // Create safe execution environment
      const executionContext = {
        supabase,
        console,
        fetch,
        automation_id,
        user_id,
        trigger_data,
        // Add abort signal for timeout
        AbortSignal
      };

      // Execute generated code in a controlled environment
      const executionFunction = new Function(
        'context', 
        `
        const { supabase, console, fetch, automation_id, user_id, trigger_data, AbortSignal } = context;
        return (async () => {
          try {
            ${generated_code}
          } catch (error) {
            console.error('Execution error:', error);
            return {
              success: false,
              results: [],
              errors: [error.message],
              executionLog: ['Execution failed: ' + error.message]
            };
          }
        })();
        `
      );

      const executionResult = await executionFunction(executionContext);

      // Update execution record with results
      await supabase
        .from('automation_executions')
        .update({
          status: executionResult.success ? 'completed' : 'failed',
          execution_result: executionResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', executionRecord.id);

      console.log(`✅ AI-generated automation executed: ${executionResult.success ? 'SUCCESS' : 'FAILED'}`);

      return new Response(JSON.stringify({
        success: executionResult.success,
        execution_id: executionRecord.id,
        results: executionResult.results || [],
        errors: executionResult.errors || [],
        executionLog: executionResult.executionLog || [],
        message: executionResult.success 
          ? 'Automation executed successfully with AI-generated code'
          : 'Automation execution completed with errors'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Fall back to existing execution system if no AI code provided
      const executor = new FullyDynamicRealAutomationExecutor(supabase);
      const result = await executor.executeAutomation(automation_id, user_id, trigger_data);
      
      // Update execution record
      await supabase
        .from('automation_executions')
        .update({
          status: result.success ? 'completed' : 'failed',
          execution_result: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', executionRecord.id);

      return new Response(JSON.stringify({
        ...result,
        execution_id: executionRecord.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('❌ ENHANCED EXECUTION SYSTEM ERROR:', error);
    
    // Update execution record with error if it exists
    if (executionRecord?.id) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('automation_executions')
          .update({
            status: 'failed',
            execution_result: { error: error.message },
            updated_at: new Date().toISOString()
          })
          .eq('id', executionRecord.id);
      } catch (updateError) {
        console.error('Failed to update execution record with error:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Enhanced execution system error: ${error.message}`,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
