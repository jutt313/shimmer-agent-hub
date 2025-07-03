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
    console.log('🔄 Processing chat request with ENHANCED platform knowledge integration')
    
    const { message, messages = [], automationId, automationContext } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📚 Conversation history length:', messages.length)
    console.log('🔧 Automation context:', automationId)

    // ENHANCED KNOWLEDGE RETRIEVAL - Get ALL platform knowledge
    console.log('🔍 Searching for platform knowledge in universal store...')
    
    // First, get platform-specific knowledge
    const { data: platformKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .eq('category', 'platform_knowledge')
      .order('usage_count', { ascending: false })
      .limit(50);

    // Also search for message-related knowledge
    const { data: messageKnowledge } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%,details->>solution.ilike.%${message}%`)
      .order('usage_count', { ascending: false })
      .limit(20);

    // Combine and deduplicate knowledge
    const allKnowledge = [...(platformKnowledge || []), ...(messageKnowledge || [])];
    const uniqueKnowledge = allKnowledge.filter((item, index, self) => 
      index === self.findIndex(k => k.id === item.id)
    );

    console.log(`📊 Found ${uniqueKnowledge.length} unique knowledge entries`);
    console.log(`🔧 Platform knowledge entries: ${platformKnowledge?.length || 0}`);
    console.log(`💡 Message-related knowledge: ${messageKnowledge?.length || 0}`);

    // Build comprehensive knowledge context
    let knowledgeContext = '';
    if (uniqueKnowledge && uniqueKnowledge.length > 0) {
      const platformData = uniqueKnowledge
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

      const generalKnowledge = uniqueKnowledge
        .filter(k => k.category !== 'platform_knowledge')
        .map(k => `- ${k.title}: ${k.summary}\n  Solution: ${k.details?.solution || 'No solution recorded'}`)
        .join('\n');

      knowledgeContext = `
COMPREHENSIVE PLATFORM KNOWLEDGE DATABASE (SUPPLEMENTARY):
This database provides additional, specific details for known platforms. It is NOT the sole source of truth for common platform features or credential types. The core AI has general knowledge about common platforms.
${platformData}

ADDITIONAL RELEVANT KNOWLEDGE:
${generalKnowledge}
`;
    }

    console.log('📖 Knowledge context length:', knowledgeContext.length);

    // Enhanced comprehensive system prompt with MANDATORY platform integration
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect with comprehensive knowledge of platforms and their integrations. You also have access to a SUPPLEMENTARY platform knowledge database for enhanced details.

CRITICAL PLATFORM KNOWLEDGE INTEGRATION RULES:
1. You MUST use your core platform knowledge for all recommendations.
2. The provided 'COMPREHENSIVE PLATFORM KNOWLEDGE DATABASE (SUPPLEMENTARY)' is for ADDITIONAL details and specific configurations. It is NOT the primary or only source of truth for basic platform functionality or common credential types.
3. You MUST identify and include ALL necessary credential requirements for every platform interaction. This includes both authentication tokens (e.g., API keys, OAuth tokens) AND essential operational identifiers (e.g., Spreadsheet ID, Channel ID, Project ID) needed for initial setup. DO NOT state "no specific credentials required" unless a platform truly has NO authentication or setup identifiers.
4. You MUST reference specific platform capabilities and use cases based on your core knowledge, enhanced by the supplementary database.
5. You MUST prioritize platforms that you have robust knowledge about, especially if the supplementary database provides comprehensive information.

PLATFORM KNOWLEDGE DATABASE AVAILABLE (SUPPLEMENTARY):
${knowledgeContext}

MANDATORY RESPONSE REQUIREMENTS:

You MUST provide detailed automation information including:
- **Comprehensive Platform Setup & Credential Information:** For EVERY platform used, provide its name and a 'credentials' array. This array MUST include not just authentication fields (field, placeholder, link, why_needed) but also essential operational identifiers (e.g., Spreadsheet ID, Channel ID, Project ID) that are part of the platform's initial setup. If specific fields are not in the supplementary database, infer common credential/identifier types (e.g., "OAuth 2.0 Token", "API Key", "Bearer Token", "Spreadsheet ID", "Channel ID") from your core knowledge and provide them.
- **Specific Platform Capabilities and Use Cases.**
- **Proper API Configuration Details.**
- **Real Implementation Examples where applicable.**
- **All Necessary Dynamic Parameters:** For actions requiring *dynamic runtime inputs* not explicitly mentioned by the user (e.g., values that change with each automation run, like "task name from row data"), you MUST identify these and generate precise clarification questions for them. Questions about static setup identifiers (like Sheet ID, Channel ID) should NOT be in clarification_questions but in the 'platforms' array.

CRITICAL THINKING PROCESS - FOLLOW EXACTLY:

1. **DEEP AUTOMATION BREAKDOWN & ATOMIC STEPS:**
   - Deeply analyze the user's request.
   - Break down the entire automation into the MOST GRANULAR, ATOMIC logical steps possible. Each distinct action or decision point should be a separate step in the 'steps' array.
   - Example: "Step 1: Detect new row in spreadsheet service.", "Step 2: Extract task name and due date from row data.", "Step 3: Create new task in task management service.", "Step 4: Send message via communication service."

2. **COMPREHENSIVE PLATFORM & SETUP IDENTIFICATION:**
   - Identify all platforms/services required for each atomic step.
   - For each platform, list ALL necessary setup parameters:
     - Authentication credentials (e.g., API Key, OAuth Token).
     - Essential operational identifiers (e.g., Spreadsheet ID, Channel ID, Project ID, Database Name, List ID) that are needed for the platform to function in this specific automation context.
   - Populate the `platforms` array with these details. If the supplementary database doesn't provide a specific field, infer the common type from your core knowledge.
   - **Crucially: NEVER state "no specific credentials required" unless a platform truly has NO authentication or setup identifiers for the stated operation.**

3. **DYNAMIC RUNTIME PARAMETER IDENTIFICATION & CLARIFICATION:**
   - For every action, identify ONLY truly *dynamic runtime parameters* (e.g., "assigned team member's email if dynamic", "message content variable") that are not known at setup and require user input per run or are derived from previous steps.
   - For each such missing dynamic parameter, formulate a precise `clarification_question`. Ensure these questions are generic and do NOT mention specific platform names (e.g., ask about "messaging destination" instead of "Slack channel").

4. **PLATFORM SELECTION LOGIC:**
   - Prioritize platforms with comprehensive setup information and known capabilities (from both core knowledge and supplementary database).
   - Use stored use cases and platform descriptions (from core knowledge and supplementary database) to recommend appropriate platforms.
   - Include integration type information (API, OAuth, etc.).

MANDATORY JSON STRUCTURE - EXACTLY THIS FORMAT:

{
  "summary": "Comprehensive 3-4 line description outlining the automation, referencing identified platforms.",
  "steps": [
    "Step 1: [GRANULAR_ATOMIC_ACTION] using [PLATFORM/SERVICE], e.g., 'Step 1: Detect new row in spreadsheet service'.",
    "Step 2: [GRANULAR_ATOMIC_ACTION] e.g., 'Step 2: Extract task name and due date from row data'.",
    "Step 3: [GRANULAR_ATOMIC_ACTION] e.g., 'Step 3: Create new task in task management service'.",
    "Step 4: [GRANULAR_ATOMIC_ACTION] e.g., 'Step 4: Send message via communication service'."
    // ... continue for all atomic steps
  ],
  "platforms": [
    {
      "name": "Platform Name (e.g., Google Sheets, Asana, Slack)", // Use actual platform name here
      "credentials": [
        {
          "field": "Authentication Token/ID (e.g., 'OAuth 2.0 Token', 'Personal Access Token', 'API Key')",
          "placeholder": "Enter credential value (e.g., your_oauth_token_xyz)",
          "link": "direct_url_to_get_credential_if_known",
          "why_needed": "Authentication for API access."
        },
        {
          "field": "Operational Identifier (e.g., 'Spreadsheet ID', 'Channel ID', 'Project ID')",
          "placeholder": "Enter identifier value (e.g., spreadsheet_id_123, channel_id_abc)",
          "link": "link_to_find_identifier_if_known", // Optional, if applicable
          "why_needed": "Required to specify the exact resource for the automation (e.g., 'to monitor this specific sheet', 'to send message to this channel')."
        }
        // ... include ALL required authentication and operational identifiers for this platform
      ]
    }
    // ... include ALL required platforms and their credential/setup details
  ],
  "platforms_to_remove": [],
  "agents": [
    {
      "name": "SpecificAgentName",
      "role": "Detailed role using platform knowledge",
      "goal": "Specific objective referencing platform capabilities",
      "rules": "Rules incorporating platform-specific constraints from knowledge",
      "memory": "Initial memory including platform configuration details",
      "why_needed": "Explanation referencing specific platform integration needs"
    }
  ],
  "clarification_questions": [
    "How should the system dynamically determine the 'assigned team member' for the notification (e.g., a specific name, an ID from the extracted data, or a default)?"
    // Removed questions about Spreadsheet ID, Channel ID, etc., as they are now expected in 'platforms' credentials
  ],
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
      "knowledge_references": "array of knowledge base entries used",
      "dynamic_parameters": "object mapping dynamic parameters from clarification questions"
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
            "input_data": "mapped_from_previous_step_or_clarification"
          },
          "platform_credential_id": "credential_reference"
        }
      }
      // ... more granular steps
    ],
    "error_handling": {
      "retry_attempts": 3,
      "platform_specific_fallbacks": "from knowledge base or inferred best practices"
    }
  },
  "conversation_updates": {
    "knowledge_applied": "Specific platforms and inferred/identified credentials/setup details used.",
    "platform_count": "number of platforms referenced.",
    "credential_fields_count": "total credential/setup fields included.",
    "knowledge_entries_used": "list of specific knowledge entries referenced.",
    "missing_parameters_identified": "List of dynamic runtime parameters that require clarification from user."
  },
  "is_update": false,
  "recheck_status": "parameters_clarification_needed" // Or "ready_for_blueprint_generation" if no questions
}

CRITICAL SUCCESS METRICS:
- MUST identify ALL platforms and their corresponding authentication credentials AND essential operational identifiers (e.g., Spreadsheet ID, Channel ID).
- MUST provide granular, atomic steps in the 'steps' array.
- MUST identify ALL missing *dynamic runtime parameters* and generate precise, platform-agnostic clarification questions (excluding setup identifiers).
- MUST never state "no specific credentials required" unless factually true for a credential-less operation.
- MUST confine ALL credential and essential operational identifier details to the 'platforms' array.

Context from comprehensive knowledge database: ${knowledgeContext}
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

    console.log('📡 Making ENHANCED OpenAI request with platform knowledge integration...')

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

    console.log('✅ Received ENHANCED OpenAI response with platform knowledge integration')

    // Validate and parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON validation successful')
      
      // Log knowledge integration success metrics
      console.log('📊 Knowledge Integration Metrics:', {
        platformsReferenced: parsedResponse.platforms?.length || 0,
        knowledgeEntriesUsed: uniqueKnowledge.length,
        credentialFieldsIncluded: parsedResponse.platforms?.reduce((acc: number, p: any) => acc + (p.credentials?.length || 0), 0) || 0
      });
      
      // Ensure all required fields exist with enhanced structure
      const structuredResponse = {
        summary: parsedResponse.summary || "Enhanced automation analysis using comprehensive platform knowledge",
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
          role: agent.role || 'Automation assistant with platform knowledge',
          goal: agent.goal || 'Execute automation tasks using platform integrations',
          rules: agent.rules || 'Follow automation best practices and platform constraints',
          memory: agent.memory || 'Remember automation context and platform configurations',
          why_needed: agent.why_needed || 'Essential for automation execution with platform knowledge'
        })) : [],
        clarification_questions: Array.isArray(parsedResponse.clarification_questions) ? parsedResponse.clarification_questions : [],
        automation_blueprint: parsedResponse.automation_blueprint || {
          version: "1.0.0",
          description: "Platform-integrated automation workflow",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          ...parsedResponse.conversation_updates,
          platform_changes: "Enhanced platform integration using knowledge database",
          context_acknowledged: "Platform knowledge successfully integrated",
          knowledge_applied: `Applied ${uniqueKnowledge.length} knowledge entries including ${platformKnowledge?.length || 0} platform configurations`,
          response_saved: "Knowledge-enhanced response ready for user review"
        },
        is_update: Boolean(parsedResponse.is_update),
        recheck_status: parsedResponse.recheck_status || "knowledge_integration_complete"
      }

      console.log('🎯 Returning ENHANCED structured response with platform knowledge')
      
      // Update knowledge usage for ALL used knowledge entries
      if (uniqueKnowledge && uniqueKnowledge.length > 0) {
        console.log(`📈 Updating usage count for ${uniqueKnowledge.length} knowledge entries`);
        for (const knowledge of uniqueKnowledge) {
          await supabase
            .from('universal_knowledge_store')
            .update({ 
              usage_count: (knowledge.usage_count || 0) + 1,
              last_used: new Date().toISOString()
            })
            .eq('id', knowledge.id);
        }
        console.log('✅ Successfully updated all knowledge usage counts');
      }

      return new Response(JSON.stringify(structuredResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Raw response:', aiResponse)
      
      // Enhanced fallback response with platform knowledge
      const fallbackResponse = {
        summary: "I'm having trouble generating a structured response, but I have access to your comprehensive platform knowledge database with over 200 platforms. Please rephrase your request.",
        steps: [
          "Step 1: Rephrase your automation request with specific platform preferences",
          "Step 2: I'll use your knowledge database to suggest exact platforms and credentials",
          "Step 3: Choose from platforms like Gmail, Slack, Notion, Airtable, etc. from your database",
          "Step 4: I'll provide exact credential requirements from your stored knowledge"
        ],
        platforms: [],
        platforms_to_remove: [],
        agents: [{
          name: "EnhancedPlatformAgent",
          role: "Platform integration specialist with access to comprehensive knowledge database",
          goal: "Leverage stored platform knowledge to build perfect automations",
          rules: "Use exact credential requirements from knowledge database and prioritize platforms with complete integration details",
          memory: `Available platforms in knowledge base: ${uniqueKnowledge.length} entries including detailed credential requirements`,
          why_needed: "Essential for utilizing the comprehensive platform knowledge database effectively"
        }],
        clarification_questions: [
          "Which platforms from your knowledge database would you like to integrate?",
          "Should I use the stored credential configurations for your preferred platforms?",
          "Would you like me to suggest platforms based on your automation goals?"
        ],
        automation_blueprint: {
          version: "1.0.0",
          description: "Platform-knowledge-powered automation design",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          platform_changes: "Fallback response with platform knowledge access",
          context_acknowledged: "Platform knowledge database available for integration",
          knowledge_applied: `${uniqueKnowledge.length} platform knowledge entries accessible`,
          response_saved: "Fallback response with enhanced platform knowledge integration"
        },
        is_update: false,
        recheck_status: "parsing_error_with_knowledge_access"
      }

      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('💥 Error in enhanced chat-ai function:', error)
    
    const errorResponse = {
      summary: "I encountered an error while processing your request, but I have access to your comprehensive platform knowledge database. Please try again.",
      steps: [
        "Step 1: Try rephrasing your automation request",
        "Step 2: Specify platforms you want to use from the knowledge database",
        "Step 3: I'll provide exact credential requirements from stored knowledge",
        "Step 4: Contact support if the error persists"
      ],
      platforms: [],
      platforms_to_remove: [],
      agents: [{
        name: "ErrorRecoveryAgentWithKnowledge",
        role: "Error handling specialist with platform knowledge database access",
        goal: "Recover from errors while maintaining access to platform knowledge",
        rules: "Provide helpful error messages and leverage stored platform knowledge for recovery",
        memory: "Platform knowledge database remains accessible for automation building",
        why_needed: "Essential for maintaining system reliability with platform knowledge integration"
      }],
      clarification_questions: [
        "Could you please rephrase your automation request?",
        "Which platforms from the knowledge database would you like to use?",
        "Should I suggest platforms based on your stored knowledge?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow with platform knowledge",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      },
      conversation_updates: {
        platform_changes: "No changes due to error, but knowledge database remains accessible",
        context_acknowledged: "Error occurred during processing, platform knowledge still available",
        knowledge_applied: "Platform knowledge database ready for next request",
        response_saved: "Error response with knowledge integration capability"
      },
      is_update: false,
      recheck_status: "error_with_knowledge_access"
    }

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})