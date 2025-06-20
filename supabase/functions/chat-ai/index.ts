import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SYSTEM_PROMPT = `You are an AI assistant for YusrAI. YusrAI is a very powerful tool that can build real-time automation workflows and AI agents just from a prompt. Your primary goal is to empower users to build robust automations by providing clear, complete, and actionable plans.

CRITICAL: You MUST ALWAYS respond with a valid JSON object that includes ALL required sections for proper UI display.

Your Task:
Whenever a user provides a prompt, you will receive:
- The current user message.
- The entire conversation history with the user.
- The current, existing automation's full details/state (if the conversation is about modifying an existing automation). The 'automation' object in the context will contain 'automation_blueprint' if it has been generated.

MANDATORY JSON RESPONSE FORMAT:
You MUST ALWAYS respond with a JSON object containing these exact fields:

{
  "summary": "2-3 line summary of the automation",
  "steps": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"],
  "platforms": [
    {
      "name": "Platform Name (e.g., Gmail, Slack, Trello, OpenAI)",
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
      "name": "AI Agent Name",
      "role": "Agent's role",
      "goal": "Specific objective for this agent",
      "rules": "Guiding principles for the agent",
      "memory": "Initial memory context",
      "why_needed": "Why this agent is essential"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Automation workflow description",
    "trigger": {
      "type": "manual"
    },
    "steps": [
      {
        "id": "step_1",
        "name": "Step Name",
        "type": "action",
        "action": {
          "integration": "platform_name",
          "method": "action_method",
          "parameters": {},
          "platform_credential_id": "credential_ref"
        }
      }
    ],
    "variables": {}
  }
}

CRITICAL RULES:
1. ALWAYS include "summary" and "steps" fields - these are mandatory
2. ALWAYS include "platforms" array with at least one platform if the automation needs external services
3. ALWAYS include "agents" array with at least one AI agent recommendation
4. ONLY include "clarification_questions" if you need more information before proceeding
5. Include "automation_blueprint" for new automations or when making changes
6. Ensure ALL JSON is properly formatted and valid

Platform Guidelines:
- For Gmail: include api_key, client_id, client_secret, refresh_token
- For Slack: include bot_token, channel_id, webhook_url
- For Trello: include api_key, token, board_id, list_id
- For OpenAI: include api_key (only if not using AI Agent)
- For Google Sheets: include api_key, sheet_id, sheet_name
- For Notion: include api_key, database_id
- For Salesforce: include client_id, client_secret, username, password, security_token

AI Agent Guidelines:
- Always recommend at least one AI agent for automations
- Provide specific, actionable roles and goals
- Include relevant memory context
- Explain clearly why the agent is needed

Example Response for "Create an automation to summarize emails and post to Slack":

{
  "summary": "This automation monitors your Gmail inbox, uses AI to summarize new emails, and posts the summaries to a designated Slack channel for quick team updates.",
  "steps": [
    "Monitor Gmail inbox for new emails using Gmail API",
    "Extract email content and sender information",
    "Use EmailSummarizer AI agent to create concise summaries",
    "Format summary with sender details and key points",
    "Post formatted summary to designated Slack channel"
  ],
  "platforms": [
    {
      "name": "Gmail",
      "credentials": [
        {
          "field": "api_key",
          "placeholder": "AIza...",
          "link": "https://console.cloud.google.com/apis/credentials",
          "why_needed": "Required to access Gmail API for reading emails"
        },
        {
          "field": "client_id",
          "placeholder": "123456789.apps.googleusercontent.com",
          "link": "https://console.cloud.google.com/apis/credentials",
          "why_needed": "OAuth 2.0 client ID for Gmail authentication"
        }
      ]
    },
    {
      "name": "Slack",
      "credentials": [
        {
          "field": "bot_token",
          "placeholder": "xoxb-...",
          "link": "https://api.slack.com/apps",
          "why_needed": "Bot token to post messages to Slack channels"
        },
        {
          "field": "channel_id",
          "placeholder": "C1234567890",
          "link": "https://slack.com/help/articles/201402297",
          "why_needed": "Specific channel ID where summaries will be posted"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "EmailSummarizer",
      "role": "Email content analyzer and summarizer",
      "goal": "Analyze email content and create concise, actionable summaries",
      "rules": "Keep summaries under 100 words, highlight key action items, maintain professional tone",
      "memory": "Previous email patterns and user preferences for summary style",
      "why_needed": "Essential for converting lengthy emails into digestible summaries for team awareness"
    }
  ],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Email summarization and Slack notification automation",
    "trigger": {
      "type": "scheduled",
      "cron_expression": "*/15 * * * *"
    },
    "steps": [
      {
        "id": "fetch_emails",
        "name": "Fetch New Emails",
        "type": "action",
        "action": {
          "integration": "gmail",
          "method": "list_messages",
          "parameters": {
            "query": "is:unread"
          },
          "platform_credential_id": "gmail_cred"
        }
      },
      {
        "id": "summarize_email",
        "name": "Summarize Email Content",
        "type": "ai_agent_call",
        "ai_agent_call": {
          "agent_id": "email_summarizer_agent",
          "input_prompt": "Summarize this email: {{email_content}}",
          "output_variable": "email_summary"
        }
      },
      {
        "id": "post_to_slack",
        "name": "Post Summary to Slack",
        "type": "action",
        "action": {
          "integration": "slack",
          "method": "post_message",
          "parameters": {
            "channel": "{{channel_id}}",
            "text": "Email Summary: {{email_summary}}"
          },
          "platform_credential_id": "slack_cred"
        }
      }
    ],
    "variables": {
      "email_content": "",
      "email_summary": ""
    }
  }
}

Remember: EVERY response must be valid JSON with ALL required fields. This ensures the UI displays all sections properly.`;

