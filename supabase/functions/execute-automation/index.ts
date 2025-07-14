
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// REAL AUTOMATION EXECUTOR - Uses tested credentials for actual execution
class RealAutomationExecutor {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  /**
   * Execute automation using REAL tested credentials
   */
  async executeAutomation(automationId: string, userId: string, triggerData?: any): Promise<any> {
    console.log(`🚀 REAL EXECUTION: Starting automation ${automationId} for user ${userId}`);
    
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

      // Get all tested credentials for this automation
      const { data: credentials, error: credError } = await this.supabase
        .from('automation_platform_credentials')
        .select('*')
        .eq('automation_id', automationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_tested', true)
        .eq('test_status', 'success');

      if (credError) {
        throw new Error('Failed to get credentials');
      }

      console.log(`🔑 Found ${credentials?.length || 0} tested credentials`);

      // Create execution run record
      const { data: run, error: runError } = await this.supabase
        .from('automation_runs')
        .insert({
          automation_id: automationId,
          user_id: userId,
          status: 'running',
          trigger_data: triggerData || {},
          details_log: { started_at: new Date().toISOString(), steps: [] }
        })
        .select()
        .single();

      if (runError) {
        throw new Error('Failed to create execution run');
      }

      console.log(`📝 Created execution run: ${run.id}`);

      // Execute automation steps
      const blueprint = automation.automation_blueprint;
      const executionResult = await this.executeAutomationSteps(
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

      console.log(`✅ REAL EXECUTION completed for automation ${automationId}`);

      return {
        success: executionResult.success,
        message: executionResult.success 
          ? 'Automation executed successfully with real API calls'
          : 'Automation execution failed',
        run_id: run.id,
        details: executionResult.logs,
        duration_ms: executionResult.duration
      };

    } catch (error: any) {
      console.error(`💥 REAL EXECUTION failed:`, error);
      
      return {
        success: false,
        message: `Automation execution failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Execute automation steps with real API calls
   */
  async executeAutomationSteps(
    blueprint: any, 
    credentials: any[], 
    triggerData: any, 
    runId: string
  ): Promise<any> {
    const startTime = Date.now();
    const logs = { 
      started_at: new Date().toISOString(), 
      steps: [],
      real_execution: true
    };

    try {
      console.log('🔄 Executing automation steps with real API calls');

      // Create credential map for easy access
      const credMap = new Map();
      credentials.forEach(cred => {
        credMap.set(cred.platform_name.toLowerCase(), JSON.parse(cred.credentials));
      });

      // Execute each step in the blueprint
      if (blueprint?.steps && Array.isArray(blueprint.steps)) {
        for (let i = 0; i < blueprint.steps.length; i++) {
          const step = blueprint.steps[i];
          console.log(`📋 Executing step ${i + 1}: ${step.action || 'Unknown action'}`);

          const stepResult = await this.executeStep(step, credMap, triggerData);
          
          logs.steps.push({
            step_number: i + 1,
            step_name: step.action || 'Unknown',
            platform: step.platform || 'Unknown',
            status: stepResult.success ? 'success' : 'failed',
            result: stepResult.result,
            error: stepResult.error,
            executed_at: new Date().toISOString(),
            real_api_call: true
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
      console.log(`✅ All steps executed successfully in ${duration}ms`);

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
        executed_at: new Date().toISOString()
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
   * Execute individual step with real API call
   */
  async executeStep(step: any, credMap: Map<string, any>, data: any): Promise<any> {
    console.log(`🔧 Executing step: ${step.action} on ${step.platform}`);

    try {
      const platformName = step.platform?.toLowerCase();
      const credentials = credMap.get(platformName);

      if (!credentials) {
        throw new Error(`No tested credentials found for ${step.platform}`);
      }

      // Get platform configuration using chat-ai (same as testing)
      const { data: configData, error: configError } = await this.supabase.functions.invoke('chat-ai', {
        body: {
          message: `Generate API execution configuration for ${step.platform} to perform action: ${step.action}. Include the exact API endpoint, method, and request body structure. Return valid JSON.`,
          messages: [],
          requestType: 'execution_config'
        }
      });

      if (configError) {
        throw new Error(`Failed to get execution config: ${configError.message}`);
      }

      // Parse execution config
      let executionConfig;
      try {
        if (typeof configData === 'string') {
          const jsonMatch = configData.match(/\{[\s\S]*\}/);
          executionConfig = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } else {
          executionConfig = configData;
        }
      } catch {
        executionConfig = this.getDefaultExecutionConfig(step);
      }

      // Build request
      const { headers, url, body } = this.buildExecutionRequest(
        executionConfig, 
        credentials, 
        step, 
        data
      );

      console.log(`📡 Making real API call to: ${url}`);

      // Make real API call
      const response = await fetch(url, {
        method: executionConfig.method || 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw_response: responseText };
      }

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}: ${responseText}`);
      }

      console.log(`✅ Step executed successfully`);

      return {
        success: true,
        result: responseData,
        status_code: response.status
      };

    } catch (error: any) {
      console.error(`❌ Step execution failed:`, error);
      
      return {
        success: false,
        error: error.message,
        result: null
      };
    }
  }

