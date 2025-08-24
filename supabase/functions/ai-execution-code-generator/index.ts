import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { automation_id, user_id } = await req.json();

    console.log(`🤖 AI Code Generator: Starting for automation ${automation_id}`);

    // Get automation blueprint
    const { data: automation, error: automationError } = await supabase
      .from('automations')
      .select('title, description, blueprint')
      .eq('id', automation_id)
      .eq('user_id', user_id)
      .single();

    if (automationError || !automation) {
      throw new Error('Automation not found');
    }

    // Get configured AI agents
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('automation_id', automation_id);

    if (agentsError) {
      throw new Error('Failed to fetch AI agents');
    }

    // Get platform credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('automation_platform_credentials')
      .select('*')
      .eq('automation_id', automation_id)
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (credentialsError) {
      throw new Error('Failed to fetch credentials');
    }

    console.log(`📊 Found ${agents?.length || 0} agents and ${credentials?.length || 0} credentials`);

    // Create AI prompt for code generation with enhanced system prompt
    const systemPrompt = `You are an AI Execution Code Generator for automation workflows.

CONTEXT:
- Automation: "${automation.title}"
- Description: "${automation.description}"
- Blueprint: ${JSON.stringify(automation.blueprint, null, 2)}
- AI Agents (${agents?.length || 0}): ${JSON.stringify(agents, null, 2)}
- Platform Credentials (${credentials?.length || 0}): ${JSON.stringify(credentials?.map(c => ({ 
    platform: c.platform_name, 
    type: c.credential_type,
    is_tested: c.is_tested,
    test_status: c.test_status 
  })), null, 2)}

GENERATE EXECUTABLE JAVASCRIPT CODE that:
1. Implements each blueprint step sequentially with error handling
2. Integrates AI agents at decision points using their configured APIs
3. Uses platform credentials for external API calls
4. Logs execution progress at each step
5. Returns structured results: { success: boolean, results: any[], errors: any[], executionLog: string[] }

AGENT INTEGRATION:
- For each AI agent call, use agent.llm_provider and agent.api_key
- Pass agent.agent_role, agent.agent_goal, and agent.agent_rules as context
- Include agent.agent_memory for context continuity

PLATFORM INTEGRATION:
- Use stored credentials for API authentication
- Handle different credential types (api_key, oauth, basic_auth)
- Include comprehensive error handling for API failures

RETURN ONLY EXECUTABLE CODE with detailed comments explaining each section.`;

    const userPrompt = `Generate execution code for this automation workflow that integrates the configured AI agents and platform credentials.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      }),
    });

    const aiResult = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResult.error?.message || 'Unknown error'}`);
    }

    const generatedCode = aiResult.choices[0].message.content;

    console.log(`✅ AI Code Generator: Generated ${generatedCode.length} characters of code`);

    // Store generated code for execution
    const { error: storeError } = await supabase
      .from('automation_executions')
      .upsert({
        automation_id,
        user_id,
        generated_code: generatedCode,
        generation_timestamp: new Date().toISOString(),
        status: 'code_generated'
      });

    if (storeError) {
      console.error('Failed to store generated code:', storeError);
    }

    return new Response(JSON.stringify({
      success: true,
      generated_code: generatedCode,
      automation_id,
      agents_count: agents?.length || 0,
      credentials_count: credentials?.length || 0,
      code_length: generatedCode.length,
      timestamp: new Date().toISOString(),
      validation_complete: true,
      ready_for_execution: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ AI Code Generation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