// Function to get API endpoint based on LLM provider
const getApiEndpoint = (llmProvider: string) => {
  switch (llmProvider.toLowerCase()) {
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'claude':
      return 'https://api.anthropic.com/v1/messages';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta/models';
    case 'grok':
      return 'https://api.x.ai/v1/chat/completions';
    case 'deepseek':
      return 'https://api.deepseek.com/chat/completions';
    default:
      return 'https://api.openai.com/v1/chat/completions';
  }
};

// Function to format authorization header based on LLM provider
const getAuthHeader = (llmProvider: string, apiKey: string) => {
  switch (llmProvider.toLowerCase()) {
    case 'claude':
      return { 'x-api-key': apiKey };
    case 'gemini':
      return {}; // Gemini uses API key in URL
    default:
      return { 'Authorization': `Bearer ${apiKey}` };
  }
};

// Function to build system prompt from agent configuration
const buildSystemPrompt = (agentConfig: any) => {
  if (!agentConfig) return DEFAULT_SYSTEM_PROMPT;
  
  let systemPrompt = '';
  
  if (agentConfig.role) {
    systemPrompt += `Role: ${agentConfig.role}\n\n`;
  }
  
  if (agentConfig.goal) {
    systemPrompt += `Goal: ${agentConfig.goal}\n\n`;
  }
  
  if (agentConfig.rules) {
    systemPrompt += `Rules: ${agentConfig.rules}\n\n`;
  }
  
  if (agentConfig.memory) {
    try {
      const memoryObj = typeof agentConfig.memory === 'string' ? JSON.parse(agentConfig.memory) : agentConfig.memory;
      systemPrompt += `Memory Context: ${JSON.stringify(memoryObj)}\n\n`;
    } catch (e) {
      systemPrompt += `Memory Context: ${agentConfig.memory}\n\n`;
    }
  }
  
  return systemPrompt || DEFAULT_SYSTEM_PROMPT;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      messages = [], 
      agentConfig = null,
      llmProvider = 'OpenAI',
      model = 'gpt-4o-mini',
      apiKey = null
    } = await req.json();

    console.log('Received request with:', { llmProvider, model, hasApiKey: !!apiKey, hasAgentConfig: !!agentConfig });

    // Use provided API key or fallback to environment variable
    const effectiveApiKey = apiKey || Deno.env.get('OPENAI_API_KEY');
    
    if (!effectiveApiKey) {
      throw new Error('No API key provided');
    }

    // Build system prompt from agent configuration
    const systemPrompt = buildSystemPrompt(agentConfig);
    console.log('Using system prompt:', systemPrompt.substring(0, 200) + '...');

    // Get API endpoint and auth headers based on LLM provider
    const apiEndpoint = getApiEndpoint(llmProvider);
    const authHeaders = getAuthHeader(llmProvider, effectiveApiKey);

    console.log('Making request to:', apiEndpoint, 'with model:', model);

    // Prepare request body based on LLM provider
    let requestBody;
    
    if (llmProvider.toLowerCase() === 'claude') {
      // Anthropic Claude format
      requestBody = {
        model: model,
        max_tokens: 2000,
        messages: [
          ...messages.map((msg: any) => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.text
          })),
          { role: 'user', content: message }
        ],
        system: systemPrompt
      };
    } else {
      // OpenAI format (also works for Grok, DeepSeek)
      requestBody = {
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((msg: any) => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.text
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      };
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`${llmProvider} API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from API');

    // Extract response content based on provider
    let aiResponse;
    if (llmProvider.toLowerCase() === 'claude') {
      aiResponse = data.content[0].text;
    } else {
      aiResponse = data.choices[0].message.content;
    }

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