  /**
   * Build execution request with real authentication
   */
  buildExecutionRequest(config: any, credentials: any, step: any, data: any): any {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Real-Executor/1.0'
    };

    // Add authentication (same logic as testing)
    if (credentials.access_token) {
      headers['Authorization'] = `Bearer ${credentials.access_token}`;
    } else if (credentials.api_key) {
      headers['Authorization'] = `Bearer ${credentials.api_key}`;
      headers['X-API-Key'] = credentials.api_key;
    }

    // Build URL and body based on action
    const baseUrl = config.base_url || `https://api.${step.platform.toLowerCase()}.com`;
    const endpoint = config.endpoint || this.getDefaultEndpoint(step.action);
    const url = baseUrl + endpoint;

    const body = this.buildRequestBody(step, data, config);

    return { headers, url, body };
  }

  /**
   * Get default execution config when chat-ai fails
   */
  getDefaultExecutionConfig(step: any): any {
    return {
      method: 'POST',
      base_url: `https://api.${step.platform.toLowerCase()}.com`,
      endpoint: this.getDefaultEndpoint(step.action)
    };
  }

  /**
   * Get default endpoint based on action
   */
  getDefaultEndpoint(action: string): string {
    const actionMap: Record<string, string> = {
      'send_email': '/v1/mail/send',
      'create_document': '/v1/documents',
      'add_row': '/v1/spreadsheets/values',
      'send_message': '/v1/chat/messages',
      'create_task': '/v1/tasks',
      'upload_file': '/v1/files'
    };

    return actionMap[action.toLowerCase()] || '/v1/execute';
  }

  /**
   * Build request body based on step and data
   */
  buildRequestBody(step: any, data: any, config: any): any {
    // Use step parameters and input data to build request
    const body: any = {};

    if (step.parameters) {
      Object.entries(step.parameters).forEach(([key, value]) => {
        // Replace placeholders with actual data
        if (typeof value === 'string' && value.includes('{{')) {
          const placeholder = value.match(/\{\{(\w+)\}\}/)?.[1];
          if (placeholder && data[placeholder]) {
            body[key] = data[placeholder];
          } else {
            body[key] = value;
          }
        } else {
          body[key] = value;
        }
      });
    }

    return Object.keys(body).length > 0 ? body : null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { automation_id, user_id, trigger_data } = await req.json();
    
    console.log(`🌟 REAL AUTOMATION EXECUTION: ${automation_id} for user ${user_id}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const executor = new RealAutomationExecutor(supabase);
    const result = await executor.executeAutomation(automation_id, user_id, trigger_data);
    
    console.log(`📊 REAL EXECUTION RESULT:`, result.success ? '✅ SUCCESS' : '❌ FAILED');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ REAL EXECUTION SYSTEM ERROR:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Real execution system error: ${error.message}`,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
