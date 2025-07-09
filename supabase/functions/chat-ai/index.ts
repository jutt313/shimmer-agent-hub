import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*' as const,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' as const,
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
    console.log('🔄 Processing chat request')
    
    const { message, messages = [], automationId, automationContext } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📚 Processing message:', message.substring(0, 100) + '...')
    console.log('🔧 Messages history length:', messages.length)

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

    console.log('📖 Universal knowledge memory prepared');

    // Enhanced system prompt with platform clarification requirements
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect with access to a universal knowledge store.

CRITICAL PLATFORM CLARIFICATION REQUIREMENT:
When users mention generic terms like "AI", "CRM", "email", "mail", "messaging", "calendar", "social media", or any other general category for a tool, you MUST ask clarification questions *only* to identify the SPECIFIC platform they want to use.

Examples of when to ask clarification for specific platforms:
- User says "CRM" → Ask: "Which CRM platform would you like to use? (e.g., HubSpot, Salesforce, Pipedrive)"
- User says "email" or "mail" → Ask: "Which email platform? (e.g., Gmail, Outlook, SendGrid, Mailchimp)"
- User says "messaging" → Ask: "Which messaging platform? (e.g., Slack, Discord, WhatsApp)"
- User says "calendar" → Ask: "Which calendar platform? (e.g., Google Calendar, Outlook Calendar)"
- User says "AI" → Ask: "Which AI service or platform are you referring to? (e.g., OpenAI, Google AI, Azure AI)"

NEVER assume or suggest multiple platform options in the platforms array if a specific one isn't clear. ALWAYS ask for platform clarification first.
IMPORTANT: The 'clarification_questions' array MUST NEVER contain questions about credentials or specific setup identifiers (e.g., 'sheet name', 'database ID', 'email address', 'Gmail account'). These details MUST be collected exclusively as 'credentials' within the 'platforms' array.

Critical Platform Knowledge Integration Rules:

You must deeply analyze the user's automation request to infer ALL necessary platforms.

You must use your core platform knowledge and the Universal Knowledge Store to identify and include ALL necessary credential requirements for *every* platform interaction. This means asking for *all* relevant credentials for each platform to ensure a complete setup.

For ANY identified platform, even if its specific credentials are not fully detailed in the Universal Knowledge Store, you must still provide *all common credential types* (e.g., 'API Key', 'OAuth Token', 'Username/Password', 'Access Token', 'Service Account Key', 'URL', 'Endpoint', 'Project ID', 'Database ID', 'Sheet Name', 'Private Key', 'Client ID', 'Client Secret') as placeholders. Do not assume a platform only needs one credential if more are typically required.

NEVER SIMPLIFY CREDENTIALS REQUIREMENT - ALWAYS ASK FOR ALL POTENTIALLY NEEDED CREDENTIALS FOR EACH PLATFORM INTERACTION.

MANDATORY PROVIDE COMPLETE SETUP INFORMATION FOR EVERY PLATFORM.

You must reference specific platform capabilities and use cases when recommending or describing their use.

You must prioritize platforms with comprehensive knowledge, but do not omit crucial ones for the automation.

MANDATORY CRITICAL RETURN PROPER JSON STRUCTURE FOR EVERY REQUEST - NEVER RETURN NULL OR EMPTY RESPONSES.

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
Furthermore, if you decide to return clarification_questions, this array MUST contain concrete, actionable questions that *explicitly* ask the user for the specific platform name they want to use when a generic term (like "CRM", "email", "AI") has been used, or for genuinely dynamic runtime parameters. NEVER return an empty or vague clarification question.

ONLY once all clarification questions have been answered in subsequent turns, should you then return the full step-by-step summary, platforms, agents, and automation blueprint.

Questions about static setup identifiers (e.g., 'sheet name', 'database ID', 'email address') should NEVER be in clarification_questions but MUST be in the platforms array as credentials.

Critical Thinking Process - Follow Exactly:

DEEP AUTOMATION BREAKDOWN & ATOMIC STEPS:

Deeply analyze the user's request.

Break down the entire automation into granular, atomic logical steps.

COMPREHENSIVE PLATFORM & SETUP IDENTIFICATION:

Identify ALL platforms/services explicitly requested or implicitly required by the user's automation goal.

For each identified platform, list ALL necessary setup parameters and credentials.

If specific credential fields are not available in the UNIVERSAL KNOWLEDGE STORE, infer and provide *all* common types (e.g., 'API Key', 'OAuth Client ID/Secret', 'Access Token', 'Service Account Key', 'URL', 'Endpoint', 'Project ID', 'Database ID', 'Sheet Name', 'Private Key', 'Client ID', 'Client Secret').

NEVER SIMPLIFY CREDENTIALS REQUIREMENT - ALWAYS ASK FOR ALL POTENTIALLY NEEDED CREDENTIALS FOR EACH PLATFORM.

Populate the platforms array with complete and detailed credential information.

DYNAMIC RUNTIME PARAMETER IDENTIFICATION:

Identify truly dynamic runtime parameters that require user input (e.g., 'What is the subject of the email?', 'To which email address should I send this?').
Formulate precise and direct clarification questions for *only* these truly dynamic runtime parameters, or for ambiguous platform names as described above. Ensure the questions are clear and specific.

PLATFORM SELECTION LOGIC:

Prioritize platforms with comprehensive setup information.

Use universal knowledge store for platform recommendations.

MANDATORY JSON Structure - Exactly This Format - NEVER RETURN NULL:

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

MANDATORY CRITICAL RETURN PROPER JSON STRUCTURE FOR EVERY REQUEST - NEVER RETURN NULL OR EMPTY RESPONSES.

