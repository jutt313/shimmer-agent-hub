
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

    // Enhanced system prompt
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect with access to universal knowledge store.

CRITICAL PLATFORM KNOWLEDGE INTEGRATION RULES:
1. You MUST use your core platform knowledge for all recommendations.
2. You have access to a separate UNIVERSAL KNOWLEDGE STORE for additional details.
3. You MUST identify and include ALL necessary credential requirements for every platform interaction.
4. MAKE SURE YOU ASK ALL THE CREDENTIALS ABOUT THAT PLATFORM TO PERFORM THAT TASK - do not simplify credential requirements.
5. You MUST reference specific platform capabilities and use cases.
6. You MUST prioritize platforms with comprehensive knowledge.

UNIVERSAL KNOWLEDGE STORE ACCESS:
${universalKnowledgeMemory}

MANDATORY RESPONSE REQUIREMENTS:

You MUST provide detailed automation information including:
- **Comprehensive Platform Setup & Credential Information:** For EVERY platform used, provide its name and ALL necessary credentials. Do not simplify - ask for all credentials needed to perform the task.
- **Specific Platform Capabilities and Use Cases.**
- **Proper API Configuration Details.**
- **Real Implementation Examples where applicable.**
- **All Necessary Dynamic Parameters.**

CRITICAL CLARIFICATION QUESTION BEHAVIOR:
- If the clarification_questions array is NOT empty, you MUST ONLY return the clarification_questions array and set recheck_status to "awaiting_clarification_response". In this case, DO NOT return summary, steps, platforms, agents, or automation_blueprint.
- ONLY once all clarification questions have been answered in subsequent turns, should you then return the full step-by-step summary, platforms, agents, and automation blueprint.
- Questions about static setup identifiers should NEVER be in clarification_questions but MUST be in the platforms array as credentials.

CRITICAL THINKING PROCESS - FOLLOW EXACTLY:

1. **DEEP AUTOMATION BREAKDOWN & ATOMIC STEPS:**
   - Deeply analyze the user's request.
   - Break down the entire automation into granular, atomic logical steps.

2. **COMPREHENSIVE PLATFORM & SETUP IDENTIFICATION:**
   - Identify all platforms/services required.
   - For each platform, list ALL necessary setup parameters and credentials.
   - MAKE SURE YOU ASK ALL THE CREDENTIALS ABOUT THAT PLATFORM TO PERFORM THAT TASK.
   - Populate the platforms array with complete details.

3. **DYNAMIC RUNTIME PARAMETER IDENTIFICATION:**
   - Identify truly dynamic runtime parameters that require user input.
   - Formulate precise clarification questions for missing parameters.

4. **PLATFORM SELECTION LOGIC:**
   - Prioritize platforms with comprehensive setup information.
   - Use universal knowledge store for platform recommendations.

MANDATORY JSON STRUCTURE - EXACTLY THIS FORMAT:

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
          "why_needed": "Explanation of why this credential is needed."
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
    "variables": {
      "platform_configs": "object with platform-specific settings",
      "credential_mappings": "object mapping credentials to platforms",
      "universal_knowledge_references": "array of knowledge base entries used"
    },
    "steps": [
      {
        "id": "granular_step_1",
        "name": "Detailed Step Name",
        "type": "action|trigger|condition|ai_agent|loop|delay|retry|fallback",
        "action": {
          "integration": "platform_name",
          "method": "specific_api_method",
          "parameters": {
            "input_data": "mapped_from_previous_step"
          },
          "platform_credential_id": "credential_reference"
        }
      }
    ],
    "error_handling": {
      "retry_attempts": 3,
      "platform_specific_fallbacks": "from knowledge base"
    }
  },
  "conversation_updates": {
    "knowledge_applied": "Universal knowledge entries used",
    "platform_count": "number of platforms referenced",
    "credential_fields_count": "total credential fields included",
    "universal_knowledge_entries_used": "list of knowledge entries referenced"
  },
  "is_update": false,
  "recheck_status": "parameters_clarification_needed"
}

CRITICAL SUCCESS METRICS:
- MUST identify ALL platforms and their complete credential requirements.
- MUST provide granular, atomic steps.
- MUST ask for ALL credentials needed to perform platform tasks.
- MUST never simplify credential requirements.
- MUST use universal knowledge store as separate memory.

