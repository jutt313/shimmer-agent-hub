
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
    console.log('🔄 Processing chat request with universal knowledge integration')
    
    const { message, messages = [], automationId, automationContext } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📚 Conversation history length:', messages.length)
    console.log('🔧 Automation context:', automationId)

    // Get universal knowledge as separate memory
    console.log('🔍 Accessing universal knowledge store...')
    
    const { data: universalKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(100);

    console.log(`📊 Universal knowledge entries retrieved: ${universalKnowledge?.length || 0}`);

    // Build universal knowledge context as separate memory
    let universalKnowledgeMemory = '';
    if (universalKnowledge && universalKnowledge.length > 0) {
      const platformData = universalKnowledge
        .filter(k => k.category === 'platform_knowledge')
        .map(k => {
          const credentialFields = k.credential_fields || [];
          return `
🔧 PLATFORM: ${k.platform_name || k.title}
📋 CREDENTIALS: ${credentialFields.map(c => `${c.field} (${c.type || 'string'})`).join(', ')}
📝 DESCRIPTION: ${k.platform_description || k.summary}
💡 USE CASES: ${(k.use_cases || []).join(', ')}
⚙️ INTEGRATION: ${k.details?.integration_type || 'API'}
`;
        }).join('\n');

      const generalKnowledge = universalKnowledge
        .filter(k => k.category !== 'platform_knowledge')
        .map(k => `- ${k.title}: ${k.summary}\n  Solution: ${k.details?.solution || 'No solution recorded'}`)
        .join('\n');

      universalKnowledgeMemory = `
UNIVERSAL KNOWLEDGE STORE (SEPARATE MEMORY):
This is your separate memory containing platform knowledge and solutions. Reference this when needed.

PLATFORM KNOWLEDGE:
${platformData}

GENERAL KNOWLEDGE:
${generalKnowledge}
`;
    }

    console.log('📖 Universal knowledge memory length:', universalKnowledgeMemory.length);

    // Your exact system prompt
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect with access to a universal knowledge store.

Critical Platform Knowledge Integration Rules:

You must deeply analyze the user's automation request to infer ALL necessary platforms.

You must use your core platform knowledge and the Universal Knowledge Store to identify and include ALL necessary credential requirements for every platform interaction.

For ANY identified platform, even if its specific credentials are not fully detailed in the Universal Knowledge Store, you must still provide common credential types (e.g., 'API Key', 'OAuth Token', 'Username/Password', 'Access Token', 'Service Account Key', 'URL', 'Endpoint') as placeholders.

NEVER SIMPLIFY CREDENTIALS REQUIREMENT - ALWAYS ASK FOR ALL POTENTIALLY NEEDED CREDENTIALS FOR EACH PLATFORM INTERACTION.

MANDATORY PROVIDE COMPLETE SETUP INFORMATION FOR EVERY PLATFORM.

You must reference specific platform capabilities and use cases when recommending or describing their use.

You must prioritize platforms with comprehensive knowledge, but do not omit crucial ones for the automation.

MANDATORY CRITICAL RETURN PROPER JSON STRUCTURE EVEN FOR SIMPLE REQUEST.

Universal Knowledge Store Access:
${universalKnowledgeMemory}

Mandatory Response Requirements:

You must provide detailed automation information including:

Comprehensive Platform Setup & Credential Information: For EVERY platform used, provide its name and ALL necessary credentials. NEVER SIMPLIFY - ask for all credentials needed to perform the task.

Specific Platform Capabilities and Use Cases.

Proper API Configuration Details.

Real Implementation Examples where applicable.

All Necessary Dynamic Parameters.

Critical Clarification Question Behavior:

If the clarification_questions array is NOT empty, you MUST ONLY return the clarification_questions array and set recheck_status to "awaiting_clarification_response". In this case, DO NOT return summary, steps, platforms, agents, or automation_blueprint.

ONLY once all clarification questions have been answered in subsequent turns, should you then return the full step-by-step summary, platforms, agents, and automation blueprint.

Questions about static setup identifiers should NEVER be in clarification_questions but MUST be in the platforms array as credentials.

Critical Thinking Process - Follow Exactly:

DEEP AUTOMATION BREAKDOWN & ATOMIC STEPS:

Deeply analyze the user's request.

Break down the entire automation into granular, atomic logical steps.

COMPREHENSIVE PLATFORM & SETUP IDENTIFICATION:

Identify ALL platforms/services explicitly requested or implicitly required by the user's automation goal.

For each identified platform, list ALL necessary setup parameters and credentials.

If specific credential fields are not available in the UNIVERSAL KNOWLEDGE STORE, infer and provide common types (e.g., 'API Key', 'OAuth Client ID/Secret', 'Access Token', 'Service Account Key', 'Username', 'Password', 'URL', 'Endpoint').

NEVER SIMPLIFY CREDENTIALS REQUIREMENT - ALWAYS ASK FOR ALL POTENTIALLY NEEDED CREDENTIALS FOR EACH PLATFORM.

Populate the platforms array with complete and detailed credential information.

DYNAMIC RUNTIME PARAMETER IDENTIFICATION:

Identify truly dynamic runtime parameters that require user input.

Formulate precise clarification questions for missing parameters.

PLATFORM SELECTION LOGIC:

Prioritize platforms with comprehensive setup information.

Use universal knowledge store for platform recommendations.

Mandatory JSON Structure - Exactly This Format:

{
  "summary": "Comprehensive 3-4 line description outlining the automation, referencing identified platforms.",
  "steps": [
    "Step 1: [GRANULAR_ATOMIC_ACTION] using [PLATFORM/SERVICE]",
    "Step 2: [GRANULAR_ATOMIC_ACTION]",
    "Step 3: [GRANULAR_ATOMIC_ACTION]",
    "Step 4: [GRANULAR_ATOMIC_ACTION]"
  ],
  "platforms": [
    {
      "name": "Platform Name",
      "credentials": [
        {
          "field": "Credential Field Name",
          "placeholder": "Enter credential value",
          "link": "direct_url_to_get_credential",
          "why_needed": "Explanation of why this credential is needed for this platform's functionality."
        }
      ]
    }
  ],
  "platforms_to_remove": [],
  "agents": [
    {
      "name": "SpecificAgentName",
      "role": "Detailed role using platform knowledge",
      "goal": "Specific objective referencing platform capabilities",
      "rules": "Rules incorporating platform-specific constraints",
      "memory": "Initial memory including platform configuration details",
      "why_needed": "Explanation referencing specific platform integration needs"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Automation blueprint reflecting the detailed plan.",
    "trigger": {
      "type": "manual|scheduled|webhook|event",
      "schedule": "cron expression if scheduled",
      "webhook_url": "if webhook trigger"
    },
    "variables": {},
    "steps": [
      {
        "id": "granular_step_1",
        "name": "Detailed Step Name",
        "type": "action|trigger|condition|ai_agent|loop|delay|retry|fallback",
        "action": {
          "integration": "platform_name",
          "method": "specific_api_method",
          "parameters": {}
        }
      }
    ],
    "error_handling": {
      "retry_attempts": 3
    }
  },
  "conversation_updates": {
    "knowledge_applied": "Universal knowledge entries used",
    "platform_count": "number of platforms referenced"
  },
  "is_update": false,
  "recheck_status": "parameters_clarification_needed"
}

Critical Success Metrics:

MUST identify ALL platforms and their complete credential requirements.

MUST provide granular, atomic steps.

NEVER SIMPLIFY CREDENTIALS REQUIREMENT - ASK FOR ALL CREDENTIALS NEEDED FOR PLATFORM TASKS.

MUST use universal knowledge store as separate memory.

MANDATORY CRITICAL RETURN PROPER JSON STRUCTURE EVEN FOR SIMPLE REQUEST.

Context:
Previous conversation: ${JSON.stringify(messages.slice(-3))}
Current automation context: ${JSON.stringify(automationContext)}`

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message }
    ]

    console.log('📡 Making OpenAI request...')

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 4000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      console.error('❌ No response content from OpenAI')
      throw new Error('No response from OpenAI')
    }

    console.log('✅ Received OpenAI response, parsing JSON...')

    // Parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON validation successful')

      // Handle clarification-only responses
      if (parsedResponse.clarification_questions && parsedResponse.clarification_questions.length > 0) {
        console.log('🔍 Detected clarification questions. Returning clarification-only response.')
        const clarificationOnlyResponse = {
          clarification_questions: parsedResponse.clarification_questions,
          recheck_status: "awaiting_clarification_response"
        };
        return new Response(JSON.stringify(clarificationOnlyResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('❌ Raw OpenAI response:', aiResponse)
      
      // Fallback response structure
      const fallbackResponse = {
        summary: "I understand your automation request and I'm processing the platform requirements.",
        steps: [
          "Step 1: Analyze your automation requirements",
          "Step 2: Identify all necessary platforms and their complete credentials",
          "Step 3: Configure platform integrations with full credential sets",
          "Step 4: Build and test the automation workflow"
        ],
        platforms: [],
        platforms_to_remove: [],
        agents: [{
          name: "AutomationAgent",
          role: "Platform integration specialist with universal knowledge access",
          goal: "Create comprehensive automations with complete credential requirements",
          rules: "Always request ALL platform credentials, never simplify requirements",
          memory: `Universal knowledge store available: ${universalKnowledge?.length || 0} entries`,
          why_needed: "Essential for building complete automation solutions"
        }],
        clarification_questions: [
          "Could you please provide more specific details about your automation requirements?",
          "Which platforms would you like to integrate for this automation?"
        ],
        automation_blueprint: {
          version: "1.0.0",
          description: "Comprehensive automation workflow with universal knowledge integration",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          universal_knowledge_applied: `${universalKnowledge?.length || 0} universal knowledge entries available`,
          context_acknowledged: "Processing request with complete credential requirements"
        },
        is_update: false,
        recheck_status: "processing_with_universal_knowledge"
      }

      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Structure response
    const structuredResponse = {
      summary: parsedResponse.summary || "Comprehensive automation analysis with complete platform credential requirements",
      steps: Array.isArray(parsedResponse.steps) ? parsedResponse.steps : [],
      platforms: Array.isArray(parsedResponse.platforms) ? parsedResponse.platforms.map(platform => ({
        name: platform.name || 'Unknown Platform',
        credentials: Array.isArray(platform.credentials) ? platform.credentials.map(cred => ({
          field: cred.field || 'api_key',
          placeholder: cred.placeholder || 'Enter complete credential value',
          link: cred.link || '#',
          why_needed: cred.why_needed || 'Required for complete platform integration - never simplified'
        })) : []
      })) : [],
      platforms_to_remove: Array.isArray(parsedResponse.platforms_to_remove) ? parsedResponse.platforms_to_remove : [],
      agents: Array.isArray(parsedResponse.agents) ? parsedResponse.agents.map(agent => ({
        name: agent.name || 'AutomationAgent',
        role: agent.role || 'Platform integration specialist with complete credential access',
        goal: agent.goal || 'Build comprehensive automations with all required platform credentials',
        rules: agent.rules || 'Always collect ALL platform credentials, never simplify requirements',
        memory: agent.memory || 'Universal knowledge store access with complete credential requirements',
        why_needed: agent.why_needed || 'Essential for comprehensive automation solutions with complete platform setup'
      })) : [],
      clarification_questions: Array.isArray(parsedResponse.clarification_questions) ? parsedResponse.clarification_questions : [],
      automation_blueprint: parsedResponse.automation_blueprint || {
        version: "1.0.0",
        description: "Universal knowledge integrated automation with complete credential requirements",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      },
      conversation_updates: {
        ...parsedResponse.conversation_updates,
        universal_knowledge_applied: `Applied ${universalKnowledge?.length || 0} universal knowledge entries`,
        credential_requirements_enforced: "Complete credential collection enforced, no simplification allowed"
      },
      is_update: Boolean(parsedResponse.is_update),
      recheck_status: parsedResponse.recheck_status || "universal_knowledge_integration_complete"
    }

    console.log('🎯 Returning structured response with enhanced universal knowledge and credential requirements')
    
    // Update universal knowledge usage
    if (universalKnowledge && universalKnowledge.length > 0) {
      console.log(`📈 Updating usage count for ${universalKnowledge.length} universal knowledge entries`);
      for (const knowledge of universalKnowledge) {
        await supabase
          .from('universal_knowledge_store')
          .update({ 
            usage_count: (knowledge.usage_count || 0) + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', knowledge.id);
      }
      console.log('✅ Successfully updated all universal knowledge usage counts');
    }

    return new Response(JSON.stringify(structuredResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    const errorResponse = {
      summary: "I encountered an error while processing your request. Let me help you create your automation with complete platform credentials.",
      steps: [
        "Step 1: Rephrase your automation request with specific platform preferences",
        "Step 2: I'll identify all required platforms with complete credential requirements",
        "Step 3: Provide comprehensive setup information for each platform",
        "Step 4: Build your automation with all necessary platform integrations"
      ],
      platforms: [],
      platforms_to_remove: [],
      agents: [{
        name: "ErrorRecoveryAgentWithCompleteCredentials",
        role: "Error handling specialist with comprehensive credential collection",
        goal: "Recover from errors while ensuring complete platform credential requirements",
        rules: "Always collect ALL platform credentials, provide helpful error messages, never simplify requirements",
        memory: "Universal knowledge store accessible for comprehensive automation building",
        why_needed: "Essential for maintaining reliability with complete platform credential collection"
      }],
      clarification_questions: [
        "Could you please rephrase your automation request?",
        "Which specific platforms would you like to integrate with complete credential setup?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow with comprehensive credential requirements",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      },
      conversation_updates: {
        universal_knowledge_applied: "Universal knowledge store ready for comprehensive automation building",
        credential_requirements_enforced: "Complete credential collection ready for next request"
      },
      is_update: false,
      recheck_status: "error_recovery_with_complete_credentials"
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
