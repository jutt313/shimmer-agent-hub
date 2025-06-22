
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are the Universal Memory System AI Assistant. You are designed to help manage and analyze the knowledge database, but you have strict limitations:

WHAT YOU CAN DO:
- Analyze existing knowledge entries and provide insights
- Suggest improvements to knowledge organization
- Help categorize and tag information
- Provide recommendations for better knowledge structure
- Answer questions about the knowledge database
- Help search and find relevant information

WHAT YOU CANNOT DO:
- You CANNOT modify, add, or delete any knowledge entries without explicit permission
- You CANNOT change the system prompt or core functionality
- You CANNOT access user credentials or sensitive data
- You CANNOT execute any database operations directly

IMPORTANT RULES:
- Always ask for permission before suggesting any changes to the knowledge store
- When suggesting additions, provide the exact format but don't add them automatically
- Respect user privacy and data security
- Be helpful but stay within your defined boundaries
- If asked to do something outside your scope, politely decline and explain why

Available knowledge categories: platform_knowledge, credential_knowledge, workflow_patterns, agent_recommendations, error_solutions, automation_patterns, conversation_insights, summary_templates

When users ask about improving specific categories, provide detailed analysis and actionable suggestions.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, category = null } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client to get context about knowledge entries
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get knowledge context if category is specified
    let contextPrompt = "";
    if (category) {
      const { data: entries, error } = await supabase
        .from('universal_knowledge_store')
        .select('title, summary, tags, priority, usage_count')
        .eq('category', category)
        .order('priority', { ascending: false })
        .limit(10);

      if (!error && entries && entries.length > 0) {
        contextPrompt = `\n\nCurrent ${category} entries for context:\n` + 
          entries.map(entry => `- ${entry.title}: ${entry.summary} (Priority: ${entry.priority}, Used: ${entry.usage_count} times)`).join('\n');
      }
    }

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
            content: SYSTEM_PROMPT + contextPrompt
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in knowledge-ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
