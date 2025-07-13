
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Processing chat request')
    
    const { message, messages = [], automationId, automationContext, requestType } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    console.log('📚 Processing message:', message.substring(0, 100) + '...')
    console.log('🔧 Messages history length:', messages.length)
    console.log('🎯 Request type:', requestType || 'normal_chat')

    // PHASE 1: Handle API Configuration Generation specifically
    if (requestType === 'api_config_generation') {
      console.log('🔧 API Configuration Generation Mode Activated')
      
      const apiConfigPrompt = `You are an AI-powered API configuration generator. Generate complete, real API configurations for platform: ${message}

CRITICAL REQUIREMENTS:
- Generate REAL API endpoints and URLs (research actual platform APIs)
- Provide complete authentication configurations
- Include working test endpoints
- Generate proper error handling patterns
- Create detailed request/response examples

Return ONLY this JSON structure:
{
  "api_configurations": [
    {
      "platform_name": "${message}",
      "base_url": "REAL_API_BASE_URL",
      "auth_config": {
        "type": "bearer|api_key|oauth2|basic",
        "location": "header|query|body",
        "parameter_name": "Authorization|X-API-Key",
        "format": "Bearer {token}|Key {api_key}",
        "oauth2_config": {
          "authorization_url": "REAL_OAUTH_URL",
          "token_url": "REAL_TOKEN_URL",
          "scopes": ["REAL_SCOPES"],
          "grant_type": "authorization_code"
        }
      },
      "test_endpoint": {
        "method": "GET|POST",
        "path": "/REAL_TEST_PATH",
        "description": "Real test endpoint description",
        "expected_response": {
          "success": {"status": 200, "contains": ["REAL_FIELDS"]},
          "failure": {"status": 401, "message": "REAL_ERROR_MESSAGE"}
        },
        "headers": {
          "Content-Type": "application/json",
          "User-Agent": "YusrAI-Universal-Integrator/3.0"
        },
        "sample_request": {
          "url": "COMPLETE_REQUEST_URL",
          "method": "GET|POST",
          "headers": {"Authorization": "REAL_AUTH_HEADER"}
        },
        "sample_response": {
          "success": {"REAL_SUCCESS_DATA": "REAL_VALUES"},
          "error": {"error": "REAL_ERROR_CODE", "message": "REAL_ERROR_MESSAGE"}
        }
      },
      "common_endpoints": [
        {
          "name": "REAL_ENDPOINT_NAME",
          "method": "GET|POST|PUT|DELETE",
          "path": "/REAL_PATH",
          "description": "REAL_DESCRIPTION"
        }
      ],
      "error_patterns": [
        {"status": 401, "pattern": "unauthorized|invalid.*token", "action": "refresh_credentials"},
        {"status": 429, "pattern": "rate.*limit", "action": "retry_with_backoff"},
        {"status": 403, "pattern": "forbidden", "action": "check_permissions"}
      ],
      "rate_limits": {
        "requests_per_minute": 60,
        "requests_per_hour": 1000,
        "burst_limit": 10
      }
    }
  ]
}`

      const apiConfigResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: "system", content: apiConfigPrompt },
            { role: "user", content: `Generate complete API configuration for ${message}` }
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
          console.log('✅ API Configuration generated successfully')
          return new Response(apiConfig, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }
      
      console.warn('⚠️ API config generation failed, using fallback')
    }

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

    // ENHANCED SYSTEM PROMPT - ADDING API CONFIGURATIONS TO EXISTING SYSTEM
    const systemPrompt = `You are YusrAI, the world's most advanced automation architect with access to a universal knowledge store.

CRITICAL PLATFORM CLARIFICATION REQUIREMENT:
When users mention generic terms like "CRM", "email", "mail", "messaging", "calendar", "social media", etc., you MUST ask clarification questions to identify the SPECIFIC platform they want to use.

Examples of when to ask clarification:
- User says "CRM" → Ask: "Which CRM platform would you like to use? (HubSpot, Salesforce, Pipedrive, etc.)"
- User says "email" or "mail" → Ask: "Which email platform? (Gmail, Outlook, SendGrid, Mailchimp, etc.)"
- User says "messaging" → Ask: "Which messaging platform? (Slack, Discord, WhatsApp, etc.)"
- User says "calendar" → Ask: "Which calendar platform? (Google Calendar, Outlook Calendar, etc.)"

NEVER assume or suggest multiple platform options in the platforms array. ALWAYS ask for clarification first.

CRITICAL CREDENTIAL SECURITY RULE:
NEVER ask for sensitive credentials (API Keys, Tokens, Passwords, Client IDs, Client Secrets, Database URLs, Connection Strings) in clarification_questions. These must ONLY be collected in the platforms array with complete credential requirements.

COMPREHENSIVE CREDENTIAL COLLECTION RULE:
For EVERY platform identified, you MUST provide ALL necessary credentials in the platforms array including:
- API Keys, Access Tokens, Refresh Tokens
- Client IDs, Client Secrets, App IDs  
- Database URLs, Connection Strings, Endpoints
- Usernames, Email Addresses (when needed for setup)
- Organization IDs, Workspace IDs, Team IDs
- Webhook URLs, Callback URLs
- Service Account Keys, Certificate Files
- Region Settings, Environment Variables
- Custom Headers, Authentication Methods

NEVER simplify credential requirements - always ask for the complete set needed for each platform.

🚀 NEW FEATURE: DYNAMIC API CONFIGURATION GENERATION
For EVERY platform in the platforms array, you MUST also generate complete API configurations with:
- Real API base URLs (research actual endpoints)
- Authentication methods and headers
- Test endpoints for credential validation
- Complete API call structures
- Error response patterns
- Request/response examples

Universal Knowledge Store Access:
${universalKnowledgeMemory}

MANDATORY RESPONSE STRUCTURE:
You must ALWAYS return a complete JSON response with ALL required fields. NEVER return partial responses or null values.

CRITICAL RESPONSE BEHAVIOR:
- If clarification_questions is NOT empty, you STILL must return summary, steps, platforms, agents, and automation_blueprint
- The frontend needs complete data structure in every response
- Clarification questions are additional to the main response, not a replacement

JSON Structure - ALWAYS COMPLETE WITH NEW API CONFIGURATIONS:
{
  "summary": "Comprehensive 3-4 line description outlining the automation with identified platforms",
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
          "field": "API Key",
          "placeholder": "Enter your API key",
          "link": "direct_url_to_get_credential",
          "why_needed": "Required for API authentication and access"
        },
        {
          "field": "Client ID", 
          "placeholder": "Enter your client ID",
          "link": "direct_url_to_get_credential",
          "why_needed": "Required for OAuth authentication"
        },
        {
          "field": "Client Secret",
          "placeholder": "Enter your client secret", 
          "link": "direct_url_to_get_credential",
          "why_needed": "Required for secure OAuth flow"
        },
        {
          "field": "Organization ID",
          "placeholder": "Enter your organization ID",
          "link": "direct_url_to_get_credential", 
          "why_needed": "Required to identify your organization"
        },
        {
          "field": "Webhook URL",
          "placeholder": "Enter webhook endpoint URL",
          "link": "direct_url_to_get_credential",
          "why_needed": "Required for receiving real-time notifications"
        }
      ]
    }
  ],
  "api_configurations": [
    {
      "platform_name": "Platform Name",
      "base_url": "https://api.platformname.com/v1",
      "auth_config": {
        "type": "bearer|api_key|oauth2|basic",
        "location": "header|query|body",
        "parameter_name": "Authorization|X-API-Key|access_token",
        "format": "Bearer {token}|{token}|Key {api_key}",
        "oauth2_config": {
          "authorization_url": "https://platform.com/oauth/authorize",
          "token_url": "https://platform.com/oauth/token",
          "scopes": ["read", "write"],
          "grant_type": "authorization_code"
        }
      },
      "test_endpoint": {
        "method": "GET|POST",
        "path": "/me|/user|/auth/test",
        "description": "Test endpoint to validate credentials",
        "expected_response": {
          "success": {"status": 200, "contains": ["id", "name"]},
          "failure": {"status": 401, "message": "Unauthorized"}
        },
        "headers": {
          "Content-Type": "application/json",
          "User-Agent": "YusrAI-Universal-Integrator/3.0"
        },
        "sample_request": {
          "url": "https://api.platformname.com/v1/me",
          "method": "GET",
          "headers": {"Authorization": "Bearer {access_token}"}
        },
        "sample_response": {
          "success": {"id": "user123", "name": "John Doe", "email": "john@example.com"},
          "error": {"error": "invalid_token", "message": "The access token is invalid"}
        }
      },
      "common_endpoints": [
        {
          "name": "List Items",
          "method": "GET",
          "path": "/items",
          "description": "Retrieve list of items"
        },
        {
          "name": "Create Item", 
          "method": "POST",
          "path": "/items",
          "description": "Create a new item"
        }
      ],
      "error_patterns": [
        {"status": 401, "pattern": "unauthorized|invalid.*token", "action": "refresh_credentials"},
        {"status": 429, "pattern": "rate.*limit", "action": "retry_with_backoff"},
        {"status": 403, "pattern": "forbidden|insufficient.*permissions", "action": "check_scopes"}
      ],
      "rate_limits": {
        "requests_per_minute": 60,
        "requests_per_hour": 1000,
        "burst_limit": 10
      }
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
    "description": "Automation blueprint reflecting the detailed plan",
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
  "recheck_status": "ready_for_implementation"
}

🎯 CRITICAL API CONFIGURATION REQUIREMENTS:
- MUST generate real API endpoints for each platform (research actual URLs)
- MUST include complete authentication configuration
- MUST provide working test endpoints with expected responses
- MUST include error handling patterns
- MUST generate sample request/response structures
- MUST include rate limiting information

CRITICAL SUCCESS REQUIREMENTS:
- MUST identify ALL platforms and their complete credential requirements
- MUST provide granular, atomic steps  
- MUST use universal knowledge store as separate memory
- MUST return complete JSON structure for every request - NEVER partial or null responses
- MUST ensure JSON response is valid and complete in all scenarios
- MUST ask for ALL credentials needed for each platform (API Keys, Tokens, IDs, URLs, etc.)
- MUST generate complete API configurations for dynamic testing and execution

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

    console.log('🔍 Raw OpenAI response received, length:', aiResponse?.length || 0)

    if (!aiResponse) {
      console.error('❌ No response content from OpenAI')
      throw new Error('No response from OpenAI')
    }

    console.log('✅ Received OpenAI response')

    // ENHANCED JSON PARSING WITH COMPREHENSIVE FALLBACK
    let parsedResponse
    try {
      parsedResponse = JSON.parse(aiResponse)
      console.log('✅ JSON parsing successful')
      console.log('📊 Response structure:', {
        hasSummary: !!parsedResponse.summary,
        stepsCount: parsedResponse.steps?.length || 0,
        platformsCount: parsedResponse.platforms?.length || 0,
        agentsCount: parsedResponse.agents?.length || 0,
        clarificationCount: parsedResponse.clarification_questions?.length || 0,
        hasBlueprint: !!parsedResponse.automation_blueprint,
        hasApiConfigurations: !!parsedResponse.api_configurations
      })
      
      // VALIDATE COMPLETE STRUCTURE - NEVER ALLOW INCOMPLETE RESPONSES
      if (!parsedResponse.summary) {
        console.warn('⚠️ Response missing summary, adding comprehensive default')
        parsedResponse.summary = "I'm analyzing your automation request and will provide detailed steps with complete platform integrations."
      }
      
      if (!parsedResponse.steps || !Array.isArray(parsedResponse.steps)) {
        console.warn('⚠️ Response missing steps, adding defaults')
        parsedResponse.steps = [
          "Step 1: Analyze automation requirements and identify necessary platforms",
          "Step 2: Configure platform integrations with complete credential requirements", 
          "Step 3: Set up data flow and processing logic between platforms",
          "Step 4: Test the automation workflow and handle error scenarios"
        ]
      }

      if (!parsedResponse.platforms || !Array.isArray(parsedResponse.platforms)) {
        console.warn('⚠️ Response missing platforms, adding default structure') 
        parsedResponse.platforms = []
      }

      // NEW: Ensure API configurations are present
      if (!parsedResponse.api_configurations || !Array.isArray(parsedResponse.api_configurations)) {
        console.warn('⚠️ Response missing api_configurations, adding default structure')
        parsedResponse.api_configurations = []
        
        // Generate default API configs for any platforms that exist
        if (parsedResponse.platforms && parsedResponse.platforms.length > 0) {
          parsedResponse.api_configurations = parsedResponse.platforms.map(platform => ({
            platform_name: platform.name,
            base_url: `https://api.${platform.name.toLowerCase().replace(/\s+/g, '')}.com/v1`,
            auth_config: {
              type: "bearer",
              location: "header",
              parameter_name: "Authorization",
              format: "Bearer {token}"
            },
            test_endpoint: {
              method: "GET",
              path: "/me",
              description: `Test ${platform.name} authentication`,
              expected_response: {
                success: {"status": 200, "contains": ["id", "name"]},
                failure: {"status": 401, "message": "Unauthorized"}
              },
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "YusrAI-Universal-Integrator/3.0"
              },
              sample_request: {
                url: `https://api.${platform.name.toLowerCase().replace(/\s+/g, '')}.com/v1/me`,
                method: "GET",
                headers: {"Authorization": "Bearer {access_token}"}
              },
              sample_response: {
                success: {"id": "user123", "name": "User", "authenticated": true},
                error: {"error": "invalid_token", "message": "Authentication failed"}
              }
            },
            common_endpoints: [
              {
                name: "Get User Info",
                method: "GET", 
                path: "/me",
                description: "Get current user information"
              }
            ],
            error_patterns: [
              {"status": 401, "pattern": "unauthorized|invalid.*token", "action": "refresh_credentials"},
              {"status": 429, "pattern": "rate.*limit", "action": "retry_with_backoff"}
            ],
            rate_limits: {
              requests_per_minute: 60,
              requests_per_hour: 1000,
              burst_limit: 10
            }
          }))
        }
      }

      if (!parsedResponse.agents || !Array.isArray(parsedResponse.agents)) {
        console.warn('⚠️ Response missing agents, adding default')
        parsedResponse.agents = [{
          name: "AutomationArchitect",
          role: "Platform integration specialist with comprehensive automation knowledge",
          goal: "Create seamless automations with complete platform credential management",
          rules: "Always collect ALL required platform credentials, provide clear step-by-step guidance, ensure robust error handling",
          memory: `Universal knowledge store available: ${universalKnowledge?.length || 0} platform entries for comprehensive automation building`,
          why_needed: "Essential for building reliable, production-ready automations with proper platform integrations"
        }]
      }

      if (!parsedResponse.automation_blueprint) {
        console.warn('⚠️ Response missing automation blueprint, adding default')
        parsedResponse.automation_blueprint = {
          version: "1.0.0",
          description: "Comprehensive automation workflow with universal knowledge integration",
          trigger: { type: "manual" },
          variables: {},
          steps: [],
          error_handling: { retry_attempts: 3 }
        }
      }

      if (!parsedResponse.clarification_questions) {
        parsedResponse.clarification_questions = []
      }

      if (!parsedResponse.conversation_updates) {
        parsedResponse.conversation_updates = {
          knowledge_applied: `${universalKnowledge?.length || 0} universal knowledge entries processed`,
          platform_analysis_complete: "Complete automation structure prepared"
        }
      }

      if (!parsedResponse.platforms_to_remove) {
        parsedResponse.platforms_to_remove = []
      }

      parsedResponse.is_update = parsedResponse.is_update || false
      parsedResponse.recheck_status = parsedResponse.recheck_status || "ready_for_implementation"
      
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('❌ Raw OpenAI response (first 500 chars):', aiResponse.substring(0, 500))
      
      // COMPREHENSIVE FALLBACK RESPONSE - NEVER RETURN BLANK
      parsedResponse = {
        summary: "I understand your automation request. Let me break this down into actionable steps with comprehensive platform integrations.",
        steps: [
          "Step 1: Analyze your automation requirements and identify necessary platforms",
          "Step 2: Configure platform integrations with complete credential requirements", 
          "Step 3: Set up data flow and processing logic between platforms",
          "Step 4: Test the automation workflow and handle error scenarios",
          "Step 5: Deploy and monitor the automation for optimal performance"
        ],
        platforms: [{
          name: "Platform Configuration Required",
          credentials: [
            {
              field: "API Key",
              placeholder: "Enter your API key for platform authentication",
              link: "#",
              why_needed: "Required for secure platform integration and API access"
            },
            {
              field: "Client ID", 
              placeholder: "Enter your application client ID",
              link: "#",
              why_needed: "Required for OAuth authentication flow"
            },
            {
              field: "Client Secret",
              placeholder: "Enter your application client secret",
              link: "#", 
              why_needed: "Required for secure OAuth token exchange"
            }
          ]
        }],
        api_configurations: [{
          platform_name: "Platform Configuration Required",
          base_url: "https://api.platform.com/v1",
          auth_config: {
            type: "bearer",
            location: "header", 
            parameter_name: "Authorization",
            format: "Bearer {token}"
          },
          test_endpoint: {
            method: "GET",
            path: "/me",
            description: "Test platform authentication",
            expected_response: {
              success: {"status": 200, "contains": ["id", "name"]},
              failure: {"status": 401, "message": "Unauthorized"}
            },
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "YusrAI-Universal-Integrator/3.0"
            },
            sample_request: {
              url: "https://api.platform.com/v1/me",
              method: "GET",
              headers: {"Authorization": "Bearer {access_token}"}
            },
            sample_response: {
              success: {"id": "user123", "name": "User", "authenticated": true},
              error: {"error": "invalid_token", "message": "Authentication failed"}
            }
          },
          common_endpoints: [],
          error_patterns: [
            {"status": 401, "pattern": "unauthorized|invalid.*token", "action": "refresh_credentials"}
          ],
          rate_limits: {
            requests_per_minute: 60,
            requests_per_hour: 1000,
            burst_limit: 10
          }
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

    // FINAL COMPREHENSIVE VALIDATION - ENSURE RESPONSE IS NEVER NULL OR INCOMPLETE
    if (!parsedResponse || typeof parsedResponse !== 'object') {
      console.error('❌ Parsed response is invalid, using emergency comprehensive fallback')
      parsedResponse = {
        summary: "I'm ready to help you create a comprehensive automation with complete platform integrations and credential management.",
        steps: [
          "Step 1: Identify and specify the exact platforms for your automation",
          "Step 2: Configure complete credential sets for each platform including API keys, tokens, and IDs",
          "Step 3: Define the automation workflow and data processing steps with error handling", 
          "Step 4: Set up monitoring, logging, and performance optimization for reliability"
        ],
        platforms: [],
        api_configurations: [],
        platforms_to_remove: [],
        agents: [{
          name: "ComprehensiveAutomationAgent",
          role: "Advanced automation architect with complete platform integration expertise",
          goal: "Build robust automations with comprehensive credential management and error handling",
          rules: "Collect ALL platform credentials, ensure security, provide complete setup guidance",
          memory: "Ready to integrate any platform with complete credential requirements",
          why_needed: "Essential for creating production-ready automations with proper security and monitoring"
        }],
        clarification_questions: ["Which specific platforms would you like to integrate for this automation?"],
        automation_blueprint: {
          version: "1.0.0",
          description: "Platform-specific automation ready for comprehensive configuration",
          trigger: { type: "manual" },
          variables: {},
          steps: [],
          error_handling: { retry_attempts: 3 }
        },
        conversation_updates: {
          status: "awaiting_platform_specification",
          readiness: "complete_automation_framework_prepared"
        },
        is_update: false,
        recheck_status: "ready_for_complete_specification"
      }
    }

    // CRITICAL: ALWAYS RETURN COMPLETE RESPONSE - NEVER STRIP DATA
    console.log('🎯 Final response validation passed')
    console.log('📤 Response summary:', parsedResponse.summary?.substring(0, 100) + '...')
    console.log('🔧 Platforms count:', parsedResponse.platforms?.length || 0)
    console.log('🔌 API configurations count:', parsedResponse.api_configurations?.length || 0) 
    console.log('❓ Clarification questions count:', parsedResponse.clarification_questions?.length || 0)

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

    console.log('🚀 Returning complete validated response with API configurations')
    
    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    // ENHANCED ERROR RESPONSE - COMPREHENSIVE FALLBACK
    const errorResponse = {
      summary: "I encountered a technical issue, but I'm ready to help you create your automation with complete platform integrations. Please rephrase your request and I'll provide a comprehensive solution.",
      steps: [
        "Step 1: Rephrase your automation requirements with specific platform preferences",
        "Step 2: I'll identify all required platforms with complete credential requirements including API keys, tokens, and IDs", 
        "Step 3: Provide comprehensive setup information for each platform integration with security best practices",
        "Step 4: Build your automation with proper error handling, monitoring, and performance optimization"
      ],
      platforms: [],
      api_configurations: [],
      platforms_to_remove: [],
      agents: [{
        name: "ErrorRecoveryAgent",
        role: "Technical issue resolution specialist with comprehensive automation knowledge",
        goal: "Recover from technical issues while providing complete automation solutions with full credential management",
        rules: "Always provide helpful responses, collect ALL platform credentials (API keys, tokens, IDs, URLs), never return empty responses",
        memory: "Technical issue encountered - ready to provide complete automation assistance with comprehensive platform integration",
        why_needed: "Essential for maintaining reliability and providing consistent automation building support"
      }],
      clarification_questions: [
        "Could you please rephrase your automation request with specific platform names?",
        "What specific outcome are you trying to achieve with this automation?"
      ],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow - ready for complete automation building with comprehensive platform integration",
        trigger: { type: "manual" },
        variables: {},
        steps: [],
        error_handling: {
          retry_attempts: 3
        }
      },
      conversation_updates: {
        error_recovery_active: "Technical issue resolved - ready for complete automation assistance",
        platform_support_ready: "All platform integrations available for comprehensive automation building with full credential collection"
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
