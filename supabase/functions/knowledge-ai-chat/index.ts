import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENHANCED_SYSTEM_PROMPT = `You are Universal Memory AI, a specialized problem-solving assistant for the YusrAI Automation Platform.

YOUR CORE RESPONSIBILITIES:
1. ANALYZE problems users describe and provide STRUCTURED solutions
2. ALWAYS include step-by-step workflows when dealing with automation issues
3. CATEGORIZE problems automatically for knowledge storage
4. READ and USE existing knowledge to avoid repeated issues

RESPONSE STRUCTURE - ALWAYS FOLLOW THIS:
When a user describes a problem, respond with:

1. **Problem Analysis**: Brief acknowledgment of the issue
2. **Step-by-Step Solution**: NUMBERED steps to solve the problem
3. **Platforms Involved**: List specific platforms/tools mentioned
4. **Error Prevention**: How to avoid this issue in future

CRITICAL RULES:
- NEVER give vague responses like "you should clarify" or "would you like help"
- ALWAYS provide CONCRETE, ACTIONABLE steps
- If automation workflows are mentioned, ALWAYS include detailed step-by-step process
- Be direct and solution-focused
- Use clear, numbered lists for workflows

EXAMPLE RESPONSE FORMAT:
"I see you're having [specific issue]. Here's how to solve it:

**Step-by-Step Solution:**
1. First, do [specific action]
2. Then, configure [specific setting]  
3. Next, test by [specific test]
4. Finally, verify [specific verification]

**Platforms Involved:** [List specific platforms]
**Prevention:** To avoid this in future, [specific prevention steps]"

Keep responses practical, direct, and always include actionable steps.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, category = null, userRole = 'user', context = 'general' } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get platform context
    const { count: automationsCount } = await supabase
      .from('automations')
      .select('*', { count: 'exact', head: true });

    const platformContext = `\nPlatform Context: ${automationsCount || 0} automations exist. User is ${userRole}.`;

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
            content: ENHANCED_SYSTEM_PROMPT + platformContext + knowledgeContext
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Clean response but keep structure
    aiResponse = aiResponse
      .replace(/[#$%&'*]/g, '')
      .trim();

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

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in knowledge-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
