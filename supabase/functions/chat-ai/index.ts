
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

// STRICT JSON SCHEMA FOR AUTOMATION BLUEPRINT VALIDATION
const AUTOMATION_BLUEPRINT_SCHEMA = {
  type: "object",
  required: ["summary", "steps", "platforms", "agents", "automation_blueprint"],
  properties: {
    summary: { type: "string", minLength: 10 },
    steps: {
      type: "array",
      minItems: 1,
      items: { type: "string", minLength: 5 }
    },
    platforms: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "credentials"],
        properties: {
          name: { type: "string", minLength: 1 },
          credentials: {
            type: "array",
            items: {
              type: "object",
              required: ["field", "placeholder", "link", "why_needed"],
              properties: {
                field: { type: "string", minLength: 1 },
                placeholder: { type: "string", minLength: 1 },
                link: { type: "string", minLength: 1 },
                why_needed: { type: "string", minLength: 1 }
              }
            }
          }
        }
      }
    },
    agents: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "role", "goal", "rules", "memory", "why_needed"],
        properties: {
          name: { type: "string", minLength: 1 },
          role: { type: "string", minLength: 10 },
          goal: { type: "string", minLength: 10 },
          rules: { type: "string", minLength: 10 },
          memory: { type: "string", minLength: 10 },
          why_needed: { type: "string", minLength: 10 }
        }
      }
    },
    automation_blueprint: {
      type: "object",
      required: ["version", "description", "trigger", "steps"],
      properties: {
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        description: { type: "string", minLength: 10 },
        trigger: {
          type: "object",
          required: ["type"],
          properties: {
            type: { type: "string", enum: ["manual", "scheduled", "webhook", "event"] }
          }
        },
        steps: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["id", "name", "type"],
            properties: {
              id: { type: "string", minLength: 1 },
              name: { type: "string", minLength: 1 },
              type: { type: "string", enum: ["action", "condition", "loop", "delay", "ai_agent_call"] }
            }
          }
        }
      }
    }
  }
}

// JSON SCHEMA VALIDATOR
function validateAutomationBlueprint(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  function validateObject(obj: any, schema: any, path: string = ''): void {
    if (typeof obj !== 'object' || obj === null) {
      errors.push(`${path}: Expected object, got ${typeof obj}`);
      return;
    }
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj)) {
          errors.push(`${path}.${field}: Required field missing`);
        }
      }
    }
    
    // Validate properties
    if (schema.properties) {
      for (const [key, value] of Object.entries(obj)) {
        const fieldSchema = schema.properties[key];
        if (fieldSchema) {
          validateField(value, fieldSchema, `${path}.${key}`);
        }
      }
    }
  }
  
  function validateField(value: any, schema: any, path: string): void {
    if (schema.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${path}: Expected string, got ${typeof value}`);
      } else if (schema.minLength && value.length < schema.minLength) {
        errors.push(`${path}: String too short (min ${schema.minLength})`);
      } else if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push(`${path}: String doesn't match pattern ${schema.pattern}`);
      } else if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${path}: Invalid enum value. Expected one of: ${schema.enum.join(', ')}`);
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${path}: Expected array, got ${typeof value}`);
      } else {
        if (schema.minItems && value.length < schema.minItems) {
          errors.push(`${path}: Array too short (min ${schema.minItems})`);
        }
        if (schema.items) {
          value.forEach((item, index) => {
            validateField(item, schema.items, `${path}[${index}]`);
          });
        }
      }
    } else if (schema.type === 'object') {
      validateObject(value, schema, path);
    }
  }
  
  validateObject(data, schema);
  return { valid: errors.length === 0, errors };
}

// AI RETRY LOGIC WITH FEEDBACK
async function generateBlueprintWithRetry(messages: any[], maxRetries: number = 3): Promise<any> {
  let lastError = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🤖 Blueprint generation attempt ${attempt}/${maxRetries}`);
    
    try {
      // Enhanced system prompt with strict requirements
      const systemPrompt = `You are YusrAI, the world's most advanced automation architect. You MUST return ONLY valid JSON that exactly matches this schema.

CRITICAL: Your response must be PURE JSON with NO markdown, NO explanations, NO code blocks. ONLY the JSON object.

REQUIRED JSON STRUCTURE (every field is mandatory):
{
  "summary": "3-4 line comprehensive description of automation workflow",
  "steps": ["Step 1: detailed action", "Step 2: next action", "..."],
  "platforms": [{
    "name": "ExactPlatformName",
    "credentials": [{
      "field": "api_key",
      "placeholder": "sk-...",
      "link": "https://platform.com/api-keys",
      "why_needed": "Required for API authentication"
    }]
  }],
  "agents": [{
    "name": "SpecificAgentName",
    "role": "Detailed role description minimum 10 characters",
    "goal": "Specific measurable objective minimum 10 characters", 
    "rules": "Detailed operating rules minimum 10 characters",
    "memory": "Initial memory context minimum 10 characters",
    "why_needed": "Why this agent is critical minimum 10 characters"
  }],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Technical automation workflow minimum 10 characters",
    "trigger": {"type": "manual"},
    "steps": [{
      "id": "step_1",
      "name": "Action Name",
      "type": "action"
    }]
  }
}

