
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get OpenAI API key
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
if (!openaiApiKey) {
  console.error('❌ OpenAI API key not found')
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Processing chat request with full context')
    
    const { message, messages = [], automationId, automationContext } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📚 Conversation history length:', messages.length)
    console.log('🔧 Automation context:', automationId)

    // Enhanced system prompt with strict JSON formatting and credential structure requirements
    const systemPrompt = `You are YusrAI, an advanced automation assistant. You help users create, modify, and understand automation workflows.

CRITICAL JSON FORMAT REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- NO text before or after the JSON object
- NO markdown formatting, code blocks, or explanations outside JSON
- Use double quotes for all strings
- Escape special characters properly in strings
- Validate your JSON before responding

CRITICAL PLATFORM CREDENTIALS STRUCTURE:
When providing platforms with credentials, you MUST use this exact structure:
{
  "platforms": [
    {
      "name": "Platform Name",
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "Enter your Platform API key",
          "link": "https://platform.com/api-keys",
          "why_needed": "Required to authenticate API requests to Platform"
        }
      ]
    }
  ]
}

ENSURE EVERY CREDENTIAL OBJECT HAS ALL FOUR FIELDS:
- field: string (required, non-empty)
- placeholder: string (required, non-empty)  
- link: string (required, valid URL)
- why_needed: string (required, non-empty explanation)

Required JSON structure:
{
  "summary": "Brief summary of what you're doing",
  "steps": ["Step 1", "Step 2", ...],
  "platforms": [{"name": "Platform Name", "credentials": [...]}],
  "platforms_to_remove": ["platform1", "platform2"],
  "agents": [{"name": "Agent Name", "role": "Role", "goal": "Goal", "why_needed": "Explanation"}],
  "clarification_questions": ["Question 1", "Question 2"],
  "automation_blueprint": {...},
  "conversation_updates": {
    "platform_changes": "Description of changes",
    "context_acknowledged": "How you're using conversation context",
    "knowledge_applied": "What knowledge you applied",
    "response_saved": "Confirmation that response will be saved"
  },
  "is_update": true/false,
  "recheck_status": "none"
}

Context Awareness:
- You have access to the full conversation history
- Use previous messages to understand context and user intent
- Reference earlier discussions when relevant
- Build upon previous responses and suggestions
- Remember user preferences and choices from earlier messages

Platform Integration:
- Provide complete credential configurations with all required fields
- Include clear explanations for why each credential is needed
- Use proper field names that are intuitive
- Handle error cases appropriately

Current conversation context: ${JSON.stringify(messages.slice(-5))}
Current automation: ${JSON.stringify(automationContext)}
`

    // Prepare messages for OpenAI with full conversation context
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message }
    ]

    console.log('📡 Making OpenAI request with enhanced context:', openaiMessages.length, 'messages...')

    // Call OpenAI API with enhanced context
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: openaiMessages,
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('✅ Received OpenAI response, length:', aiResponse.length)

    // Validate and parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON validation successful')
      
      // Validate platform credentials structure
      if (parsedResponse.platforms && Array.isArray(parsedResponse.platforms)) {
        parsedResponse.platforms.forEach((platform: any, platformIndex: number) => {
          if (platform.credentials && Array.isArray(platform.credentials)) {
            platform.credentials.forEach((cred: any, credIndex: number) => {
              if (!cred.field || typeof cred.field !== 'string' || !cred.field.trim()) {
                console.warn(`Invalid credential field at platform ${platformIndex}, credential ${credIndex}`);
                cred.field = cred.field || 'api_key';
              }
              if (!cred.placeholder || typeof cred.placeholder !== 'string') {
                cred.placeholder = `Enter your ${platform.name || 'Platform'} credential`;
              }
              if (!cred.link || typeof cred.link !== 'string') {
                cred.link = '#';
              }
              if (!cred.why_needed || typeof cred.why_needed !== 'string') {
                cred.why_needed = 'Required for platform integration';
              }
            });
          }
        });
      }
      
    } catch (parseError) {
      console.error('❌ JSON parse error with OpenAI response:', parseError)
      console.error('Raw AI response causing parse error:', aiResponse)
      
      // Fallback response with proper JSON structure
      parsedResponse = {
        summary: "I apologize, but I'm having trouble generating a structured response right now. Please rephrase your question.",
        steps: [],
        platforms: [],
        platforms_to_remove: [],
        agents: [],
        clarification_questions: ["Could you please rephrase your automation request?"],
        automation_blueprint: null,
        conversation_updates: {
          platform_changes: "No changes made due to response error",
          context_acknowledged: "Context received but response generation failed",
          knowledge_applied: "Applied error recovery patterns",
          response_saved: "Error response generated for conversation continuity"
        },
        is_update: false,
        recheck_status: "error"
      }
    }

    // Ensure response has required structure with proper defaults
    const structuredResponse = {
      summary: parsedResponse.summary || "Processing your automation request",
      steps: Array.isArray(parsedResponse.steps) ? parsedResponse.steps : [],
      platforms: Array.isArray(parsedResponse.platforms) ? parsedResponse.platforms : [],
      platforms_to_remove: Array.isArray(parsedResponse.platforms_to_remove) ? parsedResponse.platforms_to_remove : [],
      agents: Array.isArray(parsedResponse.agents) ? parsedResponse.agents : [],
      clarification_questions: Array.isArray(parsedResponse.clarification_questions) ? parsedResponse.clarification_questions : [],
      automation_blueprint: parsedResponse.automation_blueprint || null,
      conversation_updates: parsedResponse.conversation_updates || {
        platform_changes: "No platform changes",
        context_acknowledged: "Context processed successfully",
        knowledge_applied: "Applied automation best practices",
        response_saved: "Response processed and ready for conversation context"
      },
      is_update: Boolean(parsedResponse.is_update),
      recheck_status: parsedResponse.recheck_status || "none"
    }

    console.log('🎯 Returning clean structured response')

    // Return the structured response directly (no double wrapping)
    return new Response(JSON.stringify(structuredResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    // Return a proper error response in the expected format
    const errorResponse = {
      summary: "I encountered an error processing your request. Please try again.",
      steps: [],
      platforms: [],
      platforms_to_remove: [],
      agents: [],
      clarification_questions: ["Could you please try rephrasing your request?"],
      automation_blueprint: null,
      conversation_updates: {
        platform_changes: "No changes due to error",
        context_acknowledged: "Error occurred during processing",
        knowledge_applied: "Applied error handling patterns",
        response_saved: "Error response generated"
      },
      is_update: false,
      recheck_status: "error"
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Return 200 to prevent client-side errors
    })
  }
})
