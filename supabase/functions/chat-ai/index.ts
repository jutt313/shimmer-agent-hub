
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const ENHANCED_SYSTEM_PROMPT = `You are YusrAI, an advanced automation assistant with full conversation memory and knowledge integration. You MUST respond with VALID JSON only.

CONVERSATION CONTEXT AWARENESS:
- You have access to the full conversation history for this automation
- Always consider previous messages and configurations when responding
- If platforms were discussed before, acknowledge them in your response
- If credentials were mentioned, reference them appropriately
- Maintain consistency with previous recommendations

PLATFORM MANAGEMENT INSTRUCTIONS:
- If user asks to remove a platform, set it in "platforms_to_remove" array
- If user asks to add/update platforms, include them in "platforms" array
- Always provide clear instructions about what changed with platforms
- Be specific about credential requirements and why they're needed

KNOWLEDGE STORE INTEGRATION:
- Use relevant automation patterns from knowledge store
- Provide context-aware suggestions based on stored knowledge
- Reference best practices for the specific automation type

MANDATORY JSON FORMAT:
{
  "summary": "Brief description that acknowledges conversation context",
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
  "platforms_to_remove": ["Platform Name"],
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
  },
  "conversation_updates": {
    "platform_changes": "Description of platform changes made",
    "context_acknowledged": "Summary of what was understood from conversation history"
  }
}

CRITICAL: Respond ONLY with valid JSON. No extra text. Consider full conversation context.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
  }

  try {
    const { message, messages = [], automationId, automationContext } = await req.json();
    
    console.log('🔄 Processing chat request with full context:', message?.substring(0, 50));
    console.log('📚 Conversation history length:', messages.length);
    console.log('🔧 Automation context:', automationContext?.title);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Initialize Supabase client for knowledge store access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let knowledgeContext = "";
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Query knowledge store for relevant automation patterns
        const { data: knowledgeData, error: knowledgeError } = await supabase
          .from('universal_knowledge_store')
          .select('title, summary, details')
          .or(`title.ilike.%${message.substring(0, 50)}%,summary.ilike.%automation%,category.eq.automation`)
          .limit(3);

        if (!knowledgeError && knowledgeData && knowledgeData.length > 0) {
          knowledgeContext = `\n\nRELEVANT KNOWLEDGE STORE CONTEXT:\n${knowledgeData.map(k => `- ${k.title}: ${k.summary}`).join('\n')}`;
          console.log('📖 Retrieved knowledge store context:', knowledgeData.length, 'entries');
        }
      } catch (knowledgeErr) {
        console.log('⚠️ Knowledge store access failed:', knowledgeErr);
      }
    }

    // Build comprehensive conversation context
    const conversationHistory = messages.map((msg: any, index: number) => {
      const role = msg.isBot ? 'assistant' : 'user';
      let content = msg.text;
      
      // For assistant messages, try to use the original structured response if available
      if (msg.isBot && msg.structuredData) {
        content = JSON.stringify(msg.structuredData);
      }
      
      return { role, content };
    });

    // Add automation context to system prompt
    let contextualSystemPrompt = ENHANCED_SYSTEM_PROMPT;
    if (automationContext) {
      contextualSystemPrompt += `\n\nCURRENT AUTOMATION CONTEXT:\n- Title: "${automationContext.title}"\n- Description: "${automationContext.description || 'No description'}"\n- Status: ${automationContext.status}\n- Current Blueprint: ${automationContext.automation_blueprint ? 'Exists' : 'Not yet created'}`;
    }
    
    if (knowledgeContext) {
      contextualSystemPrompt += knowledgeContext;
    }

    // Build messages array with full conversation context
    const requestMessages = [
      { role: 'system', content: contextualSystemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    console.log('📡 Making OpenAI request with', requestMessages.length, 'messages...');

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: requestMessages,
      max_tokens: 3000,
      temperature: 0.1,
    };

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

    console.log('✅ Received OpenAI response with context, length:', aiResponse.length);

    // Try to clean and validate JSON
    try {
      // Remove any markdown formatting
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to parse to validate
      const parsed = JSON.parse(aiResponse);
      console.log('✅ JSON validation successful with conversation context');
      
      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      
      // Return a context-aware fallback response
      const fallbackResponse = {
        "summary": "I understand our conversation and I'm ready to help with your automation. Let me provide you with the next steps.",
        "steps": [
          "Review our previous discussion",
          "Identify missing platform configurations", 
          "Configure required credentials",
          "Test platform connections",
          "Finalize automation setup"
        ],
        "platforms": [],
        "platforms_to_remove": [],
        "agents": [],
        "clarification_questions": [
          "Based on our conversation, what specific aspect would you like me to focus on next?",
          "Are there any platforms from our discussion that need credential updates?"
        ],
        "automation_blueprint": {
          "version": "1.0.0",
          "description": "Context-aware automation workflow",
          "trigger": {"type": "manual", "details": {}},
          "steps": [],
          "variables": {}
        },
        "conversation_updates": {
          "platform_changes": "Ready to process platform updates based on conversation context",
          "context_acknowledged": "I have access to our full conversation history and automation context"
        }
      };
      
      return new Response(JSON.stringify({ response: JSON.stringify(fallbackResponse) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

  } catch (error) {
    console.error('💥 Chat function error:', error);
    
    // Return context-aware error response
    const errorResponse = {
      "summary": "I'm experiencing technical difficulties but I maintain our conversation context. Please try again.",
      "steps": ["Retry your request", "Check connection", "Contact support if issue persists"],
      "platforms": [],
      "platforms_to_remove": [],
      "agents": [],
      "clarification_questions": ["Could you please rephrase your request? I'll respond with full conversation awareness."],
      "automation_blueprint": {
        "version": "1.0.0",
        "description": "Error state - conversation context maintained",
        "trigger": {"type": "manual", "details": {}},
        "steps": [],
        "variables": {}
      },
      "conversation_updates": {
        "platform_changes": "Error occurred but conversation context is maintained",
        "context_acknowledged": "Full conversation history is preserved"
      }
    };

    return new Response(JSON.stringify({ 
      response: JSON.stringify(errorResponse),
      error: error.message 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
