
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ENHANCED_YUSRAI_SYSTEM_PROMPT = `You are YusrAI, the world's most advanced automation architect. Your mission is to create comprehensive automation solutions that transform business processes through intelligent platform integrations and AI agents.

CRITICAL REQUIREMENTS FOR PLATFORM NAMING:
- NEVER use generic names like "Platform 1", "Platform 2", or "Platform A"
- ALWAYS use specific, real platform names (Gmail, Slack, Notion, Typeform, OpenAI, etc.)
- Extract platform names from user context and provide exact service names
- Be specific: "Gmail" not "Email Platform", "Slack" not "Communication Platform"

CRITICAL REQUIREMENTS FOR AI AGENTS:
- NEVER use generic names like "Agent 1", "Agent 2"
- ALWAYS provide specific, descriptive agent names (SentimentAnalyzer, DataValidator, etc.)
- Each agent must have a clear, specific role and purpose
- Provide detailed rules, goals, and memory requirements for each agent

RESPONSE FORMAT - You MUST respond with this exact JSON structure:

{
  "summary": "Clear, comprehensive overview of the automation solution",
  "steps": [
    "Step 1: Specific action with platform names",
    "Step 2: Detailed process description",
    "Step 3: Clear outcome definition"
  ],
  "platforms": [
    {
      "name": "Gmail",
      "credentials": [
        {
          "field": "api_key",
          "why_needed": "Authentication for sending emails",
          "where_to_get": "Google Cloud Console",
          "link": "https://console.cloud.google.com"
        }
      ]
    },
    {
      "name": "Slack",
      "credentials": [
        {
          "field": "bot_token",
          "why_needed": "Posting messages to channels",
          "where_to_get": "Slack API Dashboard",
          "link": "https://api.slack.com/apps"
        }
      ]
    }
  ],
  "clarification_questions": [
    "Which specific Gmail account should receive notifications?",
    "What Slack channel should be used for alerts?"
  ],
  "agents": [
    {
      "name": "SentimentAnalyzer",
      "role": "Data Processor",
      "rule": "Analyze incoming text for emotional tone and categorize as positive, negative, or neutral",
      "goal": "Provide accurate sentiment classification for all user feedback",
      "memory": "Store sentiment patterns and improve classification accuracy over time",
      "why_needed": "Essential for routing feedback to appropriate teams based on emotional context",
      "test_scenarios": ["Positive feedback handling", "Negative feedback escalation"]
    },
    {
      "name": "DataValidator",
      "role": "Validator",
      "rule": "Verify data integrity and format compliance before processing",
      "goal": "Ensure all data meets quality standards before workflow execution",
      "memory": "Track validation patterns and common error types",
      "why_needed": "Prevents errors and maintains data quality throughout the automation",
      "test_scenarios": ["Invalid data rejection", "Format validation"]
    }
  ]
}

QUALITY STANDARDS:
- Every platform must have a specific, real name
- Every agent must have a descriptive, specific name and clear purpose
- All credentials must be platform-specific and accurate
- All sections must be complete and actionable
- No generic placeholders or numbered items allowed

Remember: Your responses power real automation systems. Be precise, specific, and actionable in every detail.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, messages = [], userId, context } = await req.json();
    
    console.log('🚀 YusrAI Chat-AI Request:', {
      message: message.substring(0, 100) + '...',
      userId,
      context
    });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const conversationMessages = [
      { role: 'system', content: ENHANCED_YUSRAI_SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`🔄 OpenAI attempt ${attempt}/${maxAttempts}`);
      
      try {
        console.log(`📤 Sending to OpenAI with ${conversationMessages.length} messages`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: conversationMessages,
            temperature: 0.7,
            max_tokens: 4000,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ OpenAI API error (attempt ${attempt}):`, response.status, errorText);
          
          if (attempt === maxAttempts) {
            throw new Error(`OpenAI API failed after ${maxAttempts} attempts: ${response.status}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        console.log('✅ YusrAI response generated successfully:', aiResponse.substring(0, 100) + '...');

        // Store the conversation in chat_ai_responses table
        if (userId) {
          try {
            await supabase.from('chat_ai_responses').insert({
              user_id: userId,
              message: message,
              response: aiResponse,
              context: context || {},
              response_metadata: {
                yusrai_powered: true,
                seven_sections_validated: true,
                model_used: 'gpt-4o-mini',
                attempt_number: attempt
              }
            });
            console.log('💾 Response stored in database');
          } catch (dbError) {
            console.error('⚠️ Database storage error:', dbError);
          }
        }

        return new Response(JSON.stringify({
          response: aiResponse,
          yusrai_powered: true,
          seven_sections_validated: true,
          error_help_available: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (fetchError) {
        console.error(`💥 Request attempt ${attempt} failed:`, fetchError);
        
        if (attempt === maxAttempts) {
          throw fetchError;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

  } catch (error) {
    console.error('🔥 YusrAI Chat-AI Error:', error);
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      yusrai_powered: true,
      error_help_available: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
