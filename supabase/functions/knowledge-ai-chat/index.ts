
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPREHENSIVE_SYSTEM_PROMPT = `You are Universal Memory AI, a specialized automation expert for the YusrAI Platform.

CRITICAL RESPONSE REQUIREMENTS:
1. ALWAYS respond with BOTH human-readable text AND structured JSON
2. ALWAYS include detailed step-by-step workflows
3. ALWAYS identify required platforms and their credentials
4. ALWAYS suggest relevant AI agents when applicable

RESPONSE FORMAT - YOU MUST FOLLOW THIS EXACTLY:

Provide a helpful explanation, then include this JSON structure:

\`\`\`json
{
  "summary": "Clear description of what this automation does",
  "steps": [
    "Step 1: Detailed action to take",
    "Step 2: Next specific action",
    "Step 3: Continue with concrete steps"
  ],
  "platforms": [
    {
      "name": "Platform Name",
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "Enter your API key",
          "link": "https://platform.com/api-keys",
          "why_needed": "Required to authenticate and access platform features"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "AgentName",
      "role": "Specific role description",
      "goal": "What this agent accomplishes",
      "rules": "How it operates",
      "memory": "What it remembers",
      "why_needed": "Why this agent is essential"
    }
  ],
  "clarification_questions": [
    "Any questions needed to complete the automation"
  ]
}
\`\`\`

AUTOMATION PLATFORMS TO CONSIDER:
Gmail, Google Workspace, Slack, Discord, Notion, Airtable, Zapier, Microsoft Teams, Trello, Asana, Salesforce, HubSpot, Zendesk, Stripe, PayPal, Twilio, SendGrid, OpenAI, Anthropic, GitHub, Jira, Confluence, Zoom, Calendly, Shopify, WooCommerce, Facebook, Instagram, Twitter, LinkedIn, YouTube, AWS, Azure, GCP, Dropbox, OneDrive, Mailchimp, ConvertKit, Typeform, SurveyMonkey, Webflow, WordPress

AGENT TYPES TO SUGGEST:
- EmailManager: Handles email operations
- DataAnalyzer: Processes and analyzes data
- ContentCreator: Generates content
- TaskScheduler: Manages timing and scheduling
- NotificationHandler: Manages alerts and notifications
- ReportGenerator: Creates reports and summaries
- QualityChecker: Validates and checks quality
- CustomerSupport: Handles customer interactions
- LeadQualifier: Evaluates and scores leads
- WorkflowCoordinator: Manages complex workflows

EXAMPLE RESPONSE:
"I'll help you create an automation for managing support tickets. Here's a comprehensive workflow:

\`\`\`json
{
  "summary": "Automated support ticket management system that prioritizes tickets and assigns them to appropriate team members",
  "steps": [
    "Monitor Zendesk for new ticket creation",
    "Extract ticket details (priority, category, customer info)",
    "Check customer tier and support plan",
    "Assign priority score based on customer tier and issue type",
    "Route high-priority tickets to senior support agents",
    "Send automated acknowledgment to customer",
    "Create task in project management tool",
    "Set follow-up reminders based on priority level"
  ],
  "platforms": [
    {
      "name": "Zendesk",
      "credentials": [
        {
          "field": "api_token",
          "placeholder": "Enter your Zendesk API token",
          "link": "https://support.zendesk.com/hc/en-us/articles/226022787",
          "why_needed": "Required to access ticket data and create/update tickets"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "TicketPrioritizer",
      "role": "Support ticket analysis specialist",
      "goal": "Automatically categorize and prioritize incoming support tickets",
      "rules": "Analyze ticket content, customer tier, and urgency indicators",
      "memory": "Customer interaction history and ticket resolution patterns",
      "why_needed": "Essential for efficient ticket routing and ensuring high-priority issues get immediate attention"
    }
  ]
}
\`\`\`"

CRITICAL RULES:
- NEVER give vague responses
- ALWAYS include concrete, actionable steps
- ALWAYS identify specific platforms involved
- ALWAYS include credential requirements
- ALWAYS suggest relevant AI agents
- Keep responses comprehensive but focused`;

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
            content: COMPREHENSIVE_SYSTEM_PROMPT + platformContext + knowledgeContext
          },
          { 
            role: 'user', 
            content: message 
          }
        ],
        max_tokens: 2000,
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
      .replace(/[%&'*]/g, '')
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
