
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are the AI Help Assistant for the YusrAI Automation Platform. You are a comprehensive help system that assists users with all aspects of the platform.

YOUR CAPABILITIES:
- Help with automations: creation, configuration, troubleshooting
- Explain notifications and their meanings
- Assist with error diagnosis and solutions
- Guide users through platform features
- Help with AI agent configuration
- Explain platform credentials and connections
- Provide workflow guidance
- Answer general questions about the tool

PLATFORM KNOWLEDGE:
- This is an AI automation platform for creating intelligent workflows
- Users can create automations that connect to various platforms (social media, email, CRM, etc.)
- AI agents power the automations using different LLM providers
- The platform has credentials management for external services
- Users get notifications about automation status and system events
- There's a universal knowledge system that stores patterns and solutions
- Error handling includes automatic analysis and user support

COMMUNICATION STYLE:
- Be friendly, helpful, and professional
- Use clear, simple language without too much technical jargon
- Provide step-by-step guidance when explaining processes
- Ask clarifying questions when the user's request is unclear
- Offer specific, actionable advice
- When dealing with errors, focus on solutions rather than just explanations

RESPONSE FORMAT:
- Keep responses concise but comprehensive
- Use bullet points for lists and steps
- Highlight important information
- Suggest follow-up actions when helpful
- If you need more information to help better, ask specific questions

Remember: You are here to help users succeed with their automation platform, not to build automations for them, but to help them understand and use the platform effectively.`;

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

    // Initialize Supabase client to get context about user's platform usage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get relevant context from knowledge base
    let contextPrompt = "";
    if (category && category !== 'general_help') {
      const { data: entries, error } = await supabase
        .from('universal_knowledge_store')
        .select('title, summary, tags, priority')
        .eq('category', category)
        .order('priority', { ascending: false })
        .limit(5);

      if (!error && entries && entries.length > 0) {
        contextPrompt = `\n\nRelevant knowledge from platform:\n` + 
          entries.map(entry => `- ${entry.title}: ${entry.summary}`).join('\n');
      }
    }

    // Get recent error patterns for better help
    const { data: recentErrors } = await supabase
      .from('universal_knowledge_store')
      .select('title, summary')
      .eq('category', 'error_solutions')
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentErrors && recentErrors.length > 0) {
      contextPrompt += `\n\nRecent error solutions:\n` + 
        recentErrors.map(error => `- ${error.title}: ${error.summary}`).join('\n');
    }

    // Get platform stats for context
    const { count: automationsCount } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true });

    const { count: knowledgeCount } = await supabase
      .from('universal_knowledge_store')
      .select('*', { count: 'exact', head: true });

    const platformStats = `\n\nPlatform Context:
- Total automations in system: ${automationsCount || 0}
- Knowledge base entries: ${knowledgeCount || 0}
- Available categories: platform_knowledge, credential_knowledge, workflow_patterns, agent_recommendations, error_solutions, automation_patterns`;

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
            content: SYSTEM_PROMPT + contextPrompt + platformStats
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Clean and format the response
    aiResponse = aiResponse
      .replace(/[#$%&'*]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in knowledge-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again in a moment, or check that your internet connection is working properly."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
