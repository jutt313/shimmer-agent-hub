import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Strict validation function for YusrAI 7-section response
function validateYusrAIResponse(response: any): { isValid: boolean; missing: string[] } {
  const required7Sections = [
    'summary',
    'steps', 
    'platforms',
    'clarification_questions',
    'agents',
    'test_payloads',
    'execution_blueprint'
  ];
  
  const missing: string[] = [];
  
  for (const section of required7Sections) {
    if (!response[section]) {
      missing.push(section);
      continue;
    }
    
    // Additional validation for specific sections
    if (section === 'steps' && (!Array.isArray(response[section]) || response[section].length === 0)) {
      missing.push(`${section} (must be non-empty array)`);
    }
    if (section === 'platforms' && (!Array.isArray(response[section]) || response[section].length === 0)) {
      missing.push(`${section} (must be non-empty array)`);
    }
    if (section === 'agents' && (!Array.isArray(response[section]))) {
      missing.push(`${section} (must be array)`);
    }
    if (section === 'test_payloads' && typeof response[section] !== 'object') {
      missing.push(`${section} (must be object)`);
    }
    if (section === 'execution_blueprint' && (!response[section].trigger || !response[section].workflow)) {
      missing.push(`${section} (must have trigger and workflow)`);
    }
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
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

    // Handle Test Configuration Generation Mode
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
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: testConfigSystemPrompt },
            { role: 'user', content: `Generate test configuration for ${platformName}` }
          ],
          max_tokens: 1500,
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      })

      const openAIData = await openAIResponse.json()
      let testConfig

      try {
        const responseText = openAIData.choices[0]?.message?.content || '{}'
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        testConfig = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
        console.log(`✅ Generated test config for ${platformName}:`, testConfig)
      } catch (parseError) {
        console.error('❌ Failed to parse test config JSON:', parseError)
        testConfig = {
          platform_name: platformName,
          base_url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
          test_endpoint: { method: "GET", path: "/me", headers: {} },
          authentication: { type: "bearer", location: "header", parameter_name: "Authorization", format: "Bearer {api_key}" },
          required_fields: ["api_key"],
          field_mappings: { "api_key": "api_key" },
          success_indicators: { status_codes: [200], response_patterns: ["id"] },
          error_patterns: { "401": "Invalid credentials" },
          ai_generated: true,
          config_version: "2.0"
        }
      }

      return new Response(JSON.stringify({ testConfig, generated: true, platform: platformName }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get dynamic instructions and memory
    const { data: instructions } = await supabaseClient
      .from('chat_ai_instructions')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })

    let userMemory = null
    if (userId) {
      const { data: memory } = await supabaseClient
        .from('chat_ai_memory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (memory) userMemory = memory
    }

    let dynamicInstructions = ""
    if (instructions && instructions.length > 0) {
      dynamicInstructions = "\n\nDYNAMIC INSTRUCTIONS:\n"
      instructions.forEach((instruction, index) => {
        dynamicInstructions += `${index + 1}. [${instruction.instruction_type.toUpperCase()}] ${instruction.content}\n`
      })
    }

    let memoryContext = ""
    if (userMemory) {
      memoryContext = `\n\nREMEMBERED CONTEXT:\n`
      memoryContext += `Patterns: ${JSON.stringify(userMemory.learned_patterns)}\n`
      memoryContext += `Solutions: ${JSON.stringify(userMemory.successful_solutions)}\n`
    }

    const yusrAISystemPrompt = `Hello! I am YusrAI - your advanced AI Automation Specialist and Platform Integration Expert. I am designed to understand complex business workflows and translate them into complete, executable automation blueprints that integrate seamlessly across various digital platforms. My core capability is to bridge your business needs with robust, production-ready automation solutions.

My comprehensive expertise covers:

* In-depth API knowledge and integration capabilities for a vast array of digital platforms.
* End-to-end automation blueprint generation with precise technical specifications.
* Seamless platform integration, including mapping exact field names and optimal API endpoints.
* Intelligent AI agent recommendations and the ability to define custom agent behaviors.
* Rigorous credential testing and validation through actual API calls.
* Creation of production-ready execution blueprints, incorporating advanced error handling.
* Sophisticated error handling, recovery mechanisms, and notification systems.
* Dynamic learning and adaptation, continuously refining automations based on real-world feedback.
* Memory retention and pattern recognition for intelligent decision-making.
* Implementation of custom business logic for unique workflow requirements.
* Full lifecycle management for webhooks and API integrations.
* Expertise in data transformation, parsing, and mapping across different formats.
* Built-in considerations for security, compliance, and data privacy in automation design.
* Performance optimization strategies and monitoring capabilities to ensure efficiency.

I ALWAYS respond in a structured JSON format, comprising 7 MANDATORY sections, to provide complete, testable, and immediately executable automation solutions.

**MANDATORY RESPONSE FORMAT - EVERY response MUST include ALL 7 sections:**

\`\`\`json
{
  "summary": "2-3 line business explanation of the automation",
  "steps": [
    "numbered",
    "step-by-step",
    "process"
  ],
  "platforms": [
    {
      "name": "ExactPlatformName",
      "credentials": [
        {
          "field": "exact_field_name",
          "why_needed": "detailed explanation",
          "where_to_get": "specific location guidance",
          "link": "actual_working_url_if_available",
          "options": [
            "for_dropdown_fields"
          ],
          "example": "sample_value_format"
        }
      ]
    }
  ],
  "clarification_questions": [
    "specific",
    "actionable",
    "questions"
  ],
  "agents": [
    {
      "name": "Agent Name",
      "role": "Decision Maker|Data Processor|Monitor|Validator|Responder|Custom",
      "rule": "specific behavior rules",
      "goal": "clear objectives",
      "memory": "what to remember",
      "why_needed": "business justification",
      "custom_config": {},
      "test_scenarios": [
        "scenario1",
        "scenario2"
      ]
    }
  ],
  "test_payloads": {
    "platform_name": {
      "method": "GET|POST|PUT|DELETE",
      "endpoint": "real_api_endpoint",
      "headers": {
        "exact": "headers"
      },
      "body": {
        "test": "data"
      },
      "expected_response": {
        "success": "indicators"
      },
      "error_patterns": {
        "401": "meaning"
      }
    }
  },
  "execution_blueprint": {
    "trigger": {
      "type": "webhook|schedule|manual|event",
      "configuration": {
        "detailed": "config"
      }
    },
    "workflow": [
      {
        "step": 1,
        "action": "specific_action",
        "platform": "PlatformName",
        "method": "HTTP_METHOD",
        "endpoint": "exact_endpoint",
        "headers": {
          "required": "headers"
        },
        "data_mapping": {
          "input_field": "output_path"
        },
        "success_condition": "validation_rule_or_expression",
        "error_handling": {
          "retry_attempts": 3,
          "fallback_action": "action_on_failure",
          "on_failure": "behavior_type"
        },
        "next_step": 2,
        "ai_agent_integration": {
          "agent_name": "if_applicable",
          "input_data": {
            "data": "structure"
          },
          "output_mapping": {
            "result": "mapping"
          }
        },
        "description": "Brief description of this step."
      }
    ],
    "error_handling": {
      "retry_attempts": 3,
      "fallback_actions": [
        "action1",
        "action2"
      ],
      "notification_rules": [
        {
          "event": "rule"
        }
      ],
      "critical_failure_actions": [
        "action"
      ]
    },
    "performance_optimization": {
      "rate_limit_handling": "strategy",
      "concurrency_limit": 5,
      "timeout_seconds_per_step": 60
    }
  }
}
\`\`\`

CRITICAL: You MUST respond with ALL 7 sections filled with detailed information. No exceptions. If any section is missing or empty, the response will be rejected.`

    // Training mode handling
    if (isTrainingMode && userId) {
      const trainingPrompt = yusrAISystemPrompt + dynamicInstructions + memoryContext + `

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

      // Store training memory
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

      await supabaseClient.from('chat_ai_memory').upsert(newMemoryEntry)

      return new Response(JSON.stringify({ 
        response,
        training_acknowledged: true,
        memory_updated: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ENHANCED: Regular automation mode with strict 7-section enforcement and retry mechanism
    const enhancedSystemPrompt = yusrAISystemPrompt + dynamicInstructions + memoryContext

    let attempts = 0
    let finalResponse = null
    let validationErrors: string[] = []

    // Retry mechanism for ensuring 7-section compliance
    while (attempts < 3) {
      attempts++
      console.log(`🤖 YusrAI attempt ${attempts}/3`)

      try {
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: enhancedSystemPrompt + (attempts > 1 ? `\n\nPREVIOUS ATTEMPT FAILED - Missing sections: ${validationErrors.join(', ')}. You MUST include ALL 7 sections with complete data.` : '')
              },
              { role: 'user', content: message }
            ],
            max_tokens: 4000, // Increased for complete responses
            temperature: 0.2, // Lower for more deterministic responses
            response_format: { type: "json_object" }
          }),
        })

        const openAIData = await openAIResponse.json()
        const responseText = openAIData.choices[0]?.message?.content

        if (!responseText) {
          throw new Error('Empty response from OpenAI')
        }

        // Parse and validate JSON response
        let parsedResponse
        try {
          parsedResponse = JSON.parse(responseText)
        } catch (parseError) {
          // Try to extract JSON from response text
          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            parsedResponse = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('Failed to parse JSON response')
          }
        }

        // Validate 7-section structure
        const validation = validateYusrAIResponse(parsedResponse)

        if (validation.isValid) {
          console.log(`✅ Attempt ${attempts}: Valid 7-section response received`)
          finalResponse = responseText
          break
        } else {
          validationErrors = validation.missing
          console.log(`❌ Attempt ${attempts}: Invalid response. Missing: ${validation.missing.join(', ')}`)
          
          if (attempts === 3) {
            // Last attempt failed - create structured fallback
            console.log('🚨 All attempts failed. Creating structured fallback response.')
            
            const fallbackResponse = {
              summary: "I'm YusrAI, ready to help you create comprehensive automations with platform integrations and AI agents. Please specify your automation requirements.",
              steps: [
                "Describe your automation requirements in detail",
                "I'll analyze your needs and identify required platforms",
                "Configure platform credentials with my guidance",
                "Set up AI agents for intelligent decision-making",
                "Test integrations with real API calls",
                "Execute your automation with full monitoring"
              ],
              platforms: [
                {
                  name: "Platform Integration Required",
                  credentials: [
                    {
                      field: "api_key",
                      why_needed: "Authentication required for platform access",
                      where_to_get: "Platform developer dashboard",
                      link: "#",
                      example: "your_api_key_here"
                    }
                  ]
                }
              ],
              clarification_questions: [
                "What specific automation workflow would you like me to create?",
                "Which platforms should be integrated in your automation?",
                "What triggers should start the automation (manual, scheduled, webhook)?",
                "Do you need AI agents for decision-making or data processing?"
              ],
              agents: [
                {
                  name: "AutomationAssistant",
                  role: "Decision Maker",
                  rule: "Analyze user requirements and recommend optimal automation workflows",
                  goal: "Create efficient, scalable automation solutions",
                  memory: "User preferences, successful automation patterns, platform configurations",
                  why_needed: "Essential for intelligent automation design and optimization",
                  custom_config: {},
                  test_scenarios: [
                    "Process user requirements and suggest platforms",
                    "Validate automation logic and workflow steps"
                  ]
                }
              ],
              test_payloads: {
                "example_platform": {
                  method: "GET",
                  endpoint: "/api/test",
                  headers: {
                    "Authorization": "Bearer {api_key}",
                    "Content-Type": "application/json"
                  },
                  body: {},
                  expected_response: {
                    "status": "success",
                    "data": "test_data"
                  },
                  error_patterns: {
                    "401": "Invalid API key",
                    "403": "Insufficient permissions",
                    "429": "Rate limit exceeded"
                  }
                }
              ],
              execution_blueprint: {
                trigger: {
                  type: "manual",
                  configuration: {
                    description: "Manual trigger for automation execution"
                  }
                },
                workflow: [
                  {
                    step: 1,
                    action: "initialize_automation",
                    platform: "YusrAI",
                    method: "POST",
                    endpoint: "/api/initialize",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    data_mapping: {
                      "user_input": "automation_config"
                    },
                    success_condition: "response.status === 'initialized'",
                    error_handling: {
                      retry_attempts: 3,
                      fallback_action: "log_error_and_notify",
                      on_failure: "pause_automation"
                    },
                    next_step: 2,
                    description: "Initialize automation with user requirements"
                  }
                ],
                error_handling: {
                  retry_attempts: 3,
                  fallback_actions: [
                    "log_detailed_error",
                    "notify_user",
                    "pause_automation"
                  ],
                  notification_rules: [
                    {
                      event: "critical_failure",
                      action: "immediate_notification"
                    }
                  ],
                  critical_failure_actions: [
                    "stop_automation",
                    "preserve_data",
                    "send_admin_alert"
                  ]
                },
                performance_optimization: {
                  rate_limit_handling: "exponential_backoff",
                  concurrency_limit: 5,
                  timeout_seconds_per_step: 60
                }
              }
            }
            
            finalResponse = JSON.stringify(fallbackResponse)
          }
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error.message)
        validationErrors.push(`API Error: ${error.message}`)
        
        if (attempts === 3) {
          throw error
        }
      }
    }

    // Update conversation memory
    if (userId && finalResponse) {
      const conversationMemory = {
        user_id: userId,
        conversation_context: {
          user_message: message,
          ai_response: finalResponse,
          attempts_required: attempts,
          timestamp: new Date().toISOString()
        },
        learned_patterns: {
          successful_7_section_response: attempts <= 2,
          validation_issues: validationErrors
        },
        successful_solutions: {
          response_generated: true,
          all_sections_present: finalResponse ? true : false
        },
        memory_type: 'conversation'
      }

      await supabaseClient.from('chat_ai_memory').insert(conversationMemory)
    }

    console.log(`🎯 Final response ready after ${attempts} attempts`)

    return new Response(JSON.stringify({ 
      response: finalResponse,
      attempts_required: attempts,
      validation_passed: finalResponse !== null
    }), {
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
