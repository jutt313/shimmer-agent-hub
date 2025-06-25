
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const SIMPLIFIED_SYSTEM_PROMPT = `You are YusrAI, an automation assistant. You MUST respond with VALID JSON only.

MANDATORY JSON FORMAT:
{
  "summary": "Brief description of automation",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "platforms": [
    {
      "name": "Platform Name",
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "Enter API key",
          "why_needed": "Required for authentication"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "Agent Name",
      "role": "Agent role",
      "goal": "What this agent does",
      "why_needed": "Why this agent is needed"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Automation description",
    "trigger": {"type": "manual", "details": {}},
    "steps": [
      {
        "id": "step_1",
        "name": "Step Name",
        "type": "action",
        "action": {
          "integration": "platform_name",
          "method": "action_method",
          "parameters": {}
        }
      }
    ],
    "variables": {}
  }
}

CRITICAL: Respond ONLY with valid JSON. No extra text.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { message, messages = [] } = await req.json();
    
    console.log('🔄 Processing chat request:', message?.substring(0, 50));

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Create a simplified request for faster processing
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SIMPLIFIED_SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      max_tokens: 2000,
      temperature: 0.1,
    };

    console.log('📡 Making OpenAI request...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    console.log('✅ Received OpenAI response, length:', aiResponse.length);

    // Try to clean and validate JSON
    try {
      // Remove any markdown formatting
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to parse to validate
      const parsed = JSON.parse(aiResponse);
      console.log('✅ JSON validation successful');
      
      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      
      // Return a fallback valid JSON response
      const fallbackResponse = {
        "summary": "I'm processing your automation request. Please provide more details about what you'd like to automate.",
        "steps": [
          "Clarify automation requirements",
          "Identify necessary platforms and integrations",
          "Design workflow structure",
          "Configure platform connections",
          "Test and deploy automation"
        ],
        "platforms": [],
        "agents": [],
        "clarification_questions": [
          "What specific trigger would you like to use for this automation?",
          "Which platforms or services should be integrated?",
          "What actions should the automation perform?"
        ],
        "automation_blueprint": {
          "version": "1.0.0",
          "description": "Automation workflow in development",
          "trigger": {"type": "manual", "details": {}},
          "steps": [],
          "variables": {}
        }
      };
      
      return new Response(JSON.stringify({ response: JSON.stringify(fallbackResponse) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

  } catch (error) {
    console.error('💥 Chat function error:', error);
    
    // Return error response with CORS headers
    const errorResponse = {
      "summary": "I'm experiencing technical difficulties. Please try again in a moment.",
      "steps": ["Retry your request", "Check your internet connection", "Contact support if the issue persists"],
      "platforms": [],
      "agents": [],
      "clarification_questions": ["Could you please try rephrasing your automation request?"],
      "automation_blueprint": {
        "version": "1.0.0",
        "description": "Error state - please retry",
        "trigger": {"type": "manual", "details": {}},
        "steps": [],
        "variables": {}
      }
    };

    return new Response(JSON.stringify({ 
      response: JSON.stringify(errorResponse),
      error: error.message 
    }), {
      status: 200, // Return 200 to avoid CORS issues
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
