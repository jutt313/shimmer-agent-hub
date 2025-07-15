
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
if (!openaiApiKey) {
  console.error('OpenAI API key not found')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing automation-aware chat request')
    
    const { message, messages = [], automationId, automationContext, requestType, platformName } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('Message:', message.substring(0, 100) + '...')
    console.log('Messages history length:', messages.length)
    console.log('Request type:', requestType || 'normal_chat')
    console.log('Automation context available:', !!automationContext)

    // AUTOMATION-AWARE API CONFIGURATION GENERATION
    if (requestType === 'platform_config' || requestType === 'api_config_generation') {
      console.log('Automation-Aware API Configuration Generation Mode')
      console.log('Platform:', platformName || message)
      console.log('Automation Context:', automationContext ? 'Available' : 'Not available')
      
      const targetPlatform = platformName || message;
      
      const automationAwarePrompt = `You are an advanced AI that generates REAL AUTOMATION WORKFLOW API configurations for platform: ${targetPlatform}

AUTOMATION CONTEXT:
${automationContext ? `
CURRENT AUTOMATION WORKFLOW:
- Title: ${automationContext.title || 'Untitled Automation'}
- Description: ${automationContext.description || 'No description'}
- Steps: ${automationContext.steps ? JSON.stringify(automationContext.steps) : 'No steps defined'}
- Goal: ${automationContext.goal || 'Goal not specified'}

CRITICAL RULE: Generate API calls that show REAL automation operations, not generic authentication tests!

AUTOMATION WORKFLOW EXAMPLES:
- If automation is "OpenAI summarize Gmail" → Generate OpenAI completion API call with sample Gmail content
- If automation is "Slack notification from form" → Generate Slack message posting API call with form data
- If automation is "Save to Google Sheets" → Generate Sheets append API call with actual data
- If automation is "Process image with vision AI" → Generate vision API call with sample image data

NEVER generate generic /me or /auth/test endpoints - generate REAL workflow operations!
` : 'No automation context - generate comprehensive platform capabilities with real operation examples.'}

PLATFORM ANALYSIS RULES FOR ${targetPlatform.toUpperCase()}:
1. BASE URL DETECTION: Analyze platform patterns (api.platform.com, platform-api.com)
2. AUTHENTICATION: Detect Bearer tokens, API keys, OAuth patterns
3. REAL OPERATIONS: Generate actual automation workflow operations, not tests
4. SAMPLE DATA: Include realistic sample data that matches the automation workflow

CRITICAL REQUIREMENTS:
- Generate REAL automation workflow API calls based on the automation context
- Show actual operations that will be performed (create, update, send, process)
- Include realistic sample request bodies and expected responses
- Demonstrate data flow between platforms in the automation

Return ONLY this JSON structure with REAL automation workflow data:
{
  "platform_name": "${targetPlatform}",
  "base_url": "DETECTED_REAL_BASE_URL_FOR_${targetPlatform.toUpperCase()}",
  "automation_operations": [
    {
      "name": "REAL_AUTOMATION_OPERATION_NAME",
      "method": "POST|GET|PUT",
      "path": "/REAL_OPERATION_ENDPOINT",
      "description": "What this API call actually does in the automation workflow",
      "sample_request": {
        "url": "COMPLETE_REAL_URL_FOR_AUTOMATION_OPERATION",
        "method": "POST|GET|PUT",
        "headers": {"Authorization": "DETECTED_AUTH_FORMAT"},
        "body": "REAL_AUTOMATION_OPERATION_BODY_WITH_SAMPLE_DATA"
      },
      "sample_response": {
        "success": "REAL_${targetPlatform.toUpperCase()}_SUCCESS_RESPONSE_WITH_DATA",
        "error": "REAL_ERROR_RESPONSE_STRUCTURE"
      }
    }
  ],
  "auth_config": {
    "type": "bearer|api_key|oauth2",
    "location": "header|query",
    "parameter_name": "Authorization|X-API-Key",
    "format": "Bearer {token}|Key {api_key}",
    "field_names": ["DETECTED_CREDENTIAL_FIELD_NAMES"]
  },
  "error_patterns": [
    {"status": 401, "pattern": "unauthorized", "action": "refresh_credentials"},
    {"status": 429, "pattern": "rate.*limit", "action": "retry_with_backoff"}
  ],
  "rate_limits": {
    "requests_per_minute": "ESTIMATED_LIMIT",
    "burst_limit": "ESTIMATED_BURST"
  }
}

Generate WORKING automation-aware configuration for ${targetPlatform} with real workflow operations.`

      const apiConfigResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: "system", content: automationAwarePrompt },
            { role: "user", content: `Generate REAL automation workflow API configuration for ${targetPlatform} with sample operations that match the automation context.` }
          ],
          max_tokens: 2000,
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      })

      if (apiConfigResponse.ok) {
        const apiConfigData = await apiConfigResponse.json()
        const apiConfig = apiConfigData.choices[0]?.message?.content
        
        if (apiConfig) {
          console.log('Automation-aware API configuration generated for', targetPlatform)
          return new Response(apiConfig, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      
      console.warn('API config generation failed, using fallback')
    }

    // Get universal knowledge
    console.log('Accessing universal knowledge store...')
    
    const { data: universalKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(50);

    console.log(`Universal knowledge entries retrieved: ${universalKnowledge?.length || 0}`);

    let universalKnowledgeMemory = '';
    if (universalKnowledge && universalKnowledge.length > 0) {
      const platformData = universalKnowledge
        .filter(k => k.category === 'platform_knowledge')
        .map(k => {
          const credentialFields = k.credential_fields || [];
          return `
PLATFORM: ${k.platform_name || k.title}
CREDENTIALS: ${credentialFields.map(c => `${c.field} (${c.type || 'string'})`).join(', ')}
DESCRIPTION: ${k.platform_description || k.summary}
USE CASES: ${(k.use_cases || []).join(', ')}
`;
        }).join('\n');

      universalKnowledgeMemory = `
UNIVERSAL KNOWLEDGE STORE:
${platformData}
`;
    }

    // SIMPLIFIED AUTOMATION-AWARE SYSTEM PROMPT
    const systemPrompt = `You are YusrAI, an advanced automation architect with automation context awareness.

AUTOMATION CONTEXT INTEGRATION:
${automationContext ? `
CURRENT AUTOMATION WORKFLOW:
- Title: ${automationContext.title || 'Untitled Automation'}
- Description: ${automationContext.description || 'No description provided'}
- Steps: ${automationContext.steps ? JSON.stringify(automationContext.steps, null, 2) : 'No steps defined yet'}
- Goal: ${automationContext.goal || 'Goal not specified'}

AUTOMATION-AWARE API GENERATION RULES:
When generating API configurations, you MUST:
1. Generate API calls that match the automation workflow
2. Show REAL operations that will be performed (not generic tests)
3. Include automation-specific data and parameters
4. Create workflow-relevant examples
5. Show data flow between platforms

EXAMPLE: If automation is "OpenAI summarize Gmail":
- For OpenAI: Generate /v1/chat/completions with sample Gmail content
- For Gmail: Generate message retrieval with actual message structure
- Show how Gmail data flows into OpenAI for summarization

DO NOT generate generic /me or /auth/test calls - generate REAL automation workflow operations!
` : 'No current automation context - generate general platform capabilities with real operation examples.'}

PLATFORM CLARIFICATION REQUIREMENT:
When users mention generic terms like "CRM", "email", "messaging", "calendar", etc., ask for specific platform names.

CREDENTIAL SECURITY RULE:
NEVER ask for sensitive credentials in clarification_questions. These must ONLY be collected in the platforms array.

COMPREHENSIVE CREDENTIAL COLLECTION:
For EVERY platform, provide ALL necessary credentials including API Keys, Client IDs, Database URLs, etc.

Universal Knowledge Store:
${universalKnowledgeMemory}

MANDATORY RESPONSE STRUCTURE:
{
  "summary": "3-4 line description with identified platforms and their roles in the automation",
  "steps": [
    "Step 1: [SPECIFIC_ACTION] using [PLATFORM] with [REAL_OPERATION]",
    "Step 2: [SPECIFIC_ACTION] that processes data from step 1",
    "Step 3: [SPECIFIC_ACTION] using [ANOTHER_PLATFORM] with workflow context"
  ],
  "platforms": [
    {
      "name": "Specific Platform Name",
      "credentials": [
        {
          "field": "API Key",
          "placeholder": "Enter your API key",
          "link": "direct_url_to_get_credential",
          "why_needed": "Required for [SPECIFIC_AUTOMATION_OPERATION]"
        }
      ]
    }
  ],
  "api_configurations": [
    {
      "platform_name": "Specific Platform Name",
      "base_url": "REAL_BASE_URL",
      "auth_config": {
        "type": "bearer",
        "location": "header",
        "parameter_name": "Authorization",
        "format": "Bearer {token}"
      },
      "automation_operations": [
        {
          "name": "REAL_AUTOMATION_OPERATION",
          "method": "POST",
          "path": "/real/operation/endpoint",
          "description": "Real operation for the automation workflow",
          "sample_request": {
            "url": "https://api.platform.com/v1/real/operation",
            "method": "POST",
            "headers": {"Authorization": "Bearer {access_token}"},
            "body": {"automation_data": "real_workflow_sample_data"}
          },
          "sample_response": {
            "success": {"result": "success", "data": "automation_result"},
            "error": {"error": "operation_failed", "message": "Automation operation failed"}
          }
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "AutomationAgent",
      "role": "Automation specialist with platform knowledge",
      "goal": "Execute automation workflow with platform integrations", 
      "rules": "Use real operations, handle errors, ensure data flow",
      "memory": "Automation context and platform configurations",
      "why_needed": "Essential for automation workflow execution"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "2.0.0",
    "description": "Automation workflow with real platform operations",
    "automation_context": "CURRENT_AUTOMATION_WORKFLOW",
    "trigger": {"type": "manual|scheduled|webhook"},
    "variables": {"automation_data": "workflow-specific variables"},
    "steps": [
      {
        "id": "step_1",
        "name": "Real Automation Step",
        "type": "action",
        "action": {
          "integration": "platform_name",
          "method": "real_api_method", 
          "parameters": "AUTOMATION_SPECIFIC_PARAMETERS"
        }
      }
    ]
  },
  "conversation_updates": {
    "automation_integration": "How platforms integrate with automation workflow"
  },
  "is_update": false,
  "recheck_status": "ready_for_automation_implementation"
}`

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message }
    ]

    console.log('Making OpenAI request with automation context...')

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
        max_tokens: 3000,
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    console.log('Received OpenAI response with automation awareness')

    // Parse and validate response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('JSON parsing successful')
      
      // Ensure complete structure
      if (!parsedResponse.summary) {
        parsedResponse.summary = "Analyzing automation request with real platform operations and workflow integration."
      }
      
      if (!parsedResponse.steps || !Array.isArray(parsedResponse.steps)) {
        parsedResponse.steps = [
          "Step 1: Identify automation requirements and real platform operations",
          "Step 2: Configure platform integrations with complete credentials", 
          "Step 3: Set up real workflow operations with sample data",
          "Step 4: Test automation with actual API calls and handle responses"
        ]
      }

      if (!parsedResponse.platforms || !Array.isArray(parsedResponse.platforms)) {
        parsedResponse.platforms = []
      }

      if (!parsedResponse.api_configurations || !Array.isArray(parsedResponse.api_configurations)) {
        parsedResponse.api_configurations = []
      }

      if (!parsedResponse.agents || !Array.isArray(parsedResponse.agents)) {
        parsedResponse.agents = [{
          name: "AutomationWorkflowAgent",
          role: "Automation specialist with real platform operation knowledge",
          goal: "Execute automation workflows using real API operations with sample data",
          rules: "Generate real operations, use automation context, handle workflow data flow",
          memory: `Automation context: ${automationContext ? 'Available and integrated' : 'Ready for integration'}`,
          why_needed: "Essential for executing real automation workflows with platform integrations"
        }]
      }

      if (!parsedResponse.automation_blueprint) {
        parsedResponse.automation_blueprint = {
          version: "2.0.0",
          description: "Automation workflow with real platform operations",
          automation_context: automationContext ? "Integrated with current automation" : "Ready for integration",
          trigger: { type: "manual" },
          variables: { automation_data: "workflow-specific variables" },
          steps: [],
          error_handling: { retry_attempts: 3, fallback_actions: "automation-aware error handling" }
        }
      }

      if (!parsedResponse.clarification_questions) {
        parsedResponse.clarification_questions = []
      }

      if (!parsedResponse.conversation_updates) {
        parsedResponse.conversation_updates = {
          automation_integration: automationContext ? "Automation context fully integrated" : "Ready for automation integration",
          platform_operations: "Real workflow operations generated"
        }
      }

      parsedResponse.is_update = parsedResponse.is_update || false
      parsedResponse.recheck_status = parsedResponse.recheck_status || "ready_for_automation_implementation"
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      
      // Comprehensive fallback response
      parsedResponse = {
        summary: "I understand your automation request and will generate real workflow operations with platform integrations.",
        steps: [
          "Step 1: Analyze automation requirements with real platform operations",
          "Step 2: Configure platform integrations with complete credentials", 
          "Step 3: Set up real workflow operations with automation context",
          "Step 4: Test automation with actual API calls and data flow"
        ],
        platforms: [],
        api_configurations: [],
        agents: [{
          name: "AutomationRecoveryAgent",
          role: "Automation specialist with real operation capabilities",
          goal: "Generate real automation workflows with platform integrations",
          rules: "Use real operations, automation context, complete workflows",
          memory: `Automation context: ${automationContext ? 'Available' : 'Ready for integration'}`,
          why_needed: "Essential for real automation workflow execution"
        }],
        clarification_questions: ["Which specific platforms would you like to integrate for real automation operations?"],
        automation_blueprint: {
          version: "2.0.0",
          description: "Real automation workflow with platform operations",
          automation_context: automationContext ? "Integrated" : "Ready for integration",
          trigger: { type: "manual" },
          variables: { automation_data: "real workflow variables" },
          steps: [],
          error_handling: { retry_attempts: 3, fallback_actions: "real automation error handling" }
        },
        conversation_updates: {
          status: "awaiting_platform_specification_for_real_operations",
          automation_integration: "Ready for real automation workflow implementation"
        },
        is_update: false,
        recheck_status: "ready_for_real_automation_specification"
      }
    }

    // Update knowledge usage
    if (universalKnowledge && universalKnowledge.length > 0) {
      for (const knowledge of universalKnowledge) {
        await supabase
          .from('universal_knowledge_store')
          .update({ 
            usage_count: (knowledge.usage_count || 0) + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', knowledge.id);
      }
    }

    console.log('Returning automation-aware response with real workflow operations')
    
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in automation-aware chat-ai function:', error)
    
    const errorResponse = {
      summary: "I encountered an issue, but I'm ready to help create your automation with real workflow operations and platform integrations.",
      steps: [
        "Step 1: Rephrase your automation requirements with specific platforms",
        "Step 2: I'll generate real workflow operations with complete credentials", 
        "Step 3: Provide automation-aware setup with actual API calls",
        "Step 4: Build your automation with real operations and data flow"
      ],
      platforms: [],
      api_configurations: [],
      agents: [{
        name: "ErrorRecoveryAutomationAgent",
        role: "Technical recovery specialist with real automation capabilities",
        goal: "Recover from issues while providing real automation solutions",
        rules: "Generate real operations, use automation context, provide complete workflows",
        memory: `Error recovery mode - automation context: ${automationContext ? 'Available' : 'Ready for integration'}`,
        why_needed: "Essential for reliable automation building with real workflow operations"
      }],
      clarification_questions: [
        "Could you please specify the exact platforms for your automation workflow?",
        "What specific outcome should this automation achieve with real operations?"
      ],
      automation_blueprint: {
        version: "2.0.0",
        description: "Error recovery workflow with real automation capabilities",
        automation_context: "Error recovery mode with real operations ready",
        trigger: { type: "manual" },
        variables: { automation_data: "recovery workflow variables" },
        steps: [],
        error_handling: { retry_attempts: 3, fallback_actions: "real automation error recovery" }
      },
      conversation_updates: {
        error_recovery_active: "Ready for real automation assistance",
        automation_integration: "Ready for real workflow operations"
      },
      is_update: false,
      recheck_status: "error_recovered_ready_for_real_automation_request"
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