ALWAYS ensure JSON response is complete and valid - never return incomplete or null responses.

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
        temperature: 0.1,
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

    console.log('🔍 Raw OpenAI response:', aiResponse?.substring(0, 200) + '...')

    if (!aiResponse) {
      console.error('❌ No response content from OpenAI')
      throw new Error('No response from OpenAI')
    }

    console.log('✅ Received OpenAI response')

    // Enhanced JSON parsing with multiple fallback strategies
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON validation successful')
      
      // Validate that we have at least a summary
      if (!parsedResponse.summary) {
        console.warn('⚠️ Response missing summary, adding default')
        parsedResponse.summary = "I'm analyzing your automation request and will provide detailed steps."
      }
      
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('❌ Raw OpenAI response:', aiResponse.substring(0, 500))
      
      // Enhanced fallback response with complete structure
      parsedResponse = {
        summary: "I understand your automation request. Let me break this down into actionable steps with the right platforms.",
        steps: [
          "Step 1: Analyze your automation requirements and identify necessary platforms",
          "Step 2: Configure platform integrations with complete credential requirements", 
          "Step 3: Set up data flow and processing logic between platforms",
          "Step 4: Test the automation workflow and handle error scenarios",
          "Step 5: Deploy and monitor the automation for optimal performance"
        ],
        platforms: [{
          name: "Platform Configuration Required",
          credentials: [{
            field: "platform_specific_credential",
            placeholder: "Enter the required credential for your chosen platform",
            link: "#",
            why_needed: "Required for secure platform integration and API access"
          }]
        }],
        platforms_to_remove: [],
        agents: [{
          name: "AutomationArchitect",
          role: "Platform integration specialist with comprehensive automation knowledge",
          goal: "Create seamless automations with complete platform credential management",
          rules: "Always collect ALL required platform credentials, provide clear step-by-step guidance, ensure robust error handling",
          memory: `Universal knowledge store available: ${universalKnowledge?.length || 0} platform entries for comprehensive automation building`,
          why_needed: "Essential for building reliable, production-ready automations with proper platform integrations"
        }],
        clarification_questions: [],
        automation_blueprint: {
          version: "1.0.0",
          description: "Comprehensive automation workflow with universal knowledge integration",
          trigger: { type: "manual" },
          variables: {},
          steps: [{
            id: "platform_setup",
            name: "Platform Configuration Setup",
            type: "action",
            action: {
              integration: "universal_platform_connector",
              method: "configure_credentials",
              parameters: {
                platform_type: "user_specified",
                credential_requirements: "complete_set"
              }
            }
          }],
          error_handling: {
            retry_attempts: 3
          }
        },
        conversation_updates: {
          universal_knowledge_applied: `${universalKnowledge?.length || 0} universal knowledge entries processed`,
          platform_analysis_complete: "Ready for specific platform selection and credential configuration",
          automation_readiness: "Complete automation structure prepared"
        },
        is_update: false,
        recheck_status: "ready_for_platform_specification"
      }
    }

    // Final validation - ensure response is never null or empty
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      console.error('❌ Parsed response is invalid, using emergency fallback')
      parsedResponse = {
        summary: "I'm ready to help you create a comprehensive automation. Please specify the platforms you'd like to integrate.",
        steps: [
          "Step 1: Identify and specify the exact platforms for your automation",
          "Step 2: Configure complete credential sets for each platform",
          "Step 3: Define the automation workflow and data processing steps", 
          "Step 4: Set up error handling and monitoring for reliability"
        ],
        platforms: [],
        agents: [],
        clarification_questions: ["Which specific platforms would you like to integrate for this automation?"],
        automation_blueprint: {
          version: "1.0.0",
          description: "Platform-specific automation ready for configuration",
          trigger: { type: "manual" },
          variables: {},
          steps: []
        },
        conversation_updates: {
          status: "awaiting_platform_specification"
        }
      }
    }

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

    console.log('🎯 Returning validated response with summary:', parsedResponse.summary?.substring(0, 100))
    
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    // Enhanced error response that ensures no null returns
    const errorResponse = {
      summary: "I encountered a technical issue, but I'm ready to help you create your automation. Please rephrase your request and I'll provide a complete solution.",
      steps: [
        "Step 1: Rephrase your automation requirements with specific platform preferences",
        "Step 2: I'll identify all required platforms with complete credential requirements", 
        "Step 3: Provide comprehensive setup information for each platform integration",
        "Step 4: Build your automation with proper error handling and monitoring"
      ],
      platforms: [],
      platforms_to_remove: [],
      agents: [{
        name: "ErrorRecoveryAgent",
        role: "Technical issue resolution specialist with comprehensive automation knowledge",
        goal: "Recover from technical issues while providing complete automation solutions",
        rules: "Always provide helpful responses, collect ALL platform credentials, never return empty responses",
        memory: "Technical issue encountered - ready to provide complete automation assistance",
        why_needed: "Essential for maintaining reliability and providing consistent automation building support"
      }],
      clarification_questions: [
        "Could you please rephrase your automation request with specific platform names?",
        "What specific outcome are you trying to achieve with this automation?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow - ready for complete automation building",
        trigger: { type: "manual" },
        variables: {},
        steps: [],
        error_handling: {
          retry_attempts: 3
        }
      },
      conversation_updates: {
        error_recovery_active: "Technical issue resolved - ready for complete automation assistance",
        platform_support_ready: "All platform integrations available for comprehensive automation building"
      },
      is_update: false,
      recheck_status: "error_recovered_ready_for_complete_request"
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})