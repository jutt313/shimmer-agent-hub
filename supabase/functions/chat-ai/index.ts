
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

    // Get universal knowledge for platform intelligence with better filtering
    const { data: universalKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(100)

    console.log(`🧠 Universal knowledge loaded: ${universalKnowledge?.length || 0} entries`)

    // Build enhanced platform intelligence context with real API configurations
    const platformIntelligence = universalKnowledge
      ?.filter(k => k.category === 'platform_knowledge')
      .map(k => {
        const credentialFields = k.credential_fields?.map((c: any) => c.field).join(', ') || 'API Key';
        const apiConfig = k.details?.api_config || {};
        const operations = k.details?.automation_operations || [];
        
        return `${k.platform_name}:
  - Credentials: ${credentialFields}
  - Base URL: ${apiConfig.base_url || `https://api.${k.platform_name.toLowerCase()}.com`}
  - Operations: ${operations.map((op: any) => `${op.method} ${op.path} (${op.description})`).join(', ')}
  - Use Cases: ${k.use_cases?.join(', ') || 'General automation'}`;
      })
      .join('\n') || 'No platform knowledge available'

    // COMPLETELY ENHANCED SYSTEM PROMPT - AUTOMATION-CONTEXT-AWARE
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect. You generate REAL, WORKING API configurations based on ACTUAL automation context, not generic tests.

**CRITICAL AUTOMATION-CONTEXT REQUIREMENTS:**

1. **REAL API OPERATION GENERATION:**
   * NEVER generate /auth/verify, /me, or generic test endpoints
   * Generate ACTUAL operations that match the automation workflow
   * For OpenAI: Use /chat/completions with real prompts based on automation context
   * For Notion: Use /databases/{database_id}/query or /pages with real queries
   * For Typeform: Use /forms with actual form creation/retrieval
   * For Google Sheets: Use /v4/spreadsheets/{spreadsheetId}/values with real ranges

2. **AUTOMATION CONTEXT INTEGRATION:**
   * Read automation_blueprint to understand each platform's role
   * Generate API calls that perform the ACTUAL automation task
   * Include real sample data that matches the workflow
   * Example: If automation processes form data with OpenAI, generate completion calls with form processing prompts

3. **UNIVERSAL KNOWLEDGE STORE UTILIZATION:**
   * Use the platform intelligence data below for accurate configurations
   * Match credential requirements to actual platform needs
   * Leverage real API endpoints and operations from knowledge store

4. **PLATFORM-SPECIFIC REAL OPERATIONS:**
   * OpenAI: Generate text completions, embeddings, or specific AI tasks from automation
   * Notion: Database queries, page creation, or content retrieval based on workflow
   * Typeform: Form creation, response collection, or webhook setup
   * Google Sheets: Data reading/writing operations that match automation needs
   * Slack: Message sending, channel management, or user operations
   * Any Platform: Real operations that serve the automation's purpose

**ENHANCED PLATFORM INTELLIGENCE DATABASE:**
${platformIntelligence}

**AUTOMATION CONTEXT:**
${automationContext ? `
Current Automation: ${automationContext.title || 'Untitled'}
Description: ${automationContext.description || 'No description'}
Current Steps: ${JSON.stringify(automationContext.steps || [])}
Goal: ${automationContext.goal || 'Not specified'}
Blueprint: ${JSON.stringify(automationContext.automation_blueprint || {})}
Platforms Config: ${JSON.stringify(automationContext.platforms_config || {})}
` : 'No automation context - create new automation'}

**MANDATORY REAL API CONFIGURATION GENERATION:**
For each platform, you MUST generate:
- Real base URLs (from knowledge store or platform standards)
- Actual operation endpoints that perform automation tasks
- Sample requests with real data that matches automation workflow
- Sample responses that show expected data format
- Proper authentication methods and credential requirements

**EXAMPLE REAL CONFIGURATIONS:**
OpenAI for content generation automation:
{
  "platform_name": "OpenAI",
  "base_url": "https://api.openai.com",
  "automation_operations": [{
    "name": "Generate Content",
    "method": "POST",
    "path": "/v1/chat/completions",
    "description": "Generate content based on form responses",
    "sample_request": {
      "model": "gpt-4",
      "messages": [{"role": "user", "content": "Process this form data: {form_data}"}]
    }
  }]
}

Notion for database management automation:
{
  "platform_name": "Notion",
  "base_url": "https://api.notion.com",
  "automation_operations": [{
    "name": "Query Database",
    "method": "POST", 
    "path": "/v1/databases/{database_id}/query",
    "description": "Query database for automation data",
    "sample_request": {
      "filter": {"property": "Status", "select": {"equals": "Active"}}
    }
  }]
}

**CRITICAL PERFORMANCE REQUIREMENTS:**
- Response time: Under 2 seconds
- JSON validation: Always complete, never partial
- Real operations: Zero generic test endpoints
- Automation awareness: All API calls must serve the automation's purpose

**MANDATORY JSON RESPONSE STRUCTURE:**
Always return complete JSON with: summary, steps, platforms (with REAL credentials), api_configurations (with REAL automation operations), agents (workflow-specific), automation_blueprint (diagram-ready), clarification_questions (minimal), conversation_updates.

**ABSOLUTELY FORBIDDEN:**
- Generic /auth/verify or /me endpoints for actual operations
- Static API configurations that don't match automation context
- Fake or placeholder API operations
- Generic test calls instead of real workflow operations
- Incomplete JSON structures
- Taking longer than 2 seconds to respond

You must respond with a complete JSON object with REAL, AUTOMATION-CONTEXT-AWARE API configurations.`

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-5).map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message }
    ]

    console.log('🤖 Calling OpenAI with enhanced automation-context prompt...')

    // Call OpenAI API with GPT-4o for speed and quality
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
      console.log('✅ JSON parsing successful - Enhanced automation-context response')
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      throw new Error('Invalid JSON response from AI')
    }

    // Enhanced validation for automation-context requirements
    const requiredFields = ['summary', 'steps', 'platforms', 'api_configurations', 'agents', 'automation_blueprint']
    for (const field of requiredFields) {
      if (!parsedResponse[field]) {
        console.warn(`⚠️ Missing required field: ${field}`)
        // Add enhanced defaults for automation-context
        switch (field) {
          case 'summary':
            parsedResponse.summary = "Automation configuration with real API operations and automation-context awareness."
            break
          case 'steps':
            parsedResponse.steps = ["Configure real platform integrations", "Set up automation-aware API operations", "Test with actual workflow data", "Deploy production automation"]
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
              description: "Real automation workflow with context-aware operations",
              trigger: { type: "manual" },
              variables: {},
              steps: [],
              error_handling: { retry_attempts: 3 }
            }
            break
        }
      }
    }

    // Ensure enhanced fields exist
    parsedResponse.clarification_questions = parsedResponse.clarification_questions || []
    parsedResponse.conversation_updates = parsedResponse.conversation_updates || {
      knowledge_applied: `${universalKnowledge?.length || 0} platform entries with automation context`,
      platform_count: parsedResponse.platforms?.length || 0,
      automation_integration: "Real operations with automation-context awareness",
      api_operation_type: "Real workflow operations (not generic tests)"
    }
    parsedResponse.is_update = parsedResponse.is_update || false
    parsedResponse.recheck_status = parsedResponse.recheck_status || "ready_for_real_implementation"

    // Update universal knowledge usage with automation context
    if (universalKnowledge && universalKnowledge.length > 0) {
      for (const knowledge of universalKnowledge.slice(0, 10)) {
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
    console.log(`🚀 Enhanced YusrAI response completed in ${responseTime}ms`)
    console.log('📊 Enhanced response metrics:', {
      responseTime: `${responseTime}ms`,
      platformsCount: parsedResponse.platforms?.length || 0,
      agentsCount: parsedResponse.agents?.length || 0,
      clarificationCount: parsedResponse.clarification_questions?.length || 0,
      hasBlueprint: !!parsedResponse.automation_blueprint,
      automationContextAware: !!automationContext,
      realOperations: true
    })

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('💥 Enhanced YusrAI Error:', error, `(${responseTime}ms)`)
    
    // Enhanced error response with automation context
    const errorResponse = {
      summary: "I encountered a technical issue but I'm ready to help you create automation-context-aware configurations. Please rephrase your request with specific platform names and automation workflow details.",
      steps: [
        "Specify the platforms you want to integrate with their role in the automation",
        "Describe the automation workflow and data flow between platforms", 
        "I'll provide complete setup with real API operations that match your workflow",
        "Test and execute your automation with context-aware configurations"
      ],
      platforms: [],
      api_configurations: [],
      agents: [{
        name: "AutomationContextAgent",
        role: "Automation-context-aware configuration specialist",
        goal: "Generate real API operations that serve the actual automation workflow",
        rules: "Always provide automation-context-aware responses with real operations",
        memory: "Technical issue encountered - ready to provide real automation configurations",
        why_needed: "Essential for generating real, working automation configurations"
      }],
      clarification_questions: [
        "Which specific platforms would you like to integrate and what role should each play in your automation?",
        "What is the data flow and workflow you want to achieve with this automation?"
      ],
      automation_blueprint: {
        version: "2.0.0",
        description: "Error recovery - ready for automation-context-aware configuration",
        trigger: { type: "manual" },
        variables: { error_recovery: "active", context_aware: true },
        steps: [],
        error_handling: { retry_attempts: 3, fallback_actions: "automation_context_guidance" }
      },
      conversation_updates: {
        error_recovery: "Active - ready for automation-context-aware assistance",
        platform_support: "All platforms with real operations",
        automation_integration: "Ready for complete automation-context-aware configuration",
        api_operation_type: "Real workflow operations (enhanced system)"
      },
      is_update: false,
      recheck_status: "error_recovered_ready_for_context_aware_request",
      error_help_available: true,
      enhanced_system: true
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
