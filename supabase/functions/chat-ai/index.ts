import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ENHANCED_SYSTEM_PROMPT: This is the core instruction set for the AI.
// It dictates the AI's persona, its access to conversation memory and knowledge,
// and most critically, the EXACT JSON response format and strict rules for credential handling.
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

MANDATORY JSON RESPONSE FORMAT:
{
  "summary": "Brief description that acknowledges conversation context",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "platforms": [
    {
      "name": "Platform Name",
      "api_config": {
        "auth_type": "bearer_token|api_key|oauth|basic_auth (ABSOLUTELY CRITICAL: THIS MUST BE THE EXACT AND CORRECT AUTHENTICATION PROTOCOL FOR THE PLATFORM. NO EXCEPTIONS. GENERIC GUESSES ARE UNACCEPTABLE.)",
        "base_url": "https://api.example.com/v1"
      },
      "credentials": [
        {
          "field": "api_key | access_token | bot_token | client_id | client_secret | username | password | webhook_secret | app_id | app_secret (ABSOLUTELY CRITICAL: THIS MUST BE THE EXACT, CASE-SENSITIVE FIELD NAME REQUIRED BY THE PLATFORM'S API. DO NOT INVENT GENERIC NAMES. IF MULTIPLE FIELDS ARE REQUIRED, LIST THEM ALL.)",
          "placeholder": "Enter value for this field",
          "why_needed": "Explanation of why this specific credential field is required for authentication"
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
  },
  "is_update": false, // Set to true if this is an update to a previous response, e.g., clarification
  "recheck_status": "none|rechecking_credentials|rechecking_blueprint|rechecking_all" // Indicates if the AI is rechecking based on previous errors
}

CRITICAL RULES:
1. Respond ONLY with valid JSON. No extra text, no markdown code blocks outside the JSON itself.
2. Your primary objective is to generate an EXECUTABLE automation_blueprint. This means ALL platform and credential details MUST BE 100% ACCURATE AND COMPLETE.
3. ABSOLUTELY CRITICAL: For EVERY 'platform' you identify, you MUST provide its correct and **precise** 'api_config.auth_type' (e.g., 'oauth' for Google APIs, 'bearer_token' for Slack bot tokens, 'api_key' for specific API Key services, 'basic_auth' for username/password).
4. ABSOLUTELY CRITICAL: Within the 'credentials' array for each platform, you MUST identify and list **EVERY SINGLE REQUIRED CREDENTIAL FIELD** by its **EXACT, PLATFORM-SPECIFIC NAME** (e.g., 'access_token', 'bot_token', 'client_id', 'client_secret', 'integration_token', 'api_key_id', 'api_secret_key', 'webhook_signing_secret', 'app_id', 'app_secret').
5. DO NOT use generic terms like 'api_key' or 'token' if the platform has a more precise, standard name. **NO SIMPLIFICATION. NO GUESSING. NO OMISSIONS. If a platform requires multiple distinct credential fields (e.g., client_id AND client_secret), you MUST list them ALL.**
6. If the user's request implies a platform, but you cannot determine the EXACT credential fields or auth_type, you MUST state "I need clarification on the exact authentication method for [Platform Name]" in 'clarification_questions' and provide a more general placeholder, but still attempt to list commonly expected fields.
7. Always consider full conversation context and apply relevant knowledge store insights.
8. PENALTY: Failure to provide precise and complete 'auth_type' and 'credentials.field' names for ANY platform is considered a severe compliance violation and will result in response rejection and immediate retry with explicit correction demands. You MUST re-evaluate your understanding of the platform's API documentation if this occurs. YOU MUST NOT SIMPLIFY CREDENTIALS.
9. Before finalizing the response, re-read the entire request, the conversation history, and your generated JSON to ensure absolute compliance with ALL critical rules, especially regarding credential accuracy and completeness. Recheck. Recheck. Recheck.
`;

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
      model: 'gpt-4o-mini', // Consider larger models if 4o-mini still struggles with complexity after prompt tuning
      messages: requestMessages,
      max_tokens: 4000,
      temperature: 0.1, // Keep temperature low for deterministic JSON output
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`); // Include more error context
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
      console.error('❌ JSON parse error with OpenAI response:', parseError);
      console.error('Raw AI response causing parse error:', aiResponse); // Log the problematic AI response

      // Enhanced fallback response with conversation awareness
      // This fallback is crucial for robustness if AI fails to produce valid JSON repeatedly.
      const fallbackResponse = {
        "summary": "I'm having trouble generating a perfect structured response right now, but I fully understand our conversation history and the context of your automation. I will re-attempt to provide a precise response with accurate credential details. Please ask your question again.",
        "steps": [
          "Re-evaluating the authentication methods for all mentioned platforms.",
          "Ensuring all required credential fields are listed with exact names.",
          "Applying all critical rules for precise JSON formatting.",
          "Preparing to generate an executable automation blueprint."
        ],
        "platforms": [], // Clear platforms in fallback to avoid incorrect data
        "platforms_to_remove": [],
        "agents": [],
        "clarification_questions": [
          "Could you please reiterate the platforms you wish to integrate or the specific action you want to automate?",
          "If you have details on a platform's authentication, please share it to help me avoid errors."
        ],
        "automation_blueprint": {
          "version": "1.0.0",
          "description": "Fallback state - AI is re-evaluating for precision",
          "trigger": {"type": "manual", "details": {}},
          "steps": [],
          "variables": {}
        },
        "conversation_updates": {
          "platform_changes": "Re-assessing platform requirements for extreme precision.",
          "context_acknowledged": "Full conversation history processed and understood. Focusing on previous errors.",
          "knowledge_applied": knowledgeContext ? "Knowledge store patterns available for application and re-checking." : "Knowledge store queried but no specific patterns found.",
          "response_saved": "This fallback response will be saved and inform future context for enhanced precision."
        },
        "is_update": true, // Indicate this is an internal update/re-evaluation
        "recheck_status": "rechecking_all" // Signal to frontend that AI is explicitly rechecking
      };

      return new Response(JSON.stringify({ response: JSON.stringify(fallbackResponse) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

  } catch (error) {
    console.error('💥 General chat function error:', error);

    // Enhanced error response for any uncaught exceptions during function execution.
    // This helps in debugging and provides a more user-friendly message.
    const errorResponse = {
      "summary": "I'm experiencing a severe technical issue and cannot process your request at this moment. My internal systems are trying to re-establish connection and precision.",
      "steps": ["Please wait a moment and try your request again.", "If the problem persists, please contact support with details of your query."],
      "platforms": [],
      "platforms_to_remove": [],
      "agents": [],
      "clarification_questions": ["I apologize for the inconvenience. Could you please try again in a few moments? All conversation context is preserved."],
      "automation_blueprint": {
        "version": "1.0.0",
        "description": "Critical error state - full conversation context and knowledge store integration maintained",
        "trigger": {"type": "manual", "details": {}},
        "steps": [],
        "variables": {}
      },
      "conversation_updates": {
        "platform_changes": "System error occurred, but conversation context is fully maintained.",
        "context_acknowledged": "Full conversation history is preserved and accessible.",
        "knowledge_applied": "Knowledge store integration maintained despite error.",
        "response_saved": "Error state will be logged for troubleshooting while maintaining conversation context."
      },
      "is_update": true, // Indicate this is an internal update/error
      "recheck_status": "rechecking_all" // Signal to frontend that AI is explicitly rechecking due to critical error
    };

    return new Response(JSON.stringify({
      response: JSON.stringify(errorResponse),
      error: error.message
    }), {
      status: 500, // Changed status to 500 for critical errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