${lastError ? `PREVIOUS ERROR TO FIX: ${lastError}` : ''}

Return ONLY the JSON object. No explanations.`;

      const openaiMessages = [
        { role: "system", content: systemPrompt },
        ...messages
      ];

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14', // TOP OPENAI MODEL
          messages: openaiMessages,
          max_tokens: 4000,
          temperature: 0.1, // Low temperature for consistency
          response_format: { type: "json_object" }
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      const aiResponse = openaiData.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Parse and validate JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (parseError) {
        lastError = `JSON parsing failed: ${parseError.message}. Response was not valid JSON.`;
        console.error(`❌ Attempt ${attempt} - JSON Parse Error:`, parseError);
        continue;
      }

      // Validate against schema
      const validation = validateAutomationBlueprint(parsedResponse);
      if (!validation.valid) {
        lastError = `Schema validation failed: ${validation.errors.join(', ')}`;
        console.error(`❌ Attempt ${attempt} - Validation Errors:`, validation.errors);
        continue;
      }

      console.log(`✅ Attempt ${attempt} - Blueprint generated successfully!`);
      return parsedResponse;

    } catch (error: any) {
      lastError = `Generation error: ${error.message}`;
      console.error(`❌ Attempt ${attempt} - Generation Error:`, error);
    }
  }

  // If all attempts failed, return fallback
  console.error('🚨 All blueprint generation attempts failed, returning fallback');
  return {
    summary: "Blueprint generation failed after multiple attempts. Please try again with more specific details.",
    steps: ["Please provide more detailed automation requirements"],
    platforms: [],
    agents: [{
      name: "ErrorRecoveryAgent",
      role: "Handles blueprint generation failures",
      goal: "Recover from generation errors gracefully",
      rules: "Provide helpful error messages and suggestions",
      memory: "Remember failed generation attempts",
      why_needed: "Essential for error recovery and user guidance"
    }],
    automation_blueprint: {
      version: "1.0.0",
      description: "Fallback blueprint due to generation failure",
      trigger: { type: "manual" },
      steps: [{
        id: "error_step",
        name: "Generation Failed",
        type: "action"
      }]
    },
    clarification_questions: ["Could you please rephrase your automation request?"],
    conversation_updates: {
      platform_changes: "No changes due to generation failure",
      context_acknowledged: "Generation failed",
      knowledge_applied: "Error recovery patterns",
      response_saved: "Fallback response"
    },
    is_update: false,
    recheck_status: "generation_failed"
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Processing chat request with UPGRADED AI MODEL (gpt-4.1-2025-04-14)')
    
    const { message, messages = [], automationId, automationContext } = await req.json()
    
    if (!message) {
      throw new Error('Message is required')
    }

    // Get knowledge from store for context
    const { data: knowledgeData } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .or(`title.ilike.%${message}%,summary.ilike.%${message}%,details->>solution.ilike.%${message}%`)
      .order('usage_count', { ascending: false })
      .limit(5);

    let knowledgeContext = '';
    if (knowledgeData && knowledgeData.length > 0) {
      knowledgeContext = `\n\nRELEVANT KNOWLEDGE:\n${knowledgeData.map(k => 
        `- ${k.title}: ${k.summary}`
      ).join('\n')}`;
    }

    // Prepare messages for OpenAI
    const openaiMessages = [
      ...messages.map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text || msg.message_content || ""
      })),
      { role: "user", content: message + knowledgeContext }
    ];

    console.log('📡 Making request to TOP OpenAI model (gpt-4.1-2025-04-14)...')

    // Generate blueprint with retry logic
    const structuredResponse = await generateBlueprintWithRetry(openaiMessages);

    console.log('✅ Blueprint generated successfully with validation')
    
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

  } catch (error) {
    console.error('💥 Error in chat-ai function:', error)
    
    const errorResponse = {
      summary: "I encountered an error while processing your request. Please try again.",
      steps: ["Please rephrase your automation request"],
      platforms: [],
      agents: [{
        name: "ErrorHandler",
        role: "Handles system errors gracefully",
        goal: "Provide helpful error recovery",
        rules: "Always be helpful and informative",
        memory: "Remember error context",
        why_needed: "Essential for error recovery"
      }],
      automation_blueprint: {
        version: "1.0.0",
        description: "Error recovery workflow",
        trigger: { type: "manual" },
        steps: [{
          id: "error_recovery",
          name: "Handle Error",
          type: "action"
        }]
      },
      clarification_questions: ["Could you please try again?"],
      conversation_updates: {
        platform_changes: "No changes due to error",
        context_acknowledged: "Error occurred",
        knowledge_applied: "Error handling patterns",
        response_saved: "Error response"
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
