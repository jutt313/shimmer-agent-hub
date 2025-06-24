import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENFORCED_SYSTEM_PROMPT = `You are an AI assistant for YusrAI. YusrAI is a very powerful tool that can build real-time automation workflows and AI agents just from a prompt.

CRITICAL COMPLIANCE REQUIREMENT: You MUST respond with VALID JSON that includes ALL required fields. Non-compliance will result in response rejection and retry.

MANDATORY JSON RESPONSE FORMAT - YOU MUST FOLLOW THIS EXACTLY:

{
  "summary": "2-3 line description of what this automation does (MANDATORY - never leave empty)",
  "steps": [
    "Step 1: Detailed specific action to take",
    "Step 2: Next concrete action with specifics",
    "Step 3: Continue with actionable steps",
    "Step 4: Include at least 3-5 detailed steps"
  ],
  "platforms": [
    {
      "name": "Platform Name (e.g., Gmail, Slack, Trello, OpenAI)",
      "api_config": {
        "base_url": "https://api.platform.com (REAL URL REQUIRED)",
        "auth_type": "bearer_token|api_key|oauth|basic_auth",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "method_name": {
            "endpoint": "specific/endpoint/path",
            "http_method": "POST|GET|PUT|DELETE",
            "required_params": ["param1", "param2"],
            "optional_params": ["param3"],
            "example_request": {"key": "value"}
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
      "name": "SpecificAgentName",
      "role": "Detailed role description",
      "goal": "Specific objective this agent accomplishes",
      "rules": "Detailed operating principles",
      "memory": "Initial memory context",
      "why_needed": "Detailed explanation of why this agent is essential"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Detailed automation workflow description",
    "trigger": {
      "type": "manual|scheduled|webhook",
      "details": {}
    },
    "steps": [
      {
        "id": "step_1",
        "name": "Descriptive Step Name",
        "type": "action",
        "action": {
          "integration": "platform_name",
          "method": "specific_method",
          "parameters": {},
          "platform_credential_id": "credential_reference"
        }
      }
    ],
    "variables": {}
  }
}

EXAMPLE CORRECT RESPONSE for "Create automation to send email notifications for new Slack messages":

{
  "summary": "This automation monitors a specific Slack channel for new messages and automatically sends email notifications to designated recipients with message details and sender information.",
  "steps": [
    "Connect to Slack API and monitor specified channel for new messages",
    "Extract message content, sender information, and timestamp",
    "Format message data into readable email template",
    "Send email notification via Gmail API to configured recipients",
    "Log notification status and update message tracking"
  ],
  "platforms": [
    {
      "name": "Slack",
      "api_config": {
        "base_url": "https://slack.com/api",
        "auth_type": "bearer_token",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "list_messages": {
            "endpoint": "conversations.history",
            "http_method": "GET",
            "required_params": ["channel"],
            "optional_params": ["limit", "oldest"],
            "example_request": {"channel": "C1234567890", "limit": 10}
          }
        }
      },
      "credentials": [
        {
          "field": "bot_token",
          "placeholder": "xoxb-your-bot-token",
          "link": "https://api.slack.com/apps",
          "why_needed": "Required to access Slack channels and read messages"
        },
        {
          "field": "channel_id",
          "placeholder": "C1234567890",
          "link": "https://slack.com/help/articles/201402297",
          "why_needed": "Specific channel ID to monitor for new messages"
        }
      ]
    },
    {
      "name": "Gmail",
      "api_config": {
        "base_url": "https://www.googleapis.com/gmail/v1",
        "auth_type": "oauth",
        "auth_header_format": "Authorization: Bearer {token}",
        "methods": {
          "send_email": {
            "endpoint": "users/me/messages/send",
            "http_method": "POST",
            "required_params": ["raw"],
            "optional_params": [],
            "example_request": {"raw": "base64_encoded_email"}
          }
        }
      },
      "credentials": [
        {
          "field": "access_token",
          "placeholder": "ya29.a0...",
          "link": "https://console.cloud.google.com/apis/credentials",
          "why_needed": "OAuth access token for Gmail API authentication"
        },
        {
          "field": "recipient_email",
          "placeholder": "user@example.com",
          "link": "",
          "why_needed": "Email address where notifications will be sent"
        }
      ]
    }
  ],
  "agents": [
    {
      "name": "MessageProcessor",
      "role": "Slack message analyzer and email formatter",
      "goal": "Process Slack messages and create well-formatted email notifications",
      "rules": "Filter out bot messages, format content for email readability, include sender context",
      "memory": "Previous message patterns and user preferences for notification style",
      "why_needed": "Essential for converting Slack message format into professional email notifications"
    }
  ],
  "clarification_questions": [],
  "automation_blueprint": {
    "version": "1.0.0",
    "description": "Slack to email notification automation workflow",
    "trigger": {
      "type": "scheduled",
      "details": {"cron_expression": "*/5 * * * *"}
    },
    "steps": [
      {
        "id": "fetch_messages",
        "name": "Fetch New Slack Messages",
        "type": "action",
        "action": {
          "integration": "slack",
          "method": "list_messages",
          "parameters": {
            "channel": "{{channel_id}}",
            "limit": 10
          },
          "platform_credential_id": "slack_cred"
        }
      },
      {
        "id": "process_message",
        "name": "Process Message Content",
        "type": "ai_agent_call",
        "ai_agent_call": {
          "agent_id": "message_processor_agent",
          "input_prompt": "Format this Slack message for email: {{message_content}}",
          "output_variable": "formatted_email"
        }
      },
      {
        "id": "send_notification",
        "name": "Send Email Notification",
        "type": "action",
        "action": {
          "integration": "gmail",
          "method": "send_email",
          "parameters": {
            "to": "{{recipient_email}}",
            "subject": "New Slack Message Notification",
            "body": "{{formatted_email}}"
          },
          "platform_credential_id": "gmail_cred"
        }
      }
    ],
    "variables": {
      "message_content": "",
      "formatted_email": ""
    }
  }
}

CRITICAL RULES:
1. NEVER respond without ALL required fields filled with meaningful content
2. ALWAYS include at least 3-5 detailed steps
3. ALWAYS include complete platform configurations with real API endpoints
4. ALWAYS include detailed credential requirements
5. ALWAYS include at least one specific AI agent recommendation
6. ALWAYS include automation_blueprint for actionable workflows
7. JSON must be valid and parseable - test before responding

PENALTY WARNING: Incomplete responses will be rejected and you will be forced to retry.`;

