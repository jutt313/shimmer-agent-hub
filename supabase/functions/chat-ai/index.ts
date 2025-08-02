
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UNIVERSAL TEST CONFIG SYSTEM PROMPT - Works for ANY platform
const UNIVERSAL_TEST_CONFIG_SYSTEM_PROMPT = `You are a Universal Platform Integration Expert. Generate COMPLETE test configuration for ANY platform requested.

CRITICAL: You MUST respond with ONLY a JSON object containing these EXACT field names:

{
  "platform_name": "PlatformName",
  "base_url": "https://api.platform.com",
  "test_endpoint": {
    "method": "GET|POST|PUT|DELETE",
    "path": "/api/endpoint/path",
    "headers": {
      "Authorization": "Bearer {api_key}",
      "Content-Type": "application/json"
    },
    "query_params": {},
    "body": {}
  },
  "authentication": {
    "type": "bearer|api_key|oauth2|basic",
    "location": "header|query|body", 
    "parameter_name": "Authorization",
    "format": "Bearer {api_key}"
  },
  "expected_success_indicators": [
    "status_code_200",
    "response_has_data",
    "no_error_field"
  ],
  "expected_error_indicators": [
    "status_code_401",
    "error_field_present", 
    "invalid_credentials_message"
  ],
  "validation_rules": {
    "required_credentials": ["api_key"],
    "test_method": "authentication_check",
    "success_criteria": "valid_response_structure"
  },
  "field_mappings": {
    "api_key": "api_key"
  },
  "error_patterns": {
    "401": "Invalid or missing API credentials",
    "403": "Access denied - insufficient permissions",
    "429": "Rate limit exceeded"
  }
}

RULES:
1. ALWAYS use "expected_success_indicators" not "success_indicators"
2. ALWAYS use "expected_error_indicators" not "error_patterns" in main structure
3. ALWAYS include "validation_rules" object
4. Research the actual API endpoints for the platform
5. Use realistic authentication methods
6. Return ONLY the JSON object, no explanation text
7. Make the test endpoint simple (like /me, /user, /models, /info)`;

// UNIVERSAL AUTOMATION CREATION SYSTEM PROMPT
const ENFORCED_SYSTEM_PROMPT = `You are Universal Memory AI, a specialized automation expert for the YusrAI Platform.

CRITICAL COMPLIANCE REQUIREMENT: You MUST respond with BOTH human-readable text AND valid structured JSON. Non-compliance will result in response rejection.

MANDATORY RESPONSE FORMAT:

Provide a helpful explanation followed by this EXACT JSON structure:

\`\`\`json
{
  "summary": "Clear 2-3 line description of what this automation does (MANDATORY - never empty)",
  "steps": [
    "Step 1: Detailed specific action to take",
    "Step 2: Next concrete action with specifics", 
    "Step 3: Continue with actionable steps",
    "Step 4: Include at least 4-6 detailed steps"
  ],
  "platforms": [
    {
      "name": "Platform Name (Gmail, Slack, etc.)",
      "api_config": {
        "base_url": "https://api.platform.com (REAL URL REQUIRED)",
        "auth_type": "bearer_token|api_key|oauth|basic_auth",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "method_name": {
            "endpoint": "specific/endpoint/path",
            "http_method": "POST|GET|PUT|DELETE",
            "required_params": ["param1", "param2"],
            "optional_params": ["param3"],
            "example_request": {"key": "value"}
          }
        }
      },
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "Enter your API key here",
          "link": "https://platform.com/api-keys",
          "why_needed": "Required to authenticate API requests"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "SpecificAgentName",
      "role": "Detailed role description",
      "goal": "Specific objective this agent accomplishes",
      "rules": "Detailed operating principles",
      "memory": "Initial memory context",
      "why_needed": "Detailed explanation of why this agent is essential"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Detailed automation workflow description",
    "trigger": {
      "type": "manual|scheduled|webhook"
    },
    "steps": [
      {
        "id": "step_1",
        "name": "Descriptive Step Name",
        "type": "action",
        "action": {
          "integration": "platform_name",
          "method": "specific_method",
          "parameters": {},
          "platform_credential_id": "credential_reference"
        }
      }
    ],
    "variables": {}
  }
}
\`\`\`

CRITICAL RULES:
1. ALWAYS include human-readable explanation before JSON
2. NEVER respond without ALL required JSON fields filled completely
3. ALWAYS include at least 4-6 detailed steps
4. ALWAYS include complete platform API configurations
5. ALWAYS include detailed credential requirements
6. ALWAYS include specific AI agent recommendations
7. JSON must be valid and parseable

PENALTY WARNING: Incomplete responses will be rejected and retried automatically.`;

