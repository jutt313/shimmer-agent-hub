
import "https://deno.land/x/xhr@0.1.0/mod.ts"
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
  const startTime = Date.now()
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 YusrAI: Processing automation request...')
    
    const { message, messages = [], automationId, automationContext, requestType, platformName } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📋 Request details:', {
      messageLength: message.length,
      historyCount: messages.length,
      hasAutomationContext: !!automationContext,
      requestType: requestType || 'automation_creation'
    })

    // Get universal knowledge for platform intelligence
    const { data: universalKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(50)

    console.log(`🧠 Universal knowledge loaded: ${universalKnowledge?.length || 0} entries`)

    // Build platform intelligence context
    const platformIntelligence = universalKnowledge
      ?.filter(k => k.category === 'platform_knowledge')
      .map(k => `${k.platform_name}: ${k.credential_fields?.map(c => c.field).join(', ') || 'API Key'}`)
      .join('\n') || 'No platform knowledge available'

    // ENHANCED SYSTEM PROMPT - PRODUCTION READY
    const systemPrompt = `You are YusrAI, the world's most powerful automation architect. Transform user requests into production-ready automations with real, working API calls in under 2 seconds.

**CORE INTELLIGENCE:**

1. **AUTOMATION CONTEXT MASTERY:**
   * Parse user's automation goal, existing steps, and workflow intent
   * Generate REAL API calls for actual operations (OpenAI completions with Gmail content, Typeform form creation, Slack message sending)
   * Show precise data flow between platforms with realistic sample data

2. **UNIVERSAL PLATFORM DETECTION:**
   * Auto-detect correct API base URLs, authentication methods, and required credentials
   * For generic terms ("CRM", "email"), ask ONE specific clarification question
   * Generate working test endpoints and real operation endpoints
   * Never create fake or placeholder API configurations

3. **WORKFLOW-SPECIFIC AI AGENTS:**
   * Create agents tailored to the exact automation (e.g., "EmailSummarizationAgent", "FormDataProcessorAgent")
   * Include automation context in agent memory and rules
   * Avoid generic agent names like "UniversalAutomationArchitect"

4. **DIAGRAM-COMPATIBLE BLUEPRINTS:**
   * Structure automation_blueprint with clear steps, conditions, and flow logic
   * Include proper trigger types, variables, and error handling
   * Ensure compatibility with diagram generator requirements

**PLATFORM INTELLIGENCE DATABASE:**
${platformIntelligence}

**AUTOMATION CONTEXT:**
${automationContext ? `
Current Automation: ${automationContext.title || 'Untitled'}
Description: ${automationContext.description || 'No description'}
Current Steps: ${JSON.stringify(automationContext.steps || [])}
Goal: ${automationContext.goal || 'Not specified'}
` : 'No automation context - create new automation'}

**CRITICAL PERFORMANCE REQUIREMENTS:**
- Response time: Under 2 seconds
- JSON validation: Always complete, never partial
- Platform detection: 100% accuracy for known platforms
- API generation: Real operations only, zero generic tests
- Credential collection: Complete sets, never simplified

**MANDATORY JSON RESPONSE:**
Always return complete JSON with: summary, steps, platforms (with credentials), api_configurations (with real operations), agents (workflow-specific), automation_blueprint (diagram-ready), clarification_questions (minimal), conversation_updates.

**NEVER:**
- Use generic fallback responses
- Generate /auth/test or /me endpoints for actual operations
- Create agents named "UniversalX" or "GeneralY"
- Return incomplete JSON structures
- Take longer than 2 seconds to respond

You must respond with a complete JSON object following this exact structure:
{
  "summary": "Concise automation description with specific platforms and operations",
  "steps": ["Granular workflow steps with specific API operations"],
  "platforms": [{"name": "Specific Platform", "credentials": [{"field": "API Key", "placeholder": "Enter key", "link": "get-key-url", "why_needed": "For automation operation X"}]}],
  "api_configurations": [{"platform_name": "Platform", "base_url": "real-api-url", "automation_operations": [{"name": "Real Operation", "method": "POST", "path": "/real-endpoint", "description": "Actual workflow operation", "sample_request": {}, "sample_response": {}}]}],
  "agents": [{"name": "WorkflowSpecificAgent", "role": "Specific role for this automation", "goal": "Workflow-specific objective", "rules": "Automation-specific rules", "memory": "Relevant context", "why_needed": "Workflow support explanation"}],
  "clarification_questions": [],
  "automation_blueprint": {"version": "2.0.0", "description": "Blueprint description", "trigger": {}, "variables": {}, "steps": [], "error_handling": {}},
  "conversation_updates": {"knowledge_applied": "Applied knowledge", "platform_count": 0, "automation_integration": "Integration status"},
  "is_update": false,
  "recheck_status": "ready_for_implementation"
}`

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-5).map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message }
    ]

    console.log('🤖 Calling OpenAI with GPT-4o for maximum performance...')

    // Call OpenAI API with GPT-4o for speed
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // Using GPT-4o for maximum speed and performance
        messages: openaiMessages,
        max_tokens: 3000,
        temperature: 0.1,
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

    // Parse and validate JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON parsing successful')
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      throw new Error('Invalid JSON response from AI')
    }

    // Validate required fields
    const requiredFields = ['summary', 'steps', 'platforms', 'api_configurations', 'agents', 'automation_blueprint']
    for (const field of requiredFields) {
      if (!parsedResponse[field]) {
        console.warn(`⚠️ Missing required field: ${field}`)
        // Add minimal defaults to prevent breaking
        switch (field) {
          case 'summary':
            parsedResponse.summary = "Automation configuration in progress with universal platform support."
            break
          case 'steps':
            parsedResponse.steps = ["Configure platform integrations", "Set up automation workflow", "Test and deploy"]
            break
          case 'platforms':
            parsedResponse.platforms = []
            break
          case 'api_configurations':
            parsedResponse.api_configurations = []
            break
          case 'agents':
            parsedResponse.agents = []
            break
          case 'automation_blueprint':
            parsedResponse.automation_blueprint = {
              version: "2.0.0",
              description: "Automation workflow",
              trigger: { type: "manual" },
              variables: {},
              steps: [],
              error_handling: { retry_attempts: 3 }
            }
            break
        }
      }
    }

    // Ensure other required fields exist
    parsedResponse.clarification_questions = parsedResponse.clarification_questions || []
    parsedResponse.conversation_updates = parsedResponse.conversation_updates || {
      knowledge_applied: `${universalKnowledge?.length || 0} platform entries`,
      platform_count: parsedResponse.platforms?.length || 0,
      automation_integration: "Ready for implementation"
    }
    parsedResponse.is_update = parsedResponse.is_update || false
    parsedResponse.recheck_status = parsedResponse.recheck_status || "ready_for_implementation"

    // Update universal knowledge usage
    if (universalKnowledge && universalKnowledge.length > 0) {
      for (const knowledge of universalKnowledge.slice(0, 10)) { // Update top 10 only for performance
        await supabase
          .from('universal_knowledge_store')
          .update({ 
            usage_count: (knowledge.usage_count || 0) + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', knowledge.id)
      }
    }

    const responseTime = Date.now() - startTime
    console.log(`🚀 YusrAI response completed in ${responseTime}ms`)
    console.log('📊 Response metrics:', {
      responseTime: `${responseTime}ms`,
      platformsCount: parsedResponse.platforms?.length || 0,
      agentsCount: parsedResponse.agents?.length || 0,
      clarificationCount: parsedResponse.clarification_questions?.length || 0,
      hasBlueprint: !!parsedResponse.automation_blueprint
    })

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('💥 YusrAI Error:', error, `(${responseTime}ms)`)
    
    // Graceful error response - never break the UI
    const errorResponse = {
      summary: "I encountered a technical issue but I'm ready to help you create your automation. Please rephrase your request with specific platform names and I'll provide a complete solution.",
      steps: [
        "Specify the platforms you want to integrate (e.g., Gmail, Slack, HubSpot)",
        "Describe the automation workflow you want to create",
        "I'll provide complete setup instructions with real API configurations",
        "Test and execute your automation with full credential support"
      ],
      platforms: [],
      api_configurations: [],
      agents: [{
        name: "TechnicalSupportAgent",
        role: "Technical issue resolution and automation guidance specialist",
        goal: "Help recover from technical issues and provide complete automation solutions",
        rules: "Always provide helpful responses, ensure user can continue with automation creation",
        memory: "Technical issue encountered - ready to provide full automation assistance",
        why_needed: "Essential for maintaining reliable automation creation experience"
      }],
      clarification_questions: [
        "Which specific platforms would you like to integrate? (e.g., Gmail, Slack, HubSpot, Salesforce)",
        "What outcome are you trying to achieve with this automation?"
      ],
      automation_blueprint: {
        version: "2.0.0",
        description: "Error recovery - ready for automation creation",
        trigger: { type: "manual" },
        variables: { error_recovery: "active" },
        steps: [],
        error_handling: { retry_attempts: 3, fallback_actions: "user_guidance" }
      },
      conversation_updates: {
        error_recovery: "Active - ready for automation assistance",
        platform_support: "All platforms available",
        automation_integration: "Ready for complete automation creation"
      },
      is_update: false,
      recheck_status: "error_recovered_ready_for_request",
      error_help_available: true
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
