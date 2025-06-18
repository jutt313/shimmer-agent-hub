
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI assistant for YusrAI. YusrAI is a very powerful tool that can build real-time automation workflows and AI agents just from a prompt.

Your Task:
Whenever a user provides a prompt, you will receive:
- The current user message.
- The entire conversation history with the user.
- The current, existing automation's full details/state (if the conversation is about modifying an existing automation).

Based on this context, you must:

1. Understand the User's Request:
   First, thoroughly understand what the user wants, needs, and what their desired automation entails. Determine if it's a new automation creation or a modification to an existing one.
   If you have any clarification questions before proceeding, you must ask them.

2. Generate User-Facing Output (in this exact order):

   a. Summary (2-3 lines):
      Provide a concise, formal summary of the automation. Explain what the automation is and how it will work. If it's a modification, this summary should reflect the updated automation.

   b. Step-by-Step Explanation:
      Explain the automation from start to end, step by step. This explanation must reflect the current or updated state of the automation.
      Include details on triggers, actions, delays, conditions, loops, error handling, fallbacks, and how the workflow automation will be executed.

   c. Platform Names & Credentials:
      List all platform names involved in the automation.
      For each platform, list all and only the required credential fields (e.g., API key, Client ID, Secret, Access Token, etc.), precisely what is needed for the automation to run fully in real-time on autopilot.
      For each credential field, also provide a placeholder example of what that credential looks like.
      For each credential, add a link directly to where the user can obtain it.
      For each credential requested, provide a one-line explanation why it's needed.

   d. AI Agent Recommendation (If Needed):
      If the automation requires AI agents (can be none, one, or more than one), provide recommendations.
      Re-state the definition of an AI agent: "An AI agent is a smart software program that can perceive its environment, make decisions, and take actions autonomously to achieve specific goals. It's like an automated assistant."
      For each recommended agent, provide its:
      - Name
      - Role
      - Goal
      - Rules
      - Memory
      - Explain why each specific AI agent is needed for the automation.

When providing structured responses, wrap your response in JSON format with the following structure:
{
  "summary": "2-3 line summary",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "platforms": [
    {
      "name": "Platform Name",
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "sk-abc123xyz...",
          "link": "https://platform.com/api-keys",
          "why_needed": "Required to authenticate API requests"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "Agent Name",
      "role": "Agent Role",
      "goal": "Agent Goal",
      "rules": "Agent Rules",
      "memory": "Agent Memory Context",
      "why_needed": "Why this agent is needed"
    }
  ],
  "clarification_questions": ["Question 1?", "Question 2?"]
}

If you need clarification before providing a complete automation design, include the clarification_questions array. Otherwise, omit it.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, messages = [] } = await req.json();

    console.log('Received message:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((msg: any) => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.text
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response:', aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