// JSON Schema for validation
const REQUIRED_RESPONSE_SCHEMA = {
  summary: 'string',
  steps: 'array',
  platforms: 'array',
  agents: 'array',
  clarification_questions: 'array',
  automation_blueprint: 'object'
};

// Validate response structure
const validateResponse = (response: any): { isValid: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  if (!response.summary || response.summary.trim().length < 10) {
    missing.push('summary (must be descriptive, 10+ characters)');
  }
  
  if (!response.steps || !Array.isArray(response.steps) || response.steps.length < 3) {
    missing.push('steps (must be array with at least 3 detailed steps)');
  }
  
  if (!response.platforms || !Array.isArray(response.platforms) || response.platforms.length === 0) {
    missing.push('platforms (must include at least one platform with credentials)');
  } else {
    response.platforms.forEach((platform: any, index: number) => {
      if (!platform.credentials || platform.credentials.length === 0) {
        missing.push(`platforms[${index}].credentials (must include credential requirements)`);
      }
      if (!platform.api_config || !platform.api_config.base_url) {
        missing.push(`platforms[${index}].api_config.base_url (must include real API endpoint)`);
      }
    });
  }
  
  if (!response.agents || !Array.isArray(response.agents) || response.agents.length === 0) {
    missing.push('agents (must include at least one AI agent recommendation)');
  }
  
  if (!response.automation_blueprint || typeof response.automation_blueprint !== 'object') {
    missing.push('automation_blueprint (must include executable workflow)');
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Extract JSON from response with multiple strategies
const extractAndValidateJSON = (responseText: string): { json: any; isValid: boolean; missing: string[] } => {
  let extractedJSON = null;
  
  // Strategy 1: Find JSON in code blocks
  const codeBlockMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    try {
      extractedJSON = JSON.parse(codeBlockMatch[1]);
    } catch (e) {
      console.log('Failed to parse JSON from code block');
    }
  }
  
  // Strategy 2: Find complete JSON object
  if (!extractedJSON) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let braceCount = 0;
      let endIndex = -1;
      for (let i = 0; i < jsonMatch[0].length; i++) {
        if (jsonMatch[0][i] === '{') braceCount++;
        else if (jsonMatch[0][i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex > 0) {
        try {
          extractedJSON = JSON.parse(jsonMatch[0].substring(0, endIndex));
        } catch (e) {
          console.log('Failed to parse extracted JSON object');
        }
      }
    }
  }
  
  if (!extractedJSON) {
    return { json: null, isValid: false, missing: ['Valid JSON structure'] };
  }
  
  const validation = validateResponse(extractedJSON);
  return { json: extractedJSON, ...validation };
};

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
  let systemPrompt = ENFORCED_SYSTEM_PROMPT;
  
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
      systemPrompt = ENFORCED_SYSTEM_PROMPT;
    }
  }

  // Add knowledge context to the system prompt
  if (knowledgeContext) {
    systemPrompt += knowledgeContext;
  }
  
  return systemPrompt;
};

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const knowledgeContext = await retrieveRelevantKnowledge(message, messages, supabase);
    const effectiveApiKey = apiKey || Deno.env.get('OPENAI_API_KEY');
    
    if (!effectiveApiKey) {
      throw new Error('No API key provided');
    }

    const systemPrompt = buildSystemPrompt(agentConfig, knowledgeContext) || ENFORCED_SYSTEM_PROMPT;
    const apiEndpoint = getApiEndpoint(llmProvider);
    const authHeaders = getAuthHeader(llmProvider, effectiveApiKey);

    let requestBody;
    
    if (llmProvider.toLowerCase() === 'claude') {
      requestBody = {
        model: model,
        max_tokens: 4000,
        messages: [
          ...messages.map((msg: any) => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.text
          })),
          { role: 'user', content: message }
        ],
        system: ENFORCED_SYSTEM_PROMPT + (knowledgeContext || '')
      };
    } else {
      requestBody = {
        model: model,
        messages: [
          { role: 'system', content: ENFORCED_SYSTEM_PROMPT + (knowledgeContext || '') },
          ...messages.map((msg: any) => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.text
          })),
          { role: 'user', content: message }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      };
    }

    // Retry mechanism for compliance
    let attempts = 0;
    let finalResponse = '';
    
    while (attempts < 3) {
      console.log(`Attempt ${attempts + 1} - Making request to:`, apiEndpoint);
      
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
        throw new Error(`${llmProvider} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let aiResponse;
      
      if (llmProvider.toLowerCase() === 'claude') {
        aiResponse = data.content[0].text;
      } else {
        aiResponse = data.choices[0].message.content;
      }

      console.log('Received response, validating...');
      
      // Validate the response
      const { json, isValid, missing } = extractAndValidateJSON(aiResponse);
      
      if (isValid && json) {
        console.log('✅ Response validation passed');
        finalResponse = aiResponse;
        break;
      } else {
        console.log(`❌ Response validation failed. Missing: ${missing.join(', ')}`);
        attempts++;
        
        if (attempts < 3) {
          // Add retry instruction to force compliance
          const retryPrompt = `Your previous response was incomplete. MISSING: ${missing.join(', ')}. 
          
RETRY with COMPLETE JSON including ALL required fields. Your response MUST include:
- Detailed summary (descriptive, not generic)
- At least 3-5 specific step-by-step actions
- Complete platform configurations with real API endpoints and credentials
- Detailed AI agent recommendations
- Complete automation blueprint

Respond ONLY with valid JSON matching the required schema.`;
          
          requestBody.messages.push({ role: 'user', content: retryPrompt });
        } else {
          console.log('Max attempts reached, using fallback response');
          finalResponse = aiResponse; // Use the last attempt even if incomplete
        }
      }
    }

    // Store conversation insights
    storeConversationInsights(message, finalResponse, supabase);

    return new Response(JSON.stringify({ response: finalResponse }), {
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
