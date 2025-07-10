
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced system prompt with agent state awareness
const ENHANCED_SYSTEM_PROMPT = `You are YusrAI, an expert automation creator. You create comprehensive automation blueprints with platforms, credentials, and AI agents.

## CRITICAL AGENT STATE AWARENESS:
- NEVER recommend agents that have been added or dismissed by the user
- Always check the agentStatusSummary for current agent decisions
- If agents are marked as "Added" or "Dismissed" - DO NOT recommend them again
- Only recommend NEW agents that haven't been handled yet

## RESPONSE FORMAT (ALWAYS JSON):
{
  "summary": "Brief explanation of what you're creating",
  "steps": ["step1", "step2", "step3"],
  "platforms": [
    {
      "name": "PlatformName",
      "credentials": [
        {
          "field": "api_key",
          "why_needed": "Required for API access",
          "link": "https://platform.com/settings/api"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "AgentName",
      "role": "Data Processor",
      "why_needed": "Enhances automation with AI",
      "platform": "OpenAI"
    }
  ],
  "automation_blueprint": {
    "title": "Automation Title",
    "description": "What this automation does",
    "trigger": {
      "type": "webhook",
      "platform": "Webhook"
    },
    "steps": [
      {
        "id": "step-1",
        "type": "api_call",
        "platform": "PlatformName",
        "action": "create_record",
        "description": "Step description"
      }
    ]
  }
}

## AGENT RECOMMENDATION RULES:
1. Check agentStatusSummary FIRST before recommending any agents
2. NEVER recommend agents marked as "Added" or "Dismissed"
3. Only suggest NEW agents that would genuinely improve the automation
4. If all needed agents are handled, focus on platform setup and execution
5. Be intelligent about agent suggestions - don't over-recommend

Always respond with valid JSON only.`;

serve(async (req) => {
  console.log('🚀 Enhanced Chat AI function called with agent state awareness');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not found');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { message, messages, automationId, automationContext, agentStatusSummary } = await req.json();
    
    console.log('📝 Chat AI processing request:', {
      messageLength: message?.length || 0,
      historyCount: messages?.length || 0,
      automationId: automationId || 'none',
      agentStatus: agentStatusSummary || 'none'
    });

    // Build conversation context with agent state awareness
    let conversationContext = `
AUTOMATION CONTEXT:
- Title: ${automationContext?.title || 'New Automation'}
- Status: ${automationContext?.status || 'draft'}
- ID: ${automationId || 'new'}

AGENT STATUS SUMMARY:
${agentStatusSummary || 'No agent decisions made yet.'}

CONVERSATION HISTORY:
${messages?.slice(-5).map(msg => `${msg.isBot ? 'AI' : 'User'}: ${msg.text.substring(0, 200)}...`).join('\n') || 'No previous messages'}

CURRENT USER MESSAGE: ${message}

Remember: DO NOT recommend agents that are already Added or Dismissed. Focus on NEW improvements and platform configuration.`;

    console.log('🎯 Enhanced conversation context prepared with agent awareness');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: ENHANCED_SYSTEM_PROMPT },
          { role: 'user', content: conversationContext }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    console.log('✅ Enhanced AI response generated with agent state awareness:', {
      hasSummary: !!aiResponse.summary,
      stepsCount: aiResponse.steps?.length || 0,
      platformsCount: aiResponse.platforms?.length || 0,
      agentsCount: aiResponse.agents?.length || 0,
      hasBlueprint: !!aiResponse.automation_blueprint
    });

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Enhanced Chat AI error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process chat request with agent state',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
