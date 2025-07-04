
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
console.log('🔑 OpenAI API Key status:', openaiApiKey ? 'Available' : 'Missing')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🚀 Chat AI function called - Method:', req.method)

  try {
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not found in environment')
      throw new Error('OpenAI API key not configured')
    }

    console.log('📥 Processing chat request...')
    
    const requestBody = await req.json()
    console.log('📋 Request body received:', {
      hasMessage: !!requestBody.message,
      messageLength: requestBody.message?.length || 0,
      messagesCount: requestBody.messages?.length || 0
    })
    
    const { message, messages = [], automationId, automationContext } = requestBody
    
    if (!message) {
      console.error('❌ No message provided in request')
      throw new Error('Message is required')
    }

    console.log('🔍 Searching for platform knowledge...')

    // Get platform knowledge from universal store
    const { data: platformKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .eq('category', 'platform_knowledge')
      .order('usage_count', { ascending: false })
      .limit(20);

    console.log('📚 Platform knowledge found:', platformKnowledge?.length || 0)

    // Build knowledge context
    let knowledgeContext = '';
    if (platformKnowledge && platformKnowledge.length > 0) {
      const platformData = platformKnowledge
        .map(k => {
          const credentialFields = k.credential_fields || [];
          return `
🔧 PLATFORM: ${k.platform_name || k.title}
📋 CREDENTIALS: ${credentialFields.map(c => `${c.field} (${c.type || 'string'})`).join(', ')}
📝 DESCRIPTION: ${k.platform_description || k.summary}
`;
        }).join('\n');

      knowledgeContext = `
AVAILABLE PLATFORM KNOWLEDGE:
${platformData}
`;
    }

    // Simple, focused system prompt
    const systemPrompt = `You are YusrAI, an advanced automation architect. Create practical automation workflows.

${knowledgeContext}

RESPONSE FORMAT - Return valid JSON only:
{
  "summary": "Brief description of the automation",
  "steps": ["Step 1: ...", "Step 2: ..."],
  "platforms": [
    {
      "name": "Platform Name",
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "Enter your API key",
          "link": "#",
          "why_needed": "Required for platform integration"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "AgentName",
      "role": "Agent role",
      "goal": "Agent goal",
      "rules": "Agent rules",
      "memory": "Agent memory",
      "why_needed": "Why this agent is needed"
    }
  ],
  "clarification_questions": ["Question 1?", "Question 2?"],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Automation description",
    "trigger": {
      "type": "manual"
    },
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

Context: ${JSON.stringify(messages.slice(-2))}`

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message }
    ]

    console.log('📡 Making OpenAI API request...')
    console.log('🔢 Total messages for OpenAI:', openaiMessages.length)

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    })

    console.log('📊 OpenAI Response status:', openaiResponse.status)

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    console.log('✅ OpenAI response received successfully')
    
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      console.error('❌ No response content from OpenAI')
      throw new Error('No response from OpenAI')
    }

    console.log('🔍 Parsing OpenAI response...')

    // Parse and validate JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON parsing successful')
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Raw response:', aiResponse.substring(0, 500))
      
      // Fallback response
      parsedResponse = {
        summary: "I'm processing your automation request. Let me help you create a workflow.",
        steps: [
          "Step 1: Define your automation trigger",
          "Step 2: Set up the required platforms",
          "Step 3: Configure the automation actions",
          "Step 4: Test and deploy your automation"
        ],
        platforms: [],
        agents: [],
        clarification_questions: ["What specific trigger would you like for this automation?"],
        automation_blueprint: {
          version: "1.0.0",
          description: "Custom automation workflow",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        }
      }
    }

    // Ensure all required fields exist
    const structuredResponse = {
      summary: parsedResponse.summary || "Automation workflow created",
      steps: Array.isArray(parsedResponse.steps) ? parsedResponse.steps : [],
      platforms: Array.isArray(parsedResponse.platforms) ? parsedResponse.platforms : [],
      agents: Array.isArray(parsedResponse.agents) ? parsedResponse.agents : [],
      clarification_questions: Array.isArray(parsedResponse.clarification_questions) ? parsedResponse.clarification_questions : [],
      automation_blueprint: parsedResponse.automation_blueprint || {
        version: "1.0.0",
        description: "Automation workflow",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      }
    }

    console.log('🎯 Returning structured response')
    
    return new Response(JSON.stringify(structuredResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    const errorResponse = {
      summary: "I apologize, but I'm having trouble processing your request right now. Let me help you create a basic automation workflow.",
      steps: [
        "Step 1: Specify what you want to automate",
        "Step 2: Choose the platforms you want to connect",
        "Step 3: Define the trigger for your automation",
        "Step 4: Set up the actions you want to perform"
      ],
      platforms: [],
      agents: [],
      clarification_questions: [
        "What specific task would you like to automate?",
        "Which platforms or services do you want to connect?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Basic automation workflow",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
