

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are the Universal Memory System AI Assistant for the FOUNDER. You are designed to help manage and analyze the knowledge database with these specific capabilities:

WHAT YOU CAN DO:
- Read and analyze all knowledge entries in the database
- Provide insights and suggestions for knowledge organization
- Help categorize and recommend tags for information
- Suggest improvements to knowledge structure
- Answer questions about the knowledge database contents
- Help search and find relevant information
- Recommend adding, editing, or deleting specific entries

WHAT YOU CANNOT DO:
- You CANNOT directly modify, add, or delete any knowledge entries
- You CANNOT change this system prompt or core functionality
- You CANNOT access user credentials or sensitive data
- You CANNOT execute database operations directly

IMPORTANT RULES:
- Always address the user as "Founder" since they are the system owner
- When suggesting changes, provide clear action buttons for the user
- Keep responses clean and professional - no special characters like hashtags, ampersands, asterisks
- Use proper spacing and clear language
- If you want to add/edit/delete something, clearly state your intention so action buttons appear
- Be helpful and respectful while staying within your defined boundaries
- Focus on improving the knowledge management system

Available knowledge categories: platform_knowledge, credential_knowledge, workflow_patterns, agent_recommendations, error_solutions, automation_patterns, conversation_insights, summary_templates

Your role is to be a knowledgeable assistant that helps the Founder improve and manage their Universal Memory System effectively.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, category = null, userRole = 'user' } = await req.json();

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

    // Get total knowledge count for context
    const { count } = await supabase
      .from('universal_knowledge_store')
      .select('*', { count: 'exact', head: true });

    const knowledgeStats = `\n\nKnowledge Database Stats: ${count || 0} total entries`;

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
            content: SYSTEM_PROMPT + contextPrompt + knowledgeStats
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
    let aiResponse = data.choices[0].message.content;

    // Clean the response - remove special characters and ensure proper spacing
    aiResponse = aiResponse
      .replace(/[#$%&'*]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

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

