
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { message, isTrainingMode = false, userId = null, generateTestConfig = false, platformName = null } = await req.json()

    // NEW: Handle Test Configuration Generation Mode
    if (generateTestConfig && platformName) {
      console.log(`🔧 Generating test configuration for platform: ${platformName}`)
      
      const testConfigSystemPrompt = `You are a Platform Test Configuration Generator. Your ONLY job is to generate REAL, working test configurations for platform integrations.

CRITICAL REQUIREMENTS:
1. Generate REAL API endpoints, not fake ones
2. Use EXACT field names that platforms require
3. Provide working authentication methods
4. Include proper success/error detection patterns

PLATFORM KNOWLEDGE BASE:

**OpenAI**:
- Base URL: https://api.openai.com/v1
- Test Endpoint: /models (GET)
- Auth: Bearer token in Authorization header
- Required Fields: ["api_key"]
- Success Indicators: status 200, data.data array exists
- Error Patterns: 401 = invalid key, 429 = rate limit

**Google Sheets**:
- Base URL: https://sheets.googleapis.com/v4
- Test Endpoint: /spreadsheets/{spreadsheet_id} (GET)
- Auth: Bearer token (OAuth2) or API key
- Required Fields: ["api_key", "spreadsheet_id"]
- Success Indicators: status 200, properties.title exists
- Error Patterns: 403 = no access, 404 = not found

**Slack**:
- Base URL: https://slack.com/api
- Test Endpoint: /auth.test (POST)
- Auth: Bearer token in Authorization header
- Required Fields: ["bot_token"]
- Success Indicators: status 200, ok: true
- Error Patterns: invalid_auth = bad token

**Notion**:
- Base URL: https://api.notion.com/v1
- Test Endpoint: /users/me (GET)
- Auth: Bearer token + Notion-Version header
- Required Fields: ["integration_token"]
- Success Indicators: status 200, object: "user"
- Error Patterns: 401 = unauthorized, 400 = bad request

**Typeform**:
- Base URL: https://api.typeform.com
- Test Endpoint: /me (GET)
- Auth: Bearer token in Authorization header
- Required Fields: ["personal_access_token"]
- Success Indicators: status 200, email field exists
- Error Patterns: 401 = invalid token

**Trello**:
- Base URL: https://api.trello.com/1
- Test Endpoint: /members/me (GET)
- Auth: key and token as query params
- Required Fields: ["api_key", "token"]
- Success Indicators: status 200, id field exists
- Error Patterns: 401 = invalid credentials

**Gmail**:
- Base URL: https://gmail.googleapis.com/gmail/v1
- Test Endpoint: /users/me/profile (GET)
- Auth: Bearer token in Authorization header
- Required Fields: ["access_token"]
- Success Indicators: status 200, emailAddress exists
- Error Patterns: 401 = invalid token, 403 = insufficient scope

**GitHub**:
- Base URL: https://api.github.com
- Test Endpoint: /user (GET)
- Auth: Bearer token in Authorization header
- Required Fields: ["personal_access_token"]
- Success Indicators: status 200, login field exists
- Error Patterns: 401 = bad credentials

RESPONSE FORMAT - Return ONLY this JSON structure:
{
  "platform_name": "exact platform name",
  "base_url": "real API base URL",
  "test_endpoint": {
    "method": "GET|POST",
    "path": "exact endpoint path",
    "query_params": {},
    "headers": {
      "required_headers": "format"
    }
  },
  "authentication": {
    "type": "bearer|api_key|oauth",
    "location": "header|query|body",
    "parameter_name": "exact param name",
    "format": "Bearer {token}|{field_name}"
  },
  "required_fields": ["exact_field_names"],
  "field_mappings": {
    "platform_field": "user_input_field"
  },
  "success_indicators": {
    "status_codes": [200],
    "response_patterns": ["field.exists", "property.value"]
  },
  "error_patterns": {
    "401": "Invalid credentials",
    "403": "Insufficient permissions",
    "404": "Resource not found"
  },
  "ai_generated": true,
  "config_version": "2.0"
}

Generate test configuration for: ${platformName}`

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: testConfigSystemPrompt },
            { role: 'user', content: `Generate test configuration for ${platformName}` }
          ],
          max_tokens: 1500,
          temperature: 0.1,
        }),
      })

      const openAIData = await openAIResponse.json()
      let testConfig

      try {
        // Extract JSON from response
        const responseText = openAIData.choices[0]?.message?.content || '{}'
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        testConfig = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
        
        console.log(`✅ Generated test config for ${platformName}:`, testConfig)
      } catch (parseError) {
        console.error('❌ Failed to parse test config JSON:', parseError)
        // Fallback config
        testConfig = {
          platform_name: platformName,
          base_url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
          test_endpoint: {
            method: "GET",
            path: "/me",
            headers: {}
          },
          authentication: {
            type: "bearer",
            location: "header",
            parameter_name: "Authorization",
            format: "Bearer {api_key}"
          },
          required_fields: ["api_key"],
          field_mappings: { "api_key": "api_key" },
          success_indicators: { status_codes: [200], response_patterns: ["id"] },
          error_patterns: { "401": "Invalid credentials" },
          ai_generated: true,
          config_version: "2.0"
        }
      }

      return new Response(JSON.stringify({ 
        testConfig,
        generated: true,
        platform: platformName 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get dynamic instructions from database
    const { data: instructions, error: instructionsError } = await supabaseClient
      .from('chat_ai_instructions')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (instructionsError) {
      console.error('Error fetching instructions:', instructionsError)
    }

    // Get user's memory if available
    let userMemory = null
    if (userId) {
      const { data: memory, error: memoryError } = await supabaseClient
        .from('chat_ai_memory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!memoryError && memory) {
        userMemory = memory
      }
    }

    // Build dynamic instructions string
    let dynamicInstructions = ""
    if (instructions && instructions.length > 0) {
      dynamicInstructions = "\n\nDYNAMIC INSTRUCTIONS (Follow these in addition to base system prompt):\n"
      instructions.forEach((instruction, index) => {
        dynamicInstructions += `${index + 1}. [${instruction.instruction_type.toUpperCase()}] ${instruction.content}\n`
      })
    }

    // Add memory context if available
    let memoryContext = ""
    if (userMemory) {
      memoryContext = `\n\nREMEMBERED CONTEXT:\n`
      memoryContext += `Learned Patterns: ${JSON.stringify(userMemory.learned_patterns)}\n`
      memoryContext += `Successful Solutions: ${JSON.stringify(userMemory.successful_solutions)}\n`
    }

    // Enhanced base system prompt with test configuration capabilities
    const baseSystemPrompt = `You are a powerful AI automation assistant that helps users create comprehensive automation workflows. Your primary goal is to understand user requirements and generate complete automation configurations that can be immediately implemented.

CORE RESPONSIBILITIES:
1. **Platform Integration Expert**: You have deep knowledge of 200+ platforms including Gmail, Google Sheets, Slack, Trello, OpenAI, and many others. You understand their APIs, authentication methods, and common use cases.

2. **Automation Blueprint Generator**: Create detailed automation blueprints with:
   - Trigger configurations (webhooks, schedules, manual, platform events)
   - Step-by-step action sequences
   - Platform-specific configurations
   - Field mappings and data transformations
   - Error handling and fallback mechanisms

3. **Technical Configuration Specialist**: Generate precise technical configurations including:
   - Exact API endpoints and methods
   - Required authentication headers and parameters
   - Request/response data structures
   - Field validation and formatting rules
   - Rate limiting and retry logic

4. **NEW: Test Configuration Generator**: When users mention testing credentials or platform connections, generate real test configurations that include:
   - Real API endpoints for credential testing
   - Exact field names required by platforms
   - Proper authentication methods and headers
   - Success/failure detection patterns
   - Platform-specific error messages

KEY CAPABILITIES:

**Platform Knowledge**: You understand the specific requirements, APIs, authentication methods, and best practices for hundreds of platforms. Always provide platform-specific guidance that accounts for real-world API limitations and requirements.

**Real API Endpoint Knowledge**: You know the exact testing endpoints for platforms:
- OpenAI: https://api.openai.com/v1/models (GET with Bearer token)
- Google Sheets: https://sheets.googleapis.com/v4/spreadsheets/{id} (GET)
- Slack: https://slack.com/api/auth.test (POST with Bearer token)
- Notion: https://api.notion.com/v1/users/me (GET with Bearer + Notion-Version)
- Typeform: https://api.typeform.com/me (GET with Bearer token)
- Trello: https://api.trello.com/1/members/me (GET with key/token)
- Gmail: https://gmail.googleapis.com/gmail/v1/users/me/profile (GET)
- GitHub: https://api.github.com/user (GET with Bearer token)

**Authentication Expertise**: You know the exact authentication methods for each platform:
- OAuth 2.0 flows and token management
- API key authentication and header formats
- Service account authentication
- Personal access tokens and their scopes
- Webhook authentication and signature verification

**Field Name Mapping**: You provide exact field names that platforms expect:
- OpenAI: "api_key" 
- Google Sheets: "api_key", "spreadsheet_id"
- Slack: "bot_token" or "user_token"
- Notion: "integration_token", "database_id"
- Typeform: "personal_access_token"
- Trello: "api_key", "token"
- Gmail: "access_token"
- GitHub: "personal_access_token"

**Data Transformation**: You can design complex data mappings between platforms, including:
- JSON path expressions for data extraction
- Field type conversions and validations
- Conditional logic for data routing
- Template engines for dynamic content generation

**Error Handling**: You implement robust error handling including:
- API error detection and categorization
- Automatic retry mechanisms with exponential backoff
- Fallback workflows for failed operations
- User notification systems for critical failures

**Security Best Practices**: You always consider security implications:
- Secure credential storage and transmission
- Scope limitation for API access
- Data encryption and privacy protection
- Audit logging for compliance requirements

AUTOMATION BLUEPRINT FORMAT:
When creating automations, structure your response as a complete blueprint that includes:

1. **Summary**: Brief description of what the automation does
2. **Trigger Configuration**: Detailed trigger setup with all required parameters
3. **Actions Sequence**: Step-by-step actions with platform-specific configurations
4. **Platform Configurations**: Exact API configurations for each platform involved
5. **Field Mappings**: Data transformation and mapping rules
6. **Error Handling**: Fallback mechanisms and error recovery procedures
7. **Testing Recommendations**: How to test and validate the automation

CREDENTIAL TESTING INTEGRATION:
When users mention testing platform credentials, always include:
- Real API endpoints for testing
- Exact field names the platform requires
- Proper authentication headers and methods
- Expected success/error response patterns
- Integration with the test-credential function

PLATFORM-SPECIFIC GUIDELINES:

**Gmail/Google Workspace**:
- Use service account authentication for organizational access
- Implement proper scope management (gmail.readonly, gmail.modify, etc.)
- Handle rate limiting (250 quota units per user per second)
- Support batch operations for efficiency

**Google Sheets**:
- Use A1 notation for cell references
- Implement proper range validation
- Handle concurrent access and conflicts
- Support both values and formulas

**Slack**:
- Use bot tokens for most operations
- Implement proper channel and user permission checks
- Handle rate limiting (1+ requests per minute per workspace)
- Support interactive components and slash commands

**Trello**:
- Use member tokens for user actions
- Implement proper board and card permission validation
- Support webhooks for real-time updates
- Handle attachment and custom field operations

**OpenAI**:
- Implement proper prompt engineering and token management
- Handle rate limiting and model availability
- Support streaming responses for long operations
- Implement cost tracking and budget controls

RESPONSE STYLE:
- Be comprehensive and actionable
- Provide specific, implementable configurations
- Include real API endpoints and parameters
- Explain the reasoning behind technical choices
- Anticipate potential issues and provide solutions
- Use clear, structured formatting for easy implementation

Always prioritize creating automations that are robust, secure, and production-ready. Your configurations should work immediately when implemented with the proper credentials and permissions.`

    // Training mode handling
    if (isTrainingMode && userId) {
      const trainingPrompt = baseSystemPrompt + dynamicInstructions + memoryContext + `

TRAINING MODE ACTIVE:
You are in training mode with an administrator. The user is providing you with instructions, feedback, or corrections. 

When you receive training input:
1. Acknowledge the instruction clearly
2. If it's a new rule or preference, create a new instruction entry
3. If it's feedback on your previous response, learn from it
4. Update your memory with any new patterns or solutions
5. Respond with understanding and confirm what you've learned

Remember: You should learn and adapt based on user feedback while maintaining your core automation expertise.

User training input: ${message}`

      // Call OpenAI with training prompt
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: trainingPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      const openAIData = await openAIResponse.json()
      const response = openAIData.choices[0]?.message?.content || 'I understand your training input.'

      // Store or update memory based on training
      const newMemoryEntry = {
        user_id: userId,
        conversation_context: { 
          training_input: message, 
          ai_response: response,
          timestamp: new Date().toISOString()
        },
        learned_patterns: { 
          training_topics: [message.substring(0, 100)],
          feedback_type: 'training'
        },
        successful_solutions: {
          training_acknowledged: true,
          response_generated: true
        },
        memory_type: 'training'
      }

      // Insert or update memory
      await supabaseClient
        .from('chat_ai_memory')
        .upsert(newMemoryEntry)

      // Check if we should create a new instruction based on the training
      if (message.toLowerCase().includes('rule') || 
          message.toLowerCase().includes('always') || 
          message.toLowerCase().includes('never') ||
          message.toLowerCase().includes('instruction')) {
        
        // Determine instruction type based on content
        let instructionType = 'user_preferences'
        if (message.toLowerCase().includes('platform') || message.toLowerCase().includes('api')) {
          instructionType = 'platform_rules'
        } else if (message.toLowerCase().includes('problem') || message.toLowerCase().includes('fix')) {
          instructionType = 'problem_solutions'
        } else if (message.toLowerCase().includes('behavior') || message.toLowerCase().includes('system')) {
          instructionType = 'system_behavior'
        }

        // Create new instruction
        await supabaseClient
          .from('chat_ai_instructions')
          .insert({
            instruction_type: instructionType,
            content: message,
            priority: 5, // Medium priority for user-generated instructions
            created_by: userId,
            is_active: true
          })
      }

      return new Response(JSON.stringify({ 
        response,
        training_acknowledged: true,
        memory_updated: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Regular automation mode (existing functionality enhanced with dynamic instructions)
    const enhancedSystemPrompt = baseSystemPrompt + dynamicInstructions + memoryContext

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    const openAIData = await openAIResponse.json()
    const response = openAIData.choices[0]?.message?.content

    // Update conversation memory for regular interactions
    if (userId) {
      const conversationMemory = {
        user_id: userId,
        conversation_context: {
          user_message: message,
          ai_response: response,
          timestamp: new Date().toISOString()
        },
        learned_patterns: {},
        successful_solutions: {},
        memory_type: 'conversation'
      }

      await supabaseClient
        .from('chat_ai_memory')
        .insert(conversationMemory)
    }

    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in chat-ai function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
