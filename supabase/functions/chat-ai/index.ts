
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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

You are an AI assistant for YusrAI that can work with ANY platform API in the world. When a user requests automation with any platform, you must:

1. **ANALYZE THE PLATFORM**: Research and understand the platform's API structure, authentication methods, and available endpoints.

2. **GENERATE DYNAMIC CONFIGURATION**: Create the complete platform configuration including:
   - Authentication requirements (API keys, OAuth, tokens, etc.)
   - Base URL and endpoints
   - HTTP methods and request formats
   - Required headers and parameters

3. **MANDATORY JSON RESPONSE FORMAT**: 
You MUST ALWAYS respond with a JSON object containing these exact fields:

{
  "summary": "2-3 line summary of the automation",
  "steps": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"],
  "platforms": [
    {
      "name": "Platform Name (e.g., Gmail, Slack, Trello, OpenAI)",
      "api_config": {
        "base_url": "https://api.platform.com",
        "auth_type": "bearer_token|api_key|oauth|basic_auth|custom",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "method_name": {
            "endpoint": "specific/endpoint",
            "http_method": "POST|GET|PUT|DELETE",
            "required_params": ["param1", "param2"],
            "optional_params": ["param3", "param4"],
            "example_request": {}
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
3. For EVERY platform, include complete "api_config" with base_url, auth_type, auth_header_format, and methods
4. ALWAYS include "agents" array with at least one AI agent recommendation
5. ONLY include "clarification_questions" if you need more information before proceeding
6. Include "automation_blueprint" for new automations or when making changes
7. Ensure ALL JSON is properly formatted and valid

Platform API Configuration Guidelines:
- Research the platform's actual API documentation
- Include the real base_url (e.g., "https://api.slack.com", "https://www.googleapis.com/gmail/v1")
- Specify correct auth_type: bearer_token, api_key, oauth, basic_auth, or custom
- Define auth_header_format exactly as the API expects
- Map all relevant API methods with correct endpoints and parameters

Common Platform Examples:
- Slack: Bearer token, "https://slack.com/api", methods like "chat.postMessage"
- Gmail: OAuth2, "https://www.googleapis.com/gmail/v1", methods like "users/me/messages"
- Trello: API key + token, "https://api.trello.com/1", methods like "cards"
- Discord: Bearer token, "https://discord.com/api/v10"
- GitHub: Bearer token, "https://api.github.com"
- Notion: Bearer token, "https://api.notion.com/v1"
- Any platform: Research their API docs and generate configuration

AI Agent Guidelines:
- Always recommend at least one AI agent for automations
- Provide specific, actionable roles and goals
- Include relevant memory context
- Explain clearly why the agent is needed

4. **BLUEPRINT ENHANCEMENT**: Include complete API call configurations in automation_blueprint that can be executed dynamically using the api_config you provide.

5. **UNIVERSAL PLATFORM SUPPORT**: You can work with ANY platform - Notion, Salesforce, Discord, LinkedIn, Facebook, Twitter, GitHub, Jira, Spotify, Zapier, HubSpot, Mailchimp, Shopify, WooCommerce, etc. Just analyze their API and generate the configuration dynamically.

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
      "api_config": {
        "base_url": "https://www.googleapis.com/gmail/v1",
        "auth_type": "oauth",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "list_messages": {
            "endpoint": "users/me/messages",
            "http_method": "GET",
            "required_params": [],
            "optional_params": ["q", "maxResults"],
            "example_request": {"q": "is:unread", "maxResults": 10}
          },
          "get_message": {
            "endpoint": "users/me/messages/{id}",
            "http_method": "GET",
            "required_params": ["id"],
            "optional_params": ["format"],
            "example_request": {"format": "full"}
          }
        }
      },
      "credentials": [
        {
          "field": "access_token",
          "placeholder": "ya29.a0...",
          "link": "https://console.cloud.google.com/apis/credentials",
          "why_needed": "OAuth 2.0 access token for Gmail API authentication"
        },
        {
          "field": "refresh_token",
          "placeholder": "1//04...",
          "link": "https://console.cloud.google.com/apis/credentials",
          "why_needed": "OAuth 2.0 refresh token to maintain access"
        }
      ]
    },
    {
      "name": "Slack",
      "api_config": {
        "base_url": "https://slack.com/api",
        "auth_type": "bearer_token",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "post_message": {
            "endpoint": "chat.postMessage",
            "http_method": "POST",
            "required_params": ["channel", "text"],
            "optional_params": ["as_user", "blocks", "thread_ts"],
            "example_request": {"channel": "C1234567890", "text": "Hello World"}
          }
        }
      },
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
            "q": "is:unread",
            "maxResults": 10
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
            "text": "📧 Email Summary: {{email_summary}}"
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

Remember: EVERY response must be valid JSON with ALL required fields AND complete api_config for each platform. This ensures the UI displays all sections properly AND the automation can execute against any platform dynamically.`;

// Function to retrieve relevant knowledge from the universal knowledge store
const retrieveRelevantKnowledge = async (message: string, messages: any[], supabase: any): Promise<string> => {
  try {
    console.log('Retrieving relevant knowledge for:', message.substring(0, 100));

    // Extract keywords from the current message and conversation
    const allText = [message, ...messages.map((m: any) => m.text)].join(' ').toLowerCase();
    const keywords = allText.match(/\b\w{4,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)].slice(0, 10); // Top 10 unique keywords

    console.log('Searching with keywords:', uniqueKeywords);

    // Search for relevant knowledge entries
    const { data: knowledgeEntries, error } = await supabase
      .from('universal_knowledge_store')
      .select('*')
      .or(
        uniqueKeywords.map(keyword => 
          `title.ilike.%${keyword}%,summary.ilike.%${keyword}%,tags.cs.{${keyword}}`
        ).join(',')
      )
      .order('priority', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error retrieving knowledge:', error);
      return '';
    }

    if (!knowledgeEntries || knowledgeEntries.length === 0) {
      console.log('No relevant knowledge found');
      return '';
    }

    console.log(`Found ${knowledgeEntries.length} relevant knowledge entries`);

    // Update usage count for retrieved entries
    const entryIds = knowledgeEntries.map((entry: any) => entry.id);
    await supabase
      .from('universal_knowledge_store')
      .update({ 
        usage_count: knowledgeEntries[0].usage_count + 1,
        last_used: new Date().toISOString()
      })
      .in('id', entryIds);

    // Format knowledge for inclusion in prompt
    const formattedKnowledge = knowledgeEntries.map((entry: any) => {
      return `**${entry.category.replace('_', ' ')}**: ${entry.title}
Summary: ${entry.summary}
Details: ${JSON.stringify(entry.details, null, 2)}
Tags: ${entry.tags.join(', ')}`;
    }).join('\n\n');

    return `\n\n=== RELEVANT KNOWLEDGE FROM PAST EXPERIENCES ===\n${formattedKnowledge}\n=== END KNOWLEDGE CONTEXT ===\n\n`;

  } catch (error) {
    console.error('Failed to retrieve knowledge:', error);
    return '';
  }
};

// Function to store insights from conversations
const storeConversationInsights = async (message: string, response: string, supabase: any): Promise<void> => {
  try {
    // Extract potential platform mentions
    const platformMentions = message.toLowerCase().match(/\b(gmail|slack|trello|discord|notion|github|openai|claude|stripe|twilio|sendgrid|hubspot|salesforce|shopify|linkedin|twitter|facebook|instagram|youtube|dropbox|google|microsoft|zoom|teams|asana|monday|jira|confluence|figma|canva|mailchimp|constant contact|airtable|zapier|make|ifttt)\b/g);

    if (platformMentions && platformMentions.length > 0) {
      const insights = {
        category: 'conversation_insights',
        title: `User Interest: ${platformMentions.join(', ')} Integration`,
        summary: `User showed interest in ${platformMentions.join(', ')} platform integration`,
        details: {
          user_query: message.substring(0, 200),
          mentioned_platforms: platformMentions,
          response_type: response.includes('"automation_blueprint"') ? 'automation_created' : 'information_provided',
          timestamp: new Date().toISOString()
        },
        tags: [...platformMentions, 'user_interest', 'platform_integration'],
        priority: 5,
        source_type: 'conversation'
      };

      await supabase
        .from('universal_knowledge_store')
        .insert(insights);

      console.log('Stored conversation insight for platforms:', platformMentions);
    }
  } catch (error) {
    console.error('Failed to store conversation insights:', error);
  }
};

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
const buildSystemPrompt = (agentConfig: any, knowledgeContext: string) => {
  let systemPrompt = DEFAULT_SYSTEM_PROMPT;
  
  if (agentConfig) {
    systemPrompt = '';
    
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
    
    if (!systemPrompt) {
      systemPrompt = DEFAULT_SYSTEM_PROMPT;
    }
  }

  // Add knowledge context to the system prompt
  if (knowledgeContext) {
    systemPrompt += knowledgeContext;
  }
  
  return systemPrompt;
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

    // Initialize Supabase client for knowledge retrieval
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve relevant knowledge before generating response
    const knowledgeContext = await retrieveRelevantKnowledge(message, messages, supabase);

    // Use provided API key or fallback to environment variable
    const effectiveApiKey = apiKey || Deno.env.get('OPENAI_API_KEY');
    
    if (!effectiveApiKey) {
      throw new Error('No API key provided');
    }

    // Build system prompt from agent configuration and knowledge
    const systemPrompt = buildSystemPrompt(agentConfig, knowledgeContext);
    console.log('Using system prompt with knowledge context');

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

    // Store conversation insights for learning (async, don't await)
    storeConversationInsights(message, aiResponse, supabase);

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
