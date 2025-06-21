
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const initialKnowledgeData = [
  // Platform Knowledge
  {
    category: 'platform_knowledge',
    title: 'Gmail API Integration',
    summary: 'Gmail API requires OAuth2 authentication and specific scopes for email access',
    details: {
      auth_type: 'oauth2',
      required_scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
      base_url: 'https://www.googleapis.com/gmail/v1',
      common_endpoints: ['users/me/messages', 'users/me/profile', 'users/me/labels'],
      rate_limits: '250 quota units per user per 100 seconds'
    },
    tags: ['gmail', 'google', 'email', 'oauth2'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Slack API Integration',
    summary: 'Slack requires bot tokens for API access and specific channel permissions',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://slack.com/api',
      required_scopes: ['chat:write', 'channels:read', 'groups:read'],
      common_endpoints: ['chat.postMessage', 'conversations.list', 'auth.test'],
      token_format: 'xoxb-*'
    },
    tags: ['slack', 'messaging', 'bot', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Trello API Integration',
    summary: 'Trello uses API key and token authentication for board and card management',
    details: {
      auth_type: 'api_key_token',
      base_url: 'https://api.trello.com/1',
      required_params: ['key', 'token'],
      common_endpoints: ['boards', 'cards', 'lists', 'members'],
      authentication_url: 'https://trello.com/app-key'
    },
    tags: ['trello', 'project_management', 'cards', 'boards'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'OpenAI API Integration',
    summary: 'OpenAI requires API key authentication for AI model access',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://api.openai.com/v1',
      common_endpoints: ['chat/completions', 'models', 'embeddings'],
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      rate_limits: 'Varies by tier and model'
    },
    tags: ['openai', 'ai', 'gpt', 'chat'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'Discord API Integration',
    summary: 'Discord uses bot tokens for API access and guild management',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://discord.com/api/v10',
      common_endpoints: ['channels', 'guilds', 'users', 'messages'],
      token_format: 'Bot TOKEN_HERE',
      permissions: 'Bot permissions required for each action'
    },
    tags: ['discord', 'gaming', 'bot', 'messaging'],
    priority: 7
  },

  // Credential Knowledge
  {
    category: 'credential_knowledge',
    title: 'OAuth2 Flow Best Practices',
    summary: 'Common patterns and troubleshooting for OAuth2 implementations',
    details: {
      common_errors: ['invalid_grant', 'expired_token', 'insufficient_scope'],
      refresh_patterns: 'Always store refresh tokens securely',
      scope_management: 'Request minimal required scopes',
      token_storage: 'Never store tokens in localStorage for production'
    },
    tags: ['oauth2', 'authentication', 'security'],
    priority: 9
  },
  {
    category: 'credential_knowledge',
    title: 'API Key Security Patterns',
    summary: 'Best practices for API key management and validation',
    details: {
      validation_patterns: {
        openai: '^sk-[A-Za-z0-9]{48}$',
        stripe: '^sk_(test|live)_[A-Za-z0-9]{99}$',
        github: '^ghp_[A-Za-z0-9]{36}$'
      },
      common_errors: ['401 Unauthorized', '403 Forbidden', 'Invalid API key format'],
      security_tips: 'Rotate keys regularly, use environment variables'
    },
    tags: ['api_keys', 'security', 'validation'],
    priority: 8
  },

  // Workflow Patterns
  {
    category: 'workflow_patterns',
    title: 'Email Automation Workflows',
    summary: 'Common patterns for email-based automation workflows',
    details: {
      trigger_types: ['new_email', 'specific_sender', 'keyword_match'],
      processing_steps: ['extract_content', 'analyze_sentiment', 'categorize'],
      response_actions: ['reply', 'forward', 'create_task', 'log_to_sheet'],
      error_handling: 'Always handle rate limits and authentication errors'
    },
    tags: ['email', 'automation', 'workflows'],
    priority: 8
  },
  {
    category: 'workflow_patterns',
    title: 'Data Sync Workflows',
    summary: 'Patterns for syncing data between different platforms',
    details: {
      sync_strategies: ['full_sync', 'incremental_sync', 'real_time_sync'],
      conflict_resolution: ['last_write_wins', 'manual_review', 'field_level_merge'],
      scheduling: ['cron_based', 'event_triggered', 'manual_trigger'],
      monitoring: 'Track sync success rates and data consistency'
    },
    tags: ['data_sync', 'integration', 'scheduling'],
    priority: 7
  },

  // Agent Recommendations
  {
    category: 'agent_recommendations',
    title: 'Content Summarization Agent',
    summary: 'AI agent specialized in creating concise, actionable content summaries',
    details: {
      recommended_role: 'Content Analyst and Summarizer',
      goal: 'Extract key insights and action items from lengthy content',
      rules: 'Keep summaries under 200 words, highlight urgent items, maintain professional tone',
      use_cases: ['email_summarization', 'document_analysis', 'meeting_notes'],
      prompt_templates: 'Always include context about the source and intended audience'
    },
    tags: ['summarization', 'content', 'analysis'],
    priority: 8
  },
  {
    category: 'agent_recommendations',
    title: 'Customer Support Agent',
    summary: 'AI agent for handling customer inquiries and support tickets',
    details: {
      recommended_role: 'Customer Support Specialist',
      goal: 'Provide helpful, accurate responses to customer inquiries',
      rules: 'Be empathetic, provide step-by-step solutions, escalate complex issues',
      knowledge_areas: ['product_features', 'troubleshooting', 'billing', 'account_management'],
      escalation_triggers: ['billing_disputes', 'technical_failures', 'refund_requests']
    },
    tags: ['customer_support', 'help_desk', 'ticketing'],
    priority: 9
  },

  // Error Solutions
  {
    category: 'error_solutions',
    title: 'Common API Authentication Errors',
    summary: 'Solutions for frequent API authentication failures',
    details: {
      error_401: 'Check API key format, expiration, and permissions',
      error_403: 'Verify account access rights and subscription status',
      error_429: 'Implement exponential backoff and respect rate limits',
      oauth_errors: 'Check redirect URIs, scope permissions, and token expiration',
      troubleshooting_steps: ['Verify credentials', 'Check API documentation', 'Test with curl']
    },
    tags: ['authentication', 'errors', 'troubleshooting'],
    priority: 9
  },
  {
    category: 'error_solutions',
    title: 'Network and Timeout Errors',
    summary: 'Handling network failures and timeout issues in automations',
    details: {
      timeout_strategies: ['progressive_timeouts', 'circuit_breaker', 'retry_with_backoff'],
      network_errors: ['connection_refused', 'dns_resolution', 'ssl_errors'],
      monitoring: 'Track error rates and response times',
      fallback_strategies: 'Implement graceful degradation and error notifications'
    },
    tags: ['network', 'timeouts', 'reliability'],
    priority: 7
  },

  // Automation Patterns
  {
    category: 'automation_patterns',
    title: 'Event-Driven Automation',
    summary: 'Patterns for creating responsive, event-triggered automations',
    details: {
      trigger_types: ['webhook', 'scheduled', 'manual', 'conditional'],
      event_processing: ['validate_payload', 'enrich_data', 'route_to_handler'],
      scaling_considerations: 'Handle burst events and maintain order when needed',
      monitoring: 'Track event processing times and failure rates'
    },
    tags: ['events', 'triggers', 'real_time'],
    priority: 8
  },

  // Conversation Insights
  {
    category: 'conversation_insights',
    title: 'User Intent Recognition',
    summary: 'Patterns for understanding user requests and providing relevant responses',
    details: {
      intent_categories: ['create_automation', 'debug_issue', 'request_help', 'configure_platform'],
      context_clues: ['keywords', 'previous_messages', 'user_history'],
      response_strategies: 'Match response detail to user technical level',
      clarification_patterns: 'Ask specific questions when intent is unclear'
    },
    tags: ['intent', 'conversation', 'user_experience'],
    priority: 8
  },

  // Summary Templates
  {
    category: 'summary_templates',
    title: 'Automation Summary Template',
    summary: 'Standard format for describing automation workflows',
    details: {
      template_structure: {
        overview: 'Brief description of what the automation accomplishes',
        trigger: 'What starts the automation',
        steps: 'Sequential list of actions taken',
        outputs: 'What the automation produces or where data goes',
        requirements: 'Credentials, permissions, or setup needed'
      },
      tone: 'Clear, concise, non-technical language for business users',
      length: 'Keep under 150 words for overview, detailed steps as needed'
    },
    tags: ['templates', 'documentation', 'summaries'],
    priority: 7
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting knowledge store seeding...');

    // Check if data already exists
    const { data: existingData, error: checkError } = await supabase
      .from('universal_knowledge_store')
      .select('id')
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (existingData && existingData.length > 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Knowledge store already contains data',
        count: existingData.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert initial knowledge data
    const { data, error } = await supabase
      .from('universal_knowledge_store')
      .insert(initialKnowledgeData.map(entry => ({
        ...entry,
        source_type: 'initial_seed'
      })));

    if (error) {
      throw error;
    }

    console.log(`Successfully seeded ${initialKnowledgeData.length} knowledge entries`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully seeded ${initialKnowledgeData.length} knowledge entries`,
      categories: [...new Set(initialKnowledgeData.map(entry => entry.category))]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Knowledge seeding failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
