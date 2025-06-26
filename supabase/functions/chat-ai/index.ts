
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
    console.log('🔄 Processing chat request with enhanced comprehensive analysis')
    
    const { message, messages = [], automationId, automationContext } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📚 Conversation history length:', messages.length)
    console.log('🔧 Automation context:', automationId)

    // Get knowledge from store for context
    const { data: knowledgeData } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%,details->>solution.ilike.%${message}%`)
      .order('usage_count', { ascending: false })
      .limit(8);

    let knowledgeContext = '';
    if (knowledgeData && knowledgeData.length > 0) {
      knowledgeContext = `\n\nRELEVANT KNOWLEDGE FROM STORE:\n${knowledgeData.map(k => 
        `- ${k.title}: ${k.summary}\n  Solution: ${k.details?.solution || 'No solution recorded'}\n  Implementation: ${k.details?.implementation_notes || 'No implementation notes'}`
      ).join('\n')}`;
    }

    // Enhanced comprehensive system prompt
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect. You must think deeply and comprehensively about every automation request.

CRITICAL THINKING PROCESS - YOU MUST FOLLOW THIS EXACTLY:

1. DEEP AUTOMATION ANALYSIS:
   - Think: "How will this automation actually work step by step?"
   - Think: "What platforms do we need for this automation?"
   - Think: "What are ALL the credentials, IDs, tokens, and configurations needed for each platform?"

2. COMPREHENSIVE CREDENTIAL REQUIREMENTS:
   - DO NOT ask for just "API key" - be SPECIFIC about every credential needed
   - For Google Sheets: API key, Service Account JSON, Spreadsheet ID, Sheet Name, Cell Range
   - For Slack: Bot Token, User Token (if needed), Channel ID, Workspace ID, App ID
   - For Gmail: OAuth tokens, Client ID, Client Secret, Refresh Token, Email address
   - For Notion: Integration Token, Database ID, Page ID, Property names
   - For multiple platform usage: Ask if same account or different accounts needed

3. PLATFORM CLARIFICATION:
   - If multiple platform options exist, ask: "Do you want to use Platform A, B, or C?"
   - For email: "Gmail, Outlook, or another email service?"
   - For notifications: "Slack, Discord, Teams, or email?"
   - For storage: "Google Drive, Dropbox, OneDrive?"

4. ADVANCED AI AGENT SPECIFICATIONS:
   You MUST provide detailed AI agents with ALL these fields:
   - name: Specific descriptive name
   - role: Detailed role description
   - goal: Specific objective this agent accomplishes
   - rules: Detailed operating principles and constraints
   - memory: Initial memory context and what to remember
   - why_needed: Detailed explanation of why this agent is essential

5. USER AI KNOWLEDGE:
   When recommending AI agents, explain they need comprehensive credentials:
   - OpenAI API key for GPT models
   - Anthropic API key for Claude models
   - Google AI API key for Gemini models
   - Model-specific parameters and settings
   - Rate limiting and usage considerations

MANDATORY JSON STRUCTURE - YOU MUST RETURN EXACTLY THIS:

{
  "summary": "Comprehensive 3-4 line description of the complete automation workflow",
  "steps": [
    "Step 1: Detailed specific action with exact requirements",
    "Step 2: Next action with all parameters and configurations needed",
    "Step 3: Include authentication and permission setup steps",
    "Step 4: Data processing and transformation steps",
    "Step 5: Error handling and validation steps",
    "Step 6: Final execution and confirmation steps"
  ],
  "platforms": [
    {
      "name": "Exact Platform Name",
      "credentials": [
        {
          "field": "specific_credential_name",
          "placeholder": "Exact format expected (e.g., sk-...)",
          "link": "Direct URL to get this credential",
          "why_needed": "Detailed explanation of what this credential enables"
        }
      ]
    }
  ],
  "platforms_to_remove": [],
  "agents": [
    {
      "name": "SpecificAgentName",
      "role": "Comprehensive role description with responsibilities",
      "goal": "Specific measurable objective",
      "rules": "Detailed operating rules, constraints, and decision-making criteria",
      "memory": "Initial memory context and what information to retain",
      "why_needed": "Detailed explanation of why this agent is critical for success"
    }
  ],
  "clarification_questions": [
    "Which specific platform do you prefer: A, B, or C?",
    "Do you want to use the same account for multiple platform interactions?",
    "What specific data fields do you want to process?"
  ],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Detailed technical automation workflow",
    "trigger": {
      "type": "manual|scheduled|webhook|event",
      "schedule": "cron expression if scheduled",
      "webhook_url": "if webhook trigger"
    },
    "variables": {
      "input_data": "string",
      "processed_results": "object",
      "platform_responses": "array"
    },
    "steps": [
      {
        "id": "step_1",
        "name": "Descriptive Step Name",
        "type": "action|condition|ai_agent_call|loop",
        "action": {
          "integration": "platform_name",
          "method": "specific_api_method",
          "parameters": {
            "required_param": "{{variable_name}}",
            "optional_param": "default_value"
          },
          "platform_credential_id": "credential_reference"
        }
      }
    ],
    "error_handling": {
      "retry_attempts": 3,
      "fallback_actions": ["log_error", "notify_user"]
    }
  },
  "conversation_updates": {
    "platform_changes": "Detailed description of platform integrations added",
    "context_acknowledged": "How conversation history influenced this response",
    "knowledge_applied": "Specific knowledge from store that was used",
    "response_saved": "Confirmation of comprehensive analysis completion"
  },
  "is_update": false,
  "recheck_status": "comprehensive_analysis_complete"
}

CRITICAL RULES:
- NEVER provide minimalistic responses
- ALWAYS ask for comprehensive credentials
- ALWAYS provide detailed AI agent specifications
- ALWAYS include multiple clarification questions if needed
- ALWAYS use knowledge store information when available
- NEVER abbreviate or skip required fields

Context from knowledge store: ${knowledgeContext}
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

    console.log('📡 Making comprehensive OpenAI request...')

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

    console.log('✅ Received comprehensive OpenAI response, length:', aiResponse.length)

    // Validate and parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON validation successful')
      
      // Ensure all required fields exist with proper structure
      const structuredResponse = {
        summary: parsedResponse.summary || "Comprehensive automation analysis in progress",
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
          role: agent.role || 'Automation assistant',
          goal: agent.goal || 'Execute automation tasks',
          rules: agent.rules || 'Follow automation best practices',
          memory: agent.memory || 'Remember automation context',
          why_needed: agent.why_needed || 'Essential for automation execution'
        })) : [],
        clarification_questions: Array.isArray(parsedResponse.clarification_questions) ? parsedResponse.clarification_questions : [],
        automation_blueprint: parsedResponse.automation_blueprint || {
          version: "1.0.0",
          description: "Basic automation workflow",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: parsedResponse.conversation_updates || {
          platform_changes: "Comprehensive analysis completed",
          context_acknowledged: "Context processed successfully",
          knowledge_applied: "Applied automation best practices",
          response_saved: "Response ready for user review"
        },
        is_update: Boolean(parsedResponse.is_update),
        recheck_status: parsedResponse.recheck_status || "analysis_complete"
      }

      console.log('🎯 Returning comprehensive structured response')
      
      // Update knowledge usage
      if (knowledgeData && knowledgeData.length > 0) {
        for (const knowledge of knowledgeData) {
          await supabase
            .from('universal_knowledge_store')
            .update({ 
              usage_count: (knowledge.usage_count || 0) + 1,
              last_used: new Date().toISOString()
            })
            .eq('id', knowledge.id);
        }
      }

      return new Response(JSON.stringify(structuredResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('Raw response:', aiResponse)
      
      // Fallback comprehensive response
      const fallbackResponse = {
        summary: "I apologize, but I'm having trouble generating a comprehensive structured response. Please rephrase your automation request with more specific details.",
        steps: [
          "Step 1: Please provide more details about your automation goal",
          "Step 2: Specify which platforms you want to integrate",
          "Step 3: Describe the data flow you want to achieve",
          "Step 4: Mention any specific requirements or constraints"
        ],
        platforms: [],
        platforms_to_remove: [],
        agents: [{
          name: "BasicAutomationAgent",
          role: "General automation assistant",
          goal: "Help clarify automation requirements",
          rules: "Ask clarifying questions to understand user needs",
          memory: "Remember user preferences and requirements",
          why_needed: "Essential for understanding and building the right automation"
        }],
        clarification_questions: [
          "What specific platforms do you want to connect?",
          "What data do you want to move or process?",
          "What should trigger this automation?",
          "What is the desired end result?"
        ],
        automation_blueprint: {
          version: "1.0.0",
          description: "Placeholder for comprehensive automation design",
          trigger: { type: "manual" },
          steps: [],
          variables: {}
        },
        conversation_updates: {
          platform_changes: "No changes due to parsing error",
          context_acknowledged: "Error occurred during processing",
          knowledge_applied: "Applied error recovery patterns",
          response_saved: "Fallback response generated"
        },
        is_update: false,
        recheck_status: "parsing_error_recovery"
      }

      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    const errorResponse = {
      summary: "I encountered an error while processing your comprehensive automation request. Please try again with more specific details.",
      steps: [
        "Step 1: Try rephrasing your automation request",
        "Step 2: Be specific about platforms you want to use",
        "Step 3: Describe your desired workflow clearly",
        "Step 4: Contact support if the error persists"
      ],
      platforms: [],
      platforms_to_remove: [],
      agents: [{
        name: "ErrorRecoveryAgent",
        role: "Error handling and recovery specialist",
        goal: "Help recover from processing errors",
        rules: "Provide helpful error messages and recovery suggestions",
        memory: "Remember error patterns for better handling",
        why_needed: "Essential for maintaining system reliability"
      }],
      clarification_questions: [
        "Could you please rephrase your automation request?",
        "What specific platforms do you want to connect?",
        "Are you experiencing any specific issues?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow",
        trigger: { type: "manual" },
        steps: [],
        variables: {}
      },
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
      status: 200,
    })
  }
})
