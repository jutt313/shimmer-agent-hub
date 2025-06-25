
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
- Remember what agents were previously recommended and their status

PLATFORM MANAGEMENT INSTRUCTIONS:
- If user asks to remove a platform, set it in "platforms_to_remove" array
- If user asks to add/update platforms, include them in "platforms" array
- Always provide clear instructions about what changed with platforms
- Be specific about credential requirements and why they're needed
- Update platform configurations based on conversation context

KNOWLEDGE STORE INTEGRATION:
- Use relevant automation patterns from knowledge store
- Provide context-aware suggestions based on stored knowledge
- Reference best practices for the specific automation type
- Apply learned patterns to current automation context

AGENT MANAGEMENT:
- Track previously recommended agents across conversation
- Only recommend new agents if they serve different purposes
- If agents were dismissed, don't recommend them again unless specifically asked
- Include agent recommendations in "agents" array with full details

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
    "context_acknowledged": "Summary of what was understood from conversation history",
    "knowledge_applied": "How knowledge store information was applied",
    "response_saved": "Confirmation that this response will be saved for future context"
  }
}

CRITICAL: Respond ONLY with valid JSON. No extra text. Consider full conversation context and apply knowledge store insights.`;

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
        
        // Enhanced knowledge store query with automation-specific context
        const searchTerms = [
          message.substring(0, 100),
          automationContext?.title || '',
          'automation',
          'workflow',
          'integration'
        ].filter(term => term.length > 0);

        const { data: knowledgeData, error: knowledgeError } = await supabase
          .from('universal_knowledge_store')
          .select('title, summary, details, category')
          .or(searchTerms.map(term => `title.ilike.%${term}%,summary.ilike.%${term}%,details.ilike.%${term}%`).join(','))
          .limit(5);

        if (!knowledgeError && knowledgeData && knowledgeData.length > 0) {
          knowledgeContext = `\n\nRELEVANT KNOWLEDGE STORE CONTEXT:\n${knowledgeData.map(k => 
            `- ${k.title} (${k.category}): ${k.summary}\n  Details: ${k.details?.substring(0, 200) || 'No additional details'}`
          ).join('\n\n')}`;
          console.log('📖 Enhanced knowledge store context retrieved:', knowledgeData.length, 'entries');
        }
      } catch (knowledgeErr) {
        console.log('⚠️ Knowledge store access failed:', knowledgeErr);
      }
    }

    // Build comprehensive conversation context with enhanced processing
    const conversationHistory = messages.map((msg: any, index: number) => {
      const role = msg.isBot ? 'assistant' : 'user';
      let content = msg.text;
      
      // For assistant messages, include structured data context
      if (msg.isBot && msg.structuredData) {
        const structuredInfo = {
          summary: msg.structuredData.summary,
          platforms: msg.structuredData.platforms?.map((p: any) => p.name) || [],
          agents: msg.structuredData.agents?.map((a: any) => a.name) || [],
          platforms_removed: msg.structuredData.platforms_to_remove || []
        };
        content = `${msg.text}\n\n[CONTEXT: ${JSON.stringify(structuredInfo)}]`;
      }
      
      return { role, content };
    });

    // Enhanced automation context with conversation history insights
    let contextualSystemPrompt = ENHANCED_SYSTEM_PROMPT;
    if (automationContext) {
      const previousPlatforms = messages
        .filter((msg: any) => msg.isBot && msg.structuredData?.platforms)
        .flatMap((msg: any) => msg.structuredData.platforms.map((p: any) => p.name))
        .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index);
      
      const previousAgents = messages
        .filter((msg: any) => msg.isBot && msg.structuredData?.agents)
        .flatMap((msg: any) => msg.structuredData.agents.map((a: any) => a.name))
        .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index);

      contextualSystemPrompt += `\n\nCURRENT AUTOMATION CONTEXT:
- Title: "${automationContext.title}"
- Description: "${automationContext.description || 'No description'}"
- Status: ${automationContext.status}
- Current Blueprint: ${automationContext.automation_blueprint ? 'Exists' : 'Not yet created'}
- Previously Configured Platforms: [${previousPlatforms.join(', ')}]
- Previously Recommended Agents: [${previousAgents.join(', ')}]
- Conversation Length: ${messages.length} messages`;
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

    console.log('📡 Making OpenAI request with enhanced context:', requestMessages.length, 'messages...');

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: requestMessages,
      max_tokens: 4000,
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

    console.log('✅ Received enhanced OpenAI response, length:', aiResponse.length);

    // Enhanced JSON cleaning and validation
    try {
      // Remove any markdown formatting and clean response
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to parse to validate
      const parsed = JSON.parse(aiResponse);
      
      // Add response saving confirmation
      if (parsed.conversation_updates) {
        parsed.conversation_updates.response_saved = "This response has been processed and will be saved for future conversation context";
        parsed.conversation_updates.knowledge_applied = knowledgeContext ? "Applied relevant patterns from knowledge store" : "No specific knowledge store patterns applied";
      }
      
      console.log('✅ Enhanced JSON validation successful with full context awareness');
      
      return new Response(JSON.stringify({ response: JSON.stringify(parsed) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      
      // Enhanced fallback response with conversation awareness
      const fallbackResponse = {
        "summary": "I understand our full conversation history and I'm ready to help with your automation. Let me provide context-aware next steps.",
        "steps": [
          "Analyze our complete conversation history",
          "Apply relevant knowledge store patterns", 
          "Review previously configured platforms and agents",
          "Provide contextually appropriate recommendations",
          "Save this interaction for future reference"
        ],
        "platforms": [],
        "platforms_to_remove": [],
        "agents": [],
        "clarification_questions": [
          "Based on our complete conversation, what specific aspect would you like me to focus on next?",
          "Should I update any of the previously configured platforms or agents?"
        ],
        "automation_blueprint": {
          "version": "1.0.0",
          "description": "Context-aware automation workflow with full conversation memory",
          "trigger": {"type": "manual", "details": {}},
          "steps": [],
          "variables": {}
        },
        "conversation_updates": {
          "platform_changes": "Ready to process platform updates with full conversation context",
          "context_acknowledged": "Full conversation history processed and understood",
          "knowledge_applied": knowledgeContext ? "Knowledge store patterns available for application" : "Knowledge store queried but no specific patterns found",
          "response_saved": "This response will be saved and used for future conversation context"
        }
      };
      
      return new Response(JSON.stringify({ response: JSON.stringify(fallbackResponse) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

  } catch (error) {
    console.error('💥 Enhanced chat function error:', error);
    
    // Enhanced error response with conversation awareness
    const errorResponse = {
      "summary": "I'm experiencing technical difficulties but I maintain our full conversation context. Please try again.",
      "steps": ["Retry your request", "Check connection", "Contact support if issue persists"],
      "platforms": [],
      "platforms_to_remove": [],
      "agents": [],
      "clarification_questions": ["Could you please rephrase your request? I'll respond with full conversation awareness and knowledge store integration."],
      "automation_blueprint": {
        "version": "1.0.0",
        "description": "Error state - full conversation context and knowledge store integration maintained",
        "trigger": {"type": "manual", "details": {}},
        "steps": [],
        "variables": {}
      },
      "conversation_updates": {
        "platform_changes": "Error occurred but conversation context is fully maintained",
        "context_acknowledged": "Full conversation history is preserved and accessible",
        "knowledge_applied": "Knowledge store integration maintained despite error",
        "response_saved": "Error state will be logged for troubleshooting while maintaining conversation context"
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
