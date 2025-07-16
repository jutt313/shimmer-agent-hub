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

    const { message, isTrainingMode = false, userId = null } = await req.json()

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

    // Original system prompt (kept unchanged)
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

KEY CAPABILITIES:

**Platform Knowledge**: You understand the specific requirements, APIs, authentication methods, and best practices for hundreds of platforms. Always provide platform-specific guidance that accounts for real-world API limitations and requirements.

**Authentication Expertise**: You know the exact authentication methods for each platform:
- OAuth 2.0 flows and token management
- API key authentication and header formats
- Service account authentication
- Personal access tokens and their scopes
- Webhook authentication and signature verification

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