Universal Knowledge Context: ${universalKnowledgeMemory}
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

    console.log('📡 Making OpenAI request with universal knowledge integration...')

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
        max_tokens: 4000,
        temperature: 0.3,
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

    console.log('✅ Received OpenAI response with universal knowledge integration')

    // Validate and parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON validation successful')

      // Handle clarification-only responses
      if (parsedResponse.clarification_questions && parsedResponse.clarification_questions.length > 0) {
        console.log('Detected clarification questions. Returning only clarification_questions and recheck_status.')
        const clarificationOnlyResponse = {
          clarification_questions: parsedResponse.clarification_questions,
          recheck_status: "awaiting_clarification_response"
        };
        return new Response(JSON.stringify(clarificationOnlyResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Log universal knowledge integration metrics
      console.log('📊 Universal Knowledge Integration Metrics:', {
        platformsReferenced: parsedResponse.platforms?.length || 0,
        universalKnowledgeEntriesUsed: universalKnowledge?.length || 0,
        credentialFieldsIncluded: parsedResponse.platforms?.reduce((acc: number, p: any) => acc + (p.credentials?.length || 0), 0) || 0
      });
      
      // Structure response with universal knowledge integration
      const structuredResponse = {
        summary: parsedResponse.summary || "Automation analysis using universal knowledge store",
        steps: Array.isArray(parsedResponse.steps) ? parsedResponse.steps : [],
        platforms: Array.isArray(parsedResponse.platforms) ? parsedResponse.platforms.map(platform => ({
          name: platform.name || 'Unknown Platform',
          credentials: Array.isArray(platform.credentials) ? platform.credentials.map(cred => ({
            field: cred.field || 'api_key',
            placeholder: cred.placeholder || 'Enter credential value',
            link: cred.link || '#',
            why_needed: cred.why_needed || 'Required for platform integration'
          })) : []
        })) : [],
        platforms_to_remove: Array.isArray(parsedResponse.platforms_to_remove) ? parsedResponse.platforms_to_remove : [],
        agents: Array.isArray(parsedResponse.agents) ? parsedResponse.agents.map(agent => ({
          name: agent.name || 'AutomationAgent',
          role: agent.role || 'Platform integration specialist with universal knowledge access',
          goal: agent.goal || 'Leverage universal knowledge store to build perfect automations',
          rules: agent.rules || 'Use complete credential requirements and reference universal knowledge store',
          memory: agent.memory || 'Universal knowledge store access for platform configurations',
          why_needed: agent.why_needed || 'Essential for utilizing universal knowledge store effectively'
        })) : [],
        clarification_questions: Array.isArray(parsedResponse.clarification_questions) ? parsedResponse.clarification_questions : [],
        automation_blueprint: parsedResponse.automation_blueprint || {
          version: "1.0.0",
          description: "Universal knowledge integrated automation workflow",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          ...parsedResponse.conversation_updates,
          universal_knowledge_applied: `Applied ${universalKnowledge?.length || 0} universal knowledge entries`,
          context_acknowledged: "Universal knowledge store successfully accessed",
          response_saved: "Universal knowledge enhanced response ready"
        },
        is_update: Boolean(parsedResponse.is_update),
        recheck_status: parsedResponse.recheck_status || "universal_knowledge_integration_complete"
      }

      console.log('🎯 Returning structured response with universal knowledge integration')
      
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

    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Raw response:', aiResponse)
      
      const fallbackResponse = {
        summary: "I'm having trouble generating a structured response, but I have access to universal knowledge store. Please rephrase your request.",
        steps: [
          "Step 1: Rephrase your automation request with specific platform preferences",
          "Step 2: I'll use universal knowledge store to suggest exact platforms and credentials",
          "Step 3: Choose from platforms available in the knowledge store",
          "Step 4: I'll provide complete credential requirements from universal knowledge"
        ],
        platforms: [],
        platforms_to_remove: [],
        agents: [{
          name: "UniversalKnowledgeAgent",
          role: "Universal knowledge store specialist",
          goal: "Leverage universal knowledge store to build perfect automations",
          rules: "Use complete credential requirements from universal knowledge store",
          memory: `Universal knowledge store available: ${universalKnowledge?.length || 0} entries`,
          why_needed: "Essential for utilizing universal knowledge store effectively"
        }],
        clarification_questions: [
          "Which platforms from the universal knowledge store would you like to integrate?",
          "Should I use the stored credential configurations for your preferred platforms?"
        ],
        automation_blueprint: {
          version: "1.0.0",
          description: "Universal knowledge powered automation design",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          universal_knowledge_applied: `${universalKnowledge?.length || 0} universal knowledge entries accessible`,
          context_acknowledged: "Universal knowledge store available for integration",
          response_saved: "Fallback response with universal knowledge access"
        },
        is_update: false,
        recheck_status: "parsing_error_with_universal_knowledge_access"
      }

      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    const errorResponse = {
      summary: "I encountered an error while processing your request, but I have access to universal knowledge store. Please try again.",
      steps: [
        "Step 1: Try rephrasing your automation request",
        "Step 2: Specify platforms you want to use from universal knowledge store",
        "Step 3: I'll provide complete credential requirements from stored knowledge",
        "Step 4: Contact support if the error persists"
      ],
      platforms: [],
      platforms_to_remove: [],
      agents: [{
        name: "ErrorRecoveryAgentWithUniversalKnowledge",
        role: "Error handling specialist with universal knowledge store access",
        goal: "Recover from errors while maintaining access to universal knowledge",
        rules: "Provide helpful error messages and leverage universal knowledge store",
        memory: "Universal knowledge store remains accessible for automation building",
        why_needed: "Essential for maintaining system reliability with universal knowledge integration"
      }],
      clarification_questions: [
        "Could you please rephrase your automation request?",
        "Which platforms from the universal knowledge store would you like to use?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow with universal knowledge",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      },
      conversation_updates: {
        universal_knowledge_applied: "Universal knowledge store ready for next request",
        context_acknowledged: "Error occurred during processing, universal knowledge still available",
        response_saved: "Error response with universal knowledge integration capability"
      },
      is_update: false,
      recheck_status: "error_with_universal_knowledge_access"
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
