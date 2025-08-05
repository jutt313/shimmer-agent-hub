
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LLM Provider configurations
const LLM_CONFIGS = {
  "OpenAI": {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    authHeader: "Bearer"
  },
  "Claude": {
    baseUrl: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-3-haiku-20240307",
    authHeader: "x-api-key"
  },
  "Gemini": {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
    defaultModel: "gemini-pro",
    authHeader: "key"
  },
  "Grok": {
    baseUrl: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-1",
    authHeader: "Bearer"
  },
  "DeepSeek": {
    baseUrl: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    authHeader: "Bearer"
  }
};

function generateDynamicSystemPrompt(agent: any, automationContext?: any): string {
  const basePrompt = `You are ${agent.agent_name}, an AI agent with the following configuration:

**AGENT IDENTITY:**
- Name: ${agent.agent_name}
- Role: ${agent.agent_role}
- Goal: ${agent.agent_goal}
- Rules: ${agent.agent_rules || 'Follow general AI guidelines'}

**MEMORY CONTEXT:**
${agent.agent_memory ? JSON.stringify(agent.agent_memory) : 'No previous memory available'}

**AUTOMATION CONTEXT:**
${automationContext ? `You are part of automation: ${automationContext.name || 'Unnamed Automation'}
Automation Description: ${automationContext.description || 'No description provided'}
Your specific role in this workflow: Execute tasks according to your goal and rules.` : 'You are operating in standalone mode for testing purposes.'}

**INSTRUCTIONS:**
- Always respond according to your defined role and goal
- Follow your rules strictly
- Use your memory context to provide consistent responses
- Be helpful, accurate, and professional
- If this is a test, confirm your understanding of your role and capabilities

**CURRENT MODE:** ${automationContext ? 'AUTOMATION_EXECUTION' : 'TESTING_MODE'}`;

  return basePrompt;
}

async function testOpenAI(agent: any, systemPrompt: string, apiKey: string, model: string) {
  const response = await fetch(LLM_CONFIGS.OpenAI.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'This is a test. Please confirm you understand your role and are ready to assist.' }
      ],
      max_tokens: 150,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function testClaude(agent: any, systemPrompt: string, apiKey: string, model: string) {
  const response = await fetch(LLM_CONFIGS.Claude.baseUrl, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        { role: 'user', content: 'This is a test. Please confirm you understand your role and are ready to assist.' }
      ]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function testGemini(agent: any, systemPrompt: string, apiKey: string, model: string) {
  const response = await fetch(`${LLM_CONFIGS.Gemini.baseUrl}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\nUser: This is a test. Please confirm you understand your role and are ready to assist.`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function testGrok(agent: any, systemPrompt: string, apiKey: string, model: string) {
  const response = await fetch(LLM_CONFIGS.Grok.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'This is a test. Please confirm you understand your role and are ready to assist.' }
      ],
      max_tokens: 150,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function testDeepSeek(agent: any, systemPrompt: string, apiKey: string, model: string) {
  const response = await fetch(LLM_CONFIGS.DeepSeek.baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'This is a test. Please confirm you understand your role and are ready to assist.' }
      ],
      max_tokens: 150,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent_id, automation_context } = await req.json();

    if (!agent_id) {
      throw new Error('Agent ID is required');
    }

    console.log(`🤖 Testing AI Agent: ${agent_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch agent details
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentError?.message || 'Unknown error'}`);
    }

    console.log(`🔍 Found agent: ${agent.agent_name} (${agent.llm_provider}/${agent.model})`);

    // Generate dynamic system prompt
    const systemPrompt = generateDynamicSystemPrompt(agent, automation_context);
    console.log(`📝 Generated system prompt for ${agent.agent_name}`);

    let testResponse = '';
    
    // Test based on LLM provider
    switch (agent.llm_provider) {
      case 'OpenAI':
        testResponse = await testOpenAI(agent, systemPrompt, agent.api_key, agent.model);
        break;
      case 'Claude':
        testResponse = await testClaude(agent, systemPrompt, agent.api_key, agent.model);
        break;
      case 'Gemini':
        testResponse = await testGemini(agent, systemPrompt, agent.api_key, agent.model);
        break;
      case 'Grok':
        testResponse = await testGrok(agent, systemPrompt, agent.api_key, agent.model);
        break;
      case 'DeepSeek':
        testResponse = await testDeepSeek(agent, systemPrompt, agent.api_key, agent.model);
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${agent.llm_provider}`);
    }

    console.log(`✅ Agent test successful: ${agent.agent_name}`);

    return new Response(JSON.stringify({
      success: true,
      user_message: `✅ AI Agent "${agent.agent_name}" tested successfully with ${agent.llm_provider}/${agent.model}!`,
      technical_details: {
        agent_name: agent.agent_name,
        llm_provider: agent.llm_provider,
        model: agent.model,
        test_response: testResponse.substring(0, 200) + '...',
        system_prompt_generated: true,
        automation_context_included: !!automation_context
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ AI Agent test failed:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error.message.includes('401')) {
      errorMessage = '🔑 Invalid API key. Please check your credentials.';
    } else if (error.message.includes('403')) {
      errorMessage = '🚫 Access denied. Check API key permissions.';
    } else if (error.message.includes('429')) {
      errorMessage = '⏰ Rate limit exceeded. Please wait and try again.';
    } else if (error.message.includes('404')) {
      errorMessage = '🔍 Model not found. Check your model selection.';
    } else {
      errorMessage = `❌ ${error.message}`;
    }

    return new Response(JSON.stringify({
      success: false,
      user_message: errorMessage,
      technical_details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