// Validation function for automation responses
const validateAutomationResponse = (response: any): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!response.summary || response.summary.trim().length < 15) {
    missing.push('summary (must be descriptive, 15+ characters)');
  }
  
  if (!response.steps || !Array.isArray(response.steps) || response.steps.length < 4) {
    missing.push('steps (must be array with at least 4 detailed steps)');
  }
  
  if (!response.platforms || !Array.isArray(response.platforms) || response.platforms.length === 0) {
    missing.push('platforms (must include at least one platform with API config)');
  } else {
    response.platforms.forEach((platform: any, index: number) => {
      if (!platform.credentials || platform.credentials.length === 0) {
        missing.push(`platforms[${index}].credentials`);
      }
      if (!platform.api_config || !platform.api_config.base_url || !platform.api_config.methods) {
        missing.push(`platforms[${index}].api_config (must include base_url and methods)`);
      }
    });
  }
  
  if (!response.agents || !Array.isArray(response.agents) || response.agents.length === 0) {
    missing.push('agents (must include at least one AI agent)');
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// UNIVERSAL TEST CONFIG VALIDATION
const validateUniversalTestConfig = (config: any): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!config) {
    return { isValid: false, missing: ['Complete test configuration missing'] };
  }
  
  // Check all required fields with EXACT names expected by DynamicConfigValidator
  if (!config.platform_name) missing.push('platform_name');
  if (!config.base_url) missing.push('base_url');
  if (!config.test_endpoint) missing.push('test_endpoint');
  if (!config.authentication) missing.push('authentication');
  if (!config.expected_success_indicators || !Array.isArray(config.expected_success_indicators)) {
    missing.push('expected_success_indicators (must be array)');
  }
  if (!config.expected_error_indicators || !Array.isArray(config.expected_error_indicators)) {
    missing.push('expected_error_indicators (must be array)');
  }
  if (!config.validation_rules || typeof config.validation_rules !== 'object') {
    missing.push('validation_rules (must be object)');
  }
  
  // Validate test_endpoint structure
  if (config.test_endpoint) {
    if (!config.test_endpoint.method) missing.push('test_endpoint.method');
    if (!config.test_endpoint.path) missing.push('test_endpoint.path');
    if (!config.test_endpoint.headers) missing.push('test_endpoint.headers');
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, category = null, userRole = 'user', context = 'general', requestType = null, platformName = null } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // UNIVERSAL TEST CONFIG DETECTION - Works for ANY platform
    const isTestConfigRequest = requestType === 'test_config_generation' || 
                              requestType === 'dynamic_test_config' || 
                              requestType?.includes('test_config') ||
                              context === 'test_config_generation' ||
                              message.toLowerCase().includes('generate test configuration') ||
                              message.toLowerCase().includes('test config');

    console.log(`🔍 UNIVERSAL REQUEST ANALYSIS:`, {
      requestType,
      context,
      platformName,
      isTestConfigRequest,
      message: message.substring(0, 100) + '...'
    });

    // UNIVERSAL TEST CONFIG GENERATION - No hardcoded platform limitations
    if (isTestConfigRequest && platformName) {
      console.log(`🤖 UNIVERSAL TEST CONFIG: Generating for ${platformName} (ANY platform supported)`);
      
      let attempts = 0;
      let finalTestConfig = null;
      
      while (attempts < 3 && !finalTestConfig) {
        console.log(`🔄 Universal test config attempt ${attempts + 1} for ${platformName}`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: UNIVERSAL_TEST_CONFIG_SYSTEM_PROMPT
              },
              { 
                role: 'user', 
                content: `Generate complete test configuration for ${platformName} platform. Include all required fields with exact field names: platform_name, base_url, test_endpoint, authentication, expected_success_indicators, expected_error_indicators, validation_rules, field_mappings, error_patterns.`
              }
            ],
            max_tokens: 2000,
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let aiResponse = data.choices[0].message.content;

        try {
          // Parse the AI-generated test config
          let testConfig;
          if (aiResponse.includes('{') && aiResponse.includes('}')) {
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              testConfig = JSON.parse(jsonMatch[0]);
            } else {
              testConfig = JSON.parse(aiResponse);
            }
          } else {
            throw new Error('No valid JSON found in AI response');
          }

          // UNIVERSAL VALIDATION - Works for any platform
          const validation = validateUniversalTestConfig(testConfig);
          
          if (validation.isValid) {
            console.log(`✅ UNIVERSAL TEST CONFIG: Generated valid config for ${platformName}`);
            finalTestConfig = testConfig;
            break;
          } else {
            console.log(`❌ UNIVERSAL TEST CONFIG: Validation failed for ${platformName}`, validation.missing);
            attempts++;
          }
        } catch (parseError) {
          console.log(`❌ UNIVERSAL TEST CONFIG: Parse error for ${platformName}`, parseError);
          attempts++;
        }
      }

      if (finalTestConfig) {
        // Return the test config directly as object, not JSON string
        return new Response(JSON.stringify({ 
          response: finalTestConfig,
          universal_test_config: true,
          platform: platformName,
          ai_generated: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`❌ UNIVERSAL TEST CONFIG: Failed to generate valid config for ${platformName} after 3 attempts`);
        return new Response(JSON.stringify({ 
          error: `Failed to generate valid test configuration for ${platformName}`,
          universal_test_config: false
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // REGULAR AUTOMATION CREATION - Enhanced context
    console.log('🚀 YusrAI Chat AI processing automation request:', message.substring(0, 100));

    // Get enhanced context from knowledge store
    const { data: knowledgeData } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%`)
      .order('usage_count', { ascending: false })
      .limit(5);

    let knowledgeContext = '';
    if (knowledgeData && knowledgeData.length > 0) {
      knowledgeContext = `\n\nEXISTING KNOWLEDGE:\n${knowledgeData.map(k => 
        `- ${k.title}: ${k.summary}\n  Solution: ${k.details?.solution || 'No solution recorded'}`
      ).join('\n')}`;
    }

    const platformContext = `\nPlatform Context: User is ${userRole}. Provide comprehensive automation solutions.`;

    // Retry mechanism for compliance
    let attempts = 0;
    let finalResponse = '';
    
    while (attempts < 3) {
      console.log(`📤 Sending request to OpenAI with enhanced structured prompt`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: ENFORCED_SYSTEM_PROMPT + platformContext + knowledgeContext
            },
            { 
              role: 'user', 
              content: message 
            }
          ],
          max_tokens: 4000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let aiResponse = data.choices[0].message.content;

      // Extract and validate JSON from response
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        try {
          const parsedJSON = JSON.parse(jsonMatch[1]);
          const validation = validateAutomationResponse(parsedJSON);
          
          if (validation.isValid) {
            console.log('✅ YusrAI response prepared with validated structured content');
            finalResponse = aiResponse;
            break;
          } else {
            console.log(`❌ Automation response validation failed. Missing: ${validation.missing.join(', ')}`);
            attempts++;
            
            if (attempts < 3) {
              const retryMessage = `${message}\n\nYour previous response was incomplete. REQUIRED: ${validation.missing.join(', ')}. Provide COMPLETE response with ALL required fields filled with detailed information.`;
              message = retryMessage;
            }
          }
        } catch (e) {
          console.log('Failed to parse JSON from automation response');
          attempts++;
        }
      } else {
        console.log('No JSON found in automation response');
        attempts++;
      }
      
      if (attempts >= 3) {
        finalResponse = aiResponse;
      }
    }

    // Clean response
    finalResponse = finalResponse.replace(/[%&'*]/g, '').trim();

    console.log('📥 OpenAI response received:', finalResponse.substring(0, 200) + '...');

    // Update usage count for used knowledge
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

    // Try to save successful interactions to knowledge store
    try {
      await supabase
        .from('chat_ai_conversations')
        .insert({
          user_message: message.substring(0, 1000),
          ai_response: finalResponse.substring(0, 2000),
          context: context || 'automation_creation',
          user_role: userRole,
          success: true
        });
    } catch (error) {
      console.log('Database save error:', error);
    }

    return new Response(JSON.stringify({ 
      response: finalResponse,
      yusrai_powered: true,
      universal_ai_system: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
