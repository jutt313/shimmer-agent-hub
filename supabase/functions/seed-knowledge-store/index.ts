import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const initialKnowledgeData = [
  // Platform Knowledge (Existing entries from your provided code)
  {
    category: 'platform_knowledge',
    title: 'Gmail API Integration',
    summary: 'Gmail API requires OAuth2 authentication and specific scopes for email access',
    details: {
      auth_type: 'oauth2',
      required_scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.labels'],
      base_url: 'https://www.googleapis.com/gmail/v1',
      common_endpoints: ['users/me/messages', 'users/me/profile', 'users/me/labels', 'users/me/threads'],
      rate_limits: '250 quota units per user per 100 seconds, 1,000,000,000 daily project quota',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Your OAuth 2.0 client ID from Google Cloud Console.', example_format: '123456789012-abcdef1234567890abcdef1234567890.apps.googleusercontent.com', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Your OAuth 2.0 client secret from Google Cloud Console.', example_format: 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'redirect_uris', type: 'string_array', description: 'Authorized redirect URIs for your web application.', example_format: '["https://example.com/oauth-callback"]', is_required: true },
        { name: 'refresh_token', type: 'secret', description: 'A long-lived token obtained during the initial OAuth flow, used to get new access tokens.', example_format: '1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'access_token', type: 'secret', description: 'A short-lived token used to make authenticated API requests.', example_format: 'ya29.A0AfH6SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Sending emails programmatically',
        'Reading and parsing incoming emails',
        'Managing email labels and filters',
        'Automating email responses and workflows',
        'Extracting data from email content',
      ],
      associated_tools: [
        'Google APIs Client Libraries (Python, Node.js, Java, etc.)',
        'OAuth 2.0 Playground',
        'Postman/Insomnia for API testing',
        'Google Cloud Console (for credential management)',
        'NodeMailer (Node.js library for sending emails)',
      ],
      webhook_support: false, // Gmail API does not directly support webhooks for new emails without Pub/Sub
      api_version: 'v1'
    },
    tags: ['gmail', 'google', 'email', 'oauth2', 'communication', 'productivity'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Slack API Integration',
    summary: 'Slack requires bot tokens for API access and specific channel permissions',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://slack.com/api',
      required_scopes: ['chat:write', 'channels:read', 'groups:read', 'users:read', 'commands'],
      common_endpoints: ['chat.postMessage', 'conversations.list', 'auth.test', 'users.info', 'views.publish'],
      token_format: 'xoxb-* for bot tokens, xoxp-* for user tokens',
      credential_fields: [
        { name: 'bot_token', type: 'secret', description: 'A token starting with "xoxb-" representing your Slack bot.', example_format: 'xoxb-1234567890-abcdefg1234567890abcdefg', is_required: true },
        { name: 'user_token', type: 'secret', description: 'A token starting with "xoxp-" representing a user\'s permissions (less common for bots).', example_format: 'xoxp-1234567890-abcdefg1234567890abcdefg', is_required: false },
        { name: 'signing_secret', type: 'secret', description: 'Used to verify requests from Slack (e.g., webhooks).', example_format: 'abcdef1234567890abcdef1234567890', is_required: true },
      ],
      credential_use_cases: [
        'Sending messages to channels or users',
        'Creating and managing channels',
        'Responding to slash commands and interactive components',
        'Fetching user and channel information',
        'Automating notifications and alerts',
      ],
      associated_tools: [
        'Slack Bolt (JavaScript/Python SDK)',
        'Slack Block Kit Builder',
        'ngrok (for local development with webhooks)',
        'Slack App Dashboard (for credential management)',
        'cURL for direct API calls',
      ],
      webhook_support: true,
      webhook_events: ['message.channels', 'app_mention', 'link_shared', 'slash_commands'],
      api_version: 'v2'
    },
    tags: ['slack', 'messaging', 'bot', 'api', 'communication', 'collaboration'],
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
      common_endpoints: ['boards', 'cards', 'lists', 'members', 'checklists', 'actions'],
      authentication_url: 'https://trello.com/app-key',
      credential_fields: [
        { name: 'api_key', type: 'string', description: 'Your Trello API Key obtained from the Trello Developer site.', example_format: 'abcdef1234567890abcdef1234567890', is_required: true },
        { name: 'api_token', type: 'secret', description: 'A user-specific token generated for your application via the API Key page.', example_format: 'abcdef1234567890abcdef1234567890abcdef12', is_required: true },
      ],
      credential_use_cases: [
        'Creating and managing Trello boards, lists, and cards',
        'Automating card movements based on triggers',
        'Adding comments or attachments to cards',
        'Fetching board and card data for reporting',
        'Integrating Trello with other project management tools',
      ],
      associated_tools: [
        'Trello.js (JavaScript SDK)',
        'Python Trello API Wrapper',
        'Postman/Insomnia',
        'Trello Power-Ups (for extending functionality)',
        'Trello Developer API Page',
      ],
      webhook_support: true,
      webhook_events: ['createCard', 'updateCard', 'deleteCard', 'createList', 'updateList', 'createBoard'],
      api_version: '1'
    },
    tags: ['trello', 'project_management', 'cards', 'boards', 'productivity', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'OpenAI API Integration',
    summary: 'OpenAI requires API key authentication for AI model access',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://api.openai.com/v1',
      common_endpoints: ['chat/completions', 'models', 'embeddings', 'images/generations', 'audio/transcriptions'],
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'dall-e-3', 'whisper-1', 'text-embedding-ada-002'],
      rate_limits: 'Varies by tier and model (e.g., 500 RPM for gpt-3.5-turbo, 10,000 TPM for gpt-4)',
      credential_fields: [
        { name: 'api_key', type: 'secret', description: 'Your OpenAI API key, starting with "sk-".', example_format: '^sk-[A-Za-z0-9]{48}$', is_required: true },
        { name: 'organization_id', type: 'string', description: 'Your OpenAI organization ID (optional, for specific organization usage).', example_format: 'org-xxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Generating text for various applications (chatbots, content creation)',
        'Creating embeddings for semantic search and recommendation systems',
        'Generating images from text prompts',
        'Transcribing audio into text',
        'Fine-tuning custom models',
      ],
      associated_tools: [
        'OpenAI Python Library',
        'OpenAI Node.js Library',
        'OpenAI Cookbook (Jupyter Notebooks)',
        'OpenAI Playground',
        'LangChain, LlamaIndex (for building LLM applications)',
      ],
      webhook_support: false,
      api_version: 'v1'
    },
    tags: ['openai', 'ai', 'gpt', 'chat', 'llm', 'generative_ai', 'nlp'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'Discord API Integration',
    summary: 'Discord uses bot tokens for API access and guild management',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://discord.com/api/v10',
      common_endpoints: ['channels', 'guilds', 'users', 'messages', 'interactions', 'webhooks'],
      token_format: 'Bot TOKEN_HERE for bot tokens',
      permissions: 'Bot permissions required for each action, defined in Discord Developer Portal',
      credential_fields: [
        { name: 'bot_token', type: 'secret', description: 'The token for your Discord bot, obtained from the Discord Developer Portal.', example_format: 'MTE2NTAxMjc1MDUzNTA2MDk3Ng.Gxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_id', type: 'string', description: 'The client ID of your Discord application.', example_format: '123456789012345678', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'The client secret for your Discord application (for OAuth2 flows).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Sending messages to Discord channels',
        'Managing guild members and roles',
        'Creating interactive commands (slash commands, buttons)',
        'Automating moderation tasks',
        'Fetching user and guild information',
      ],
      associated_tools: [
        'discord.js (Node.js library)',
        'discord.py (Python library)',
        'Discord Developer Portal',
        'ngrok (for local development with webhooks/interactions)',
        'Webhook.site (for testing webhooks)',
      ],
      webhook_support: true,
      webhook_events: ['messageCreate', 'guildMemberAdd', 'interactionCreate'],
      api_version: 'v10'
    },
    tags: ['discord', 'gaming', 'bot', 'messaging', 'community', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Stripe API Integration',
    summary: 'Stripe provides APIs for processing payments, managing subscriptions, and handling payouts.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.stripe.com/v1',
      common_endpoints: ['/customers', '/charges', '/subscriptions', '/products', '/prices', '/payment_intents'],
      rate_limits: '100 requests/second in live mode, 500 requests/second in test mode',
      credential_fields: [
        { name: 'secret_key', type: 'secret', description: 'Your secret API key (starts with `sk_live_` or `sk_test_`). Keep this private.', example_format: '^sk_(live|test)_[A-Za-z0-9]{24}$', is_required: true },
        { name: 'publishable_key', type: 'string', description: 'Your publishable API key (starts with `pk_live_` or `pk_test_`). Used on the frontend.', example_format: '^pk_(live|test)_[A-Za-z0-9]{24}$', is_required: true },
        { name: 'webhook_secret', type: 'secret', description: 'Secret used to sign and verify webhook events.', example_format: 'whsec_xxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Creating charges and processing one-time payments',
        'Managing recurring subscriptions and plans',
        'Handling customer information and payment methods',
        'Issuing refunds and managing disputes',
        'Implementing Stripe Connect for marketplace solutions',
      ],
      associated_tools: [
        'Stripe Node.js Library',
        'Stripe Python Library',
        'Stripe CLI',
        'Stripe Dashboard',
        'Stripe Elements (for frontend payment forms)',
        'Stripe Connect (for platforms)',
      ],
      webhook_support: true,
      webhook_events: ['charge.succeeded', 'invoice.paid', 'customer.subscription.created', 'payment_intent.succeeded'],
      api_version: '2024-06-20' // Example: Date-based API versioning
    },
    tags: ['stripe', 'payments', 'e-commerce', 'fintech', 'subscriptions', 'api'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'Twilio API Integration',
    summary: 'Twilio provides APIs for SMS, voice, video, and authentication services.',
    details: {
      auth_type: 'account_sid_auth_token',
      base_url: 'https://api.twilio.com',
      common_endpoints: ['/2010-04-01/Accounts/{AccountSid}/Messages.json', '/2010-04-01/Accounts/{AccountSid}/Calls.json'],
      rate_limits: 'Varies by product and plan (e.g., 1 SMS per second default, can be increased)',
      credential_fields: [
        { name: 'account_sid', type: 'string', description: 'Your Twilio Account SID.', example_format: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'auth_token', type: 'secret', description: 'Your Twilio Auth Token. Keep this private.', example_format: 'your_auth_token', is_required: true },
        { name: 'phone_number', type: 'string', description: 'A Twilio phone number associated with your account.', example_format: '+15017122661', is_required: false },
      ],
      credential_use_cases: [
        'Sending SMS messages programmatically',
        'Making and receiving voice calls',
        'Implementing two-factor authentication (2FA) with Verify',
        'Building interactive voice response (IVR) systems',
        'Sending WhatsApp messages via Twilio API',
      ],
      associated_tools: [
        'Twilio Node.js Helper Library',
        'Twilio Python Helper Library',
        'Twilio CLI',
        'Twilio Console',
        'ngrok (for local webhook testing)',
      ],
      webhook_support: true,
      webhook_events: ['SMS received', 'call status changes'],
      api_version: '2010-04-01'
    },
    tags: ['twilio', 'sms', 'voice', 'communication', 'otp', 'verification', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'SendGrid API Integration',
    summary: 'SendGrid is a platform for sending transactional and marketing emails.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.sendgrid.com/v3',
      common_endpoints: ['/mail/send', '/stats', '/templates'],
      rate_limits: '100 requests per second by default (can be increased)',
      credential_fields: [
        { name: 'api_key', type: 'secret', description: 'Your SendGrid API Key. Ensure it has appropriate permissions.', example_format: 'SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Sending transactional emails (order confirmations, password resets)',
        'Sending marketing emails and newsletters',
        'Tracking email delivery and engagement metrics',
        'Managing email templates and dynamic content',
        'Handling bounces and spam reports',
      ],
      associated_tools: [
        'SendGrid Node.js Library',
        'SendGrid Python Library',
        'SendGrid UI Dashboard',
        'Postman/Insomnia',
        'email-validator libraries',
      ],
      webhook_support: true,
      webhook_events: ['delivered', 'open', 'click', 'bounce', 'spamreport', 'dropped'],
      api_version: 'v3'
    },
    tags: ['sendgrid', 'email', 'marketing', 'transactional_email', 'smtp', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'GitHub API Integration',
    summary: 'GitHub API provides programmatic access to repositories, users, issues, and more.',
    details: {
      auth_type: 'personal_access_token',
      required_scopes: ['repo', 'user', 'admin:org', 'workflow'],
      base_url: 'https://api.github.com',
      common_endpoints: ['/user', '/repos/{owner}/{repo}/issues', '/orgs/{org}/members', '/repos/{owner}/{repo}/actions/workflows'],
      rate_limits: '5000 requests per hour per authenticated user (for REST), 5000 points per hour for GraphQL',
      credential_fields: [
        { name: 'personal_access_token', type: 'secret', description: 'A long-lived token generated from GitHub settings, used for authentication.', example_format: '^ghp_[A-Za-z0-9]{36}$', is_required: true },
        { name: 'client_id', type: 'string', description: 'Client ID for OAuth Apps.', example_format: 'Iv1.ABCDEFG12345', is_required: false },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for OAuth Apps.', example_format: 'XYZABCDEFG12345', is_required: false },
        { name: 'app_id', type: 'string', description: 'Application ID for GitHub Apps.', example_format: '123456', is_required: false },
        { name: 'private_key', type: 'secret', description: 'PEM encoded private key for GitHub Apps.', example_format: '-----BEGIN RSA PRIVATE KEY-----...', is_required: false },
      ],
      credential_use_cases: [
        'Automating repository creation and management',
        'Fetching commit history and branch information',
        'Managing issues and pull requests',
        'Integrating with CI/CD pipelines (GitHub Actions)',
        'Automating user and organization management',
        'Fetching data for code analysis and reporting',
      ],
      associated_tools: [
        'Octokit (JavaScript/TypeScript SDK)',
        'PyGithub (Python SDK)',
        'GitHub CLI',
        'Postman/Insomnia',
        'GitHub Actions',
        'Git',
      ],
      webhook_support: true,
      webhook_events: ['push', 'pull_request', 'issues', 'issue_comment', 'workflow_run', 'star'],
      api_version: '2022-11-28' // Date-based API versioning
    },
    tags: ['github', 'git', 'version_control', 'devops', 'api', 'automation', 'collaboration'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Google Cloud Platform (GCP) APIs',
    summary: 'Access to various Google Cloud services including Compute Engine, Cloud Storage, BigQuery, and more.',
    details: {
      auth_type: 'service_account',
      base_url: 'https://{service}.googleapis.com',
      common_endpoints: ['compute.googleapis.com', 'storage.googleapis.com', 'bigquery.googleapis.com', 'cloudfunctions.googleapis.com'],
      rate_limits: 'Varies by service, often quota-based per project per minute/day',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account, containing private_key_id, private_key, client_email, etc.', example_format: '{ "type": "service_account", "project_id": "...", "private_key_id": "...", "private_key": "...", "client_email": "...", "client_id": "...", "auth_uri": "...", "token_uri": "...", "auth_provider_x509_cert_url": "...", "client_x509_cert_url": "..." }', is_required: true },
        { name: 'project_id', type: 'string', description: 'Your Google Cloud Project ID.', example_format: 'my-gcp-project-12345', is_required: true },
      ],
      credential_use_cases: [
        'Managing virtual machines and compute resources',
        'Storing and retrieving data from Cloud Storage buckets',
        'Running queries and managing datasets in BigQuery',
        'Deploying and invoking serverless functions (Cloud Functions)',
        'Integrating AI/ML services like Vertex AI and Vision AI',
      ],
      associated_tools: [
        'Google Cloud Client Libraries (multiple languages)',
        'gcloud CLI',
        'Google Cloud Console',
        'Terraform (for infrastructure as code)',
        'Cloud Monitoring/Logging',
      ],
      webhook_support: true, // Via Pub/Sub for various services
      webhook_events: ['Cloud Storage object change', 'Pub/Sub message arrival'],
      api_version: 'v1'
    },
    tags: ['gcp', 'google_cloud', 'cloud_computing', 'compute', 'storage', 'database', 'ai', 'bigquery', 'api'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'Amazon Web Services (AWS) APIs',
    summary: 'Access to AWS services like EC2, S3, Lambda, DynamoDB, RDS, and many more.',
    details: {
      auth_type: 'access_key_secret_key',
      base_url: 'https://{service}.{region}.amazonaws.com',
      common_endpoints: ['s3.amazonaws.com', 'ec2.{region}.amazonaws.com', 'lambda.{region}.amazonaws.com', 'dynamodb.{region}.amazonaws.com'],
      rate_limits: 'Varies by service (e.g., S3 3500 PUT/COPY/POST/DELETE, 5500 GET/HEAD requests per second per prefix)',
      credential_fields: [
        { name: 'aws_access_key_id', type: 'string', description: 'Your AWS Access Key ID.', is_required: true },
        { name: 'aws_secret_access_key', type: 'secret', description: 'Your AWS Secret Access Key. Keep this highly private.', is_required: true },
        { name: 'aws_session_token', type: 'secret', description: 'Temporary session token for IAM roles or federated users.', is_required: false },
        { name: 'aws_region', type: 'string', description: 'The AWS region to interact with (e.g., us-east-1).', example_format: 'us-east-1', is_required: true },
      ],
      credential_use_cases: [
        'Managing virtual servers (EC2 instances)',
        'Storing and retrieving objects in S3 buckets',
        'Executing serverless functions (Lambda)',
        'Interacting with NoSQL databases (DynamoDB)',
        'Managing relational databases (RDS)',
        'Building event-driven architectures with SQS/SNS',
      ],
      associated_tools: [
        'AWS SDKs (Python Boto3, JavaScript, Java, etc.)',
        'AWS CLI',
        'AWS Management Console',
        'Terraform / AWS CloudFormation',
        'Serverless Framework',
      ],
      webhook_support: true, // Via SNS, SQS, EventBridge
      webhook_events: ['S3 object creation', 'DynamoDB stream updates', 'CloudWatch alarms'],
      api_version: '2016-11-15' // Example: version per service
    },
    tags: ['aws', 'amazon_web_services', 'cloud_computing', 'compute', 'storage', 'database', 'serverless', 'api'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'Microsoft Azure APIs',
    summary: 'APIs for interacting with Azure services like Virtual Machines, Blob Storage, Azure Functions, Cosmos DB.',
    details: {
      auth_type: 'azure_ad_service_principal',
      base_url: 'https://management.azure.com',
      common_endpoints: ['/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachines', '/{storageAccountName}.blob.core.windows.net'],
      rate_limits: 'Varies by service, often subscription-based',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'The application (client) ID of your Azure AD App Registration.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'The client secret value for your Azure AD App Registration.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'tenant_id', type: 'string', description: 'The directory (tenant) ID of your Azure AD tenant.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'subscription_id', type: 'string', description: 'Your Azure subscription ID.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Deploying and managing Azure Virtual Machines',
        'Storing and managing data in Azure Blob Storage',
        'Developing and deploying serverless applications with Azure Functions',
        'Interacting with Azure Cosmos DB (NoSQL database)',
        'Managing Azure resources programmatically',
      ],
      associated_tools: [
        'Azure SDKs (Python, Node.js, .NET, Java, etc.)',
        'Azure CLI',
        'Azure Portal',
        'Azure PowerShell',
        'Terraform',
      ],
      webhook_support: true, // Via Event Grid
      webhook_events: ['Blob created', 'Resource Group change', 'Event Hub message'],
      api_version: '2020-06-01' // Example: version per resource provider
    },
    tags: ['azure', 'microsoft_azure', 'cloud_computing', 'compute', 'storage', 'database', 'serverless', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Shopify Admin API',
    summary: 'Shopify Admin API allows merchants to manage their stores, products, orders, and customers programmatically.',
    details: {
      auth_type: 'access_token',
      base_url: 'https://{shop_domain}/admin/api/{api_version}',
      common_endpoints: ['/products.json', '/orders.json', '/customers.json', '/webhooks.json'],
      rate_limits: '2 requests/second for REST, 50 points/second for GraphQL (default)',
      credential_fields: [
        { name: 'access_token', type: 'secret', description: 'A private app access token or an OAuth access token.', example_format: 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'shop_domain', type: 'string', description: 'The domain of the Shopify store (e.g., your-store.myshopify.com).', example_format: 'your-store.myshopify.com', is_required: true },
        { name: 'api_key', type: 'string', description: 'API Key for Public Apps (OAuth flow).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'api_secret_key', type: 'secret', description: 'API Secret Key for Public Apps (OAuth flow).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Automating product uploads and inventory updates',
        'Retrieving and processing new orders',
        'Managing customer accounts and data',
        'Syncing data between Shopify and other systems (CRM, ERP)',
        'Building custom storefronts or sales channels',
      ],
      associated_tools: [
        'Shopify Node.js API Library',
        'Shopify Python API Library',
        'Shopify CLI (for app development)',
        'Postman/Insomnia',
        'Shopify Partner Dashboard',
      ],
      webhook_support: true,
      webhook_events: ['products/create', 'orders/create', 'customers/create', 'app/uninstalled'],
      api_version: '2024-04'
    },
    tags: ['shopify', 'e-commerce', 'api', 'store_management', 'products', 'orders'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Mailchimp API Integration',
    summary: 'Mailchimp API allows managing audiences, campaigns, and reports for email marketing.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://{dc}.api.mailchimp.com/3.0',
      common_endpoints: ['/lists', '/campaigns', '/automations', '/reports'],
      rate_limits: '10 requests per second',
      credential_fields: [
        { name: 'api_key', type: 'secret', description: 'Your Mailchimp API key, including the data center prefix (e.g., us1, us2).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1', is_required: true },
      ],
      credential_use_cases: [
        'Adding and updating subscribers in audiences',
        'Sending email campaigns programmatically',
        'Automating email sequences',
        'Retrieving campaign performance reports',
        'Managing tags and segments for targeted marketing',
      ],
      associated_tools: [
        'Mailchimp Node.js SDK',
        'Mailchimp Python SDK',
        'Mailchimp Dashboard',
        'Postman/Insomnia',
        'Zapier (for integrations)',
      ],
      webhook_support: true,
      webhook_events: ['subscribe', 'unsubscribe', 'profile update', 'cleaned'],
      api_version: '3.0'
    },
    tags: ['mailchimp', 'email_marketing', 'crm', 'automation', 'newsletter', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'HubSpot API Integration',
    summary: 'HubSpot APIs provide access to CRM, Marketing, Sales, and Service Hub functionalities.',
    details: {
      auth_type: 'oauth2_api_key',
      base_url: 'https://api.hubapi.com',
      common_endpoints: ['/crm/v3/objects/contacts', '/crm/v3/objects/companies', '/crm/v3/objects/deals', '/marketing/v3/emails'],
      rate_limits: '100 requests per 10 seconds per HubSpot account for API keys, 100 requests per 10 seconds per app for OAuth',
      credential_fields: [
        { name: 'hapikey', type: 'secret', description: 'Your HubSpot API Key (legacy, still supported for private apps).', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: false },
        { name: 'access_token', type: 'secret', description: 'OAuth access token obtained through the OAuth flow (preferred for public apps).', example_format: 'Cxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'client_id', type: 'string', description: 'Client ID for OAuth applications.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: false },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for OAuth applications.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: false },
        { name: 'redirect_uri', type: 'string', description: 'Redirect URI for OAuth applications.', example_format: 'https://example.com/oauth-callback', is_required: false },
      ],
      credential_use_cases: [
        'Creating and updating contacts, companies, and deals',
        'Managing email lists and sending marketing emails',
        'Automating sales and marketing workflows',
        'Retrieving CRM data for reporting and analytics',
        'Integrating with sales and service tools',
      ],
      associated_tools: [
        'HubSpot Node.js Client Library',
        'HubSpot Python Client Library',
        'HubSpot Developer Portal',
        'Postman/Insomnia',
        'Zapier, Make (formerly Integromat)',
      ],
      webhook_support: true,
      webhook_events: ['contact.creation', 'deal.propertyChange', 'company.deletion'],
      api_version: 'v3'
    },
    tags: ['hubspot', 'crm', 'marketing_automation', 'sales', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Salesforce APIs',
    summary: 'Salesforce offers various APIs (REST, SOAP, Bulk, Streaming) for interacting with CRM data and platform features.',
    details: {
      auth_type: 'oauth2_connected_app',
      base_url: 'https://{instance}.salesforce.com/services/data/v{version}/',
      common_endpoints: ['/sobjects/Account', '/sobjects/Contact', '/query'],
      rate_limits: 'Varies by edition and API type (e.g., 15,000 requests/day for Developer Edition)',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Consumer Key from your Salesforce Connected App.', example_format: '3MVG9Wt4xxxxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Consumer Secret from your Salesforce Connected App.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'username', type: 'string', description: 'Salesforce username for API access (often with security token).', example_format: 'user@example.com', is_required: false },
        { name: 'password', type: 'secret', description: 'Salesforce password for API access.', is_required: false },
        { name: 'security_token', type: 'secret', description: 'Salesforce security token (if IP range is not whitelisted).', is_required: false },
        { name: 'access_token', type: 'secret', description: 'OAuth access token for authenticated requests.', example_format: '00Dxx000000xxxx!AQARxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Creating, reading, updating, and deleting CRM records (Accounts, Contacts, Leads, Opportunities)',
        'Running SOQL queries to extract specific data',
        'Automating business processes and workflows',
        'Integrating Salesforce with other enterprise systems (ERP, marketing automation)',
        'Building custom applications on the Salesforce platform',
      ],
      associated_tools: [
        'Salesforce Apex (for server-side logic)',
        'Salesforce CLI (sfdx)',
        'JSforce (JavaScript SDK)',
        'Simple-Salesforce (Python SDK)',
        'Salesforce Workbench',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Platform Events, Outbound Messages, Apex Triggers
      webhook_events: ['record created', 'record updated', 'record deleted'],
      api_version: '59.0'
    },
    tags: ['salesforce', 'crm', 'saas', 'enterprise', 'api', 'automation'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Asana API Integration',
    summary: 'Asana API allows managing tasks, projects, workspaces, and users for project management.',
    details: {
      auth_type: 'personal_access_token_oauth2',
      base_url: 'https://app.asana.com/api/1.0',
      common_endpoints: ['/tasks', '/projects', '/workspaces', '/users'],
      rate_limits: '150 requests per minute per user per app (default)',
      credential_fields: [
        { name: 'personal_access_token', type: 'secret', description: 'A long-lived token generated from Asana Developer Console.', example_format: '1/1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW', is_required: true },
        { name: 'client_id', type: 'string', description: 'Client ID for OAuth applications.', example_format: '1234567890123456', is_required: false },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for OAuth applications.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Creating, updating, and assigning tasks',
        'Managing projects and sections',
        'Adding comments and attachments to tasks',
        'Fetching task and project data for reporting',
        'Automating workflows based on task status changes',
      ],
      associated_tools: [
        'Asana Node.js Client Library',
        'Asana Python Client Library',
        'Asana Developer Console',
        'Postman/Insomnia',
        'Zapier, Make',
      ],
      webhook_support: true,
      webhook_events: ['task added', 'task completed', 'task moved', 'project updated'],
      api_version: '1.0'
    },
    tags: ['asana', 'project_management', 'tasks', 'collaboration', 'api', 'productivity'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Jira Cloud Platform API',
    summary: 'Jira Cloud REST API allows integration with Jira projects, issues, workflows, and users.',
    details: {
      auth_type: 'basic_auth_api_token_oauth',
      base_url: 'https://{your-domain}.atlassian.net/rest/api/3',
      common_endpoints: ['/issue', '/project', '/user', '/search'],
      rate_limits: 'Varies, typically 400 requests per 10 seconds per IP address',
      credential_fields: [
        { name: 'email', type: 'string', description: 'The email address of a Jira user.', example_format: 'user@example.com', is_required: true },
        { name: 'api_token', type: 'secret', description: 'An API token generated from your Atlassian account security settings.', example_format: 'ATATTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'jira_domain', type: 'string', description: 'Your Jira Cloud instance domain (e.g., your-company.atlassian.net).', example_format: 'your-company.atlassian.net', is_required: true },
        { name: 'client_id', type: 'string', description: 'Client ID for OAuth 2.0 (Forge/Connect apps).', example_format: 'your-client-id', is_required: false },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for OAuth 2.0 (Forge/Connect apps).', example_format: 'your-client-secret', is_required: false },
      ],
      credential_use_cases: [
        'Creating, updating, and transitioning Jira issues',
        'Fetching project and issue details for reporting',
        'Automating issue assignments and comments',
        'Integrating Jira with CI/CD tools',
        'Synchronizing data with other ticketing systems',
      ],
      associated_tools: [
        'Jira REST API Documentation',
        'Atlassian Forge CLI',
        'Atlassian Connect framework',
        'Jira Python API',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['jira:issue_created', 'jira:issue_updated', 'jira:issue_deleted', 'comment_created'],
      api_version: '3'
    },
    tags: ['jira', 'atlassian', 'project_management', 'issue_tracking', 'agile', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Confluence Cloud API',
    summary: 'Confluence Cloud REST API allows managing content (pages, blogs), spaces, and users.',
    details: {
      auth_type: 'basic_auth_api_token_oauth',
      base_url: 'https://api.atlassian.com/ex/confluence/{cloud_id}/rest/api',
      common_endpoints: ['/content', '/space', '/user'],
      rate_limits: 'Varies, typically 400 requests per 10 seconds per IP address',
      credential_fields: [
        { name: 'email', type: 'string', description: 'The email address of a Confluence user.', example_format: 'user@example.com', is_required: true },
        { name: 'api_token', type: 'secret', description: 'An API token generated from your Atlassian account security settings.', example_format: 'ATATTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'cloud_id', type: 'string', description: 'Your Atlassian Cloud ID, found in the Confluence URL or Developer Console.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Creating and updating Confluence pages and blog posts',
        'Fetching content for documentation portals',
        'Managing spaces and permissions',
        'Automating content publishing and archiving',
        'Integrating with knowledge bases and internal tools',
      ],
      associated_tools: [
        'Confluence REST API Documentation',
        'Atlassian Forge CLI',
        'Atlassian Connect framework',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['confluence:page_created', 'confluence:page_updated', 'confluence:page_removed'],
      api_version: 'latest' // Confluence Cloud often uses 'latest' path
    },
    tags: ['confluence', 'atlassian', 'documentation', 'knowledge_base', 'collaboration', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Google Drive API Integration',
    summary: 'Google Drive API enables managing files and folders, including uploading, downloading, and sharing.',
    details: {
      auth_type: 'oauth2',
      required_scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file'],
      base_url: 'https://www.googleapis.com/drive/v3',
      common_endpoints: ['/files', '/files/{fileId}/permissions', '/changes'],
      rate_limits: '1,000,000,000 daily project quota units, 1000 queries per 100 seconds per user',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Your OAuth 2.0 client ID from Google Cloud Console.', example_format: '123456789012-abcdef1234567890abcdef1234567890.apps.googleusercontent.com', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Your OAuth 2.0 client secret from Google Cloud Console.', example_format: 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'redirect_uris', type: 'string_array', description: 'Authorized redirect URIs for your web application.', example_format: '["https://example.com/oauth-callback"]', is_required: true },
        { name: 'refresh_token', type: 'secret', description: 'A long-lived token used to obtain new access tokens.', is_required: false },
      ],
      credential_use_cases: [
        'Uploading and downloading files to/from Google Drive',
        'Managing folder structures and file permissions',
        'Searching for specific files and content',
        'Integrating with document management systems',
        'Automating file backups and synchronization',
      ],
      associated_tools: [
        'Google APIs Client Libraries',
        'Google Drive SDK for Android/iOS',
        'gcloud CLI',
        'Google Cloud Console',
      ],
      webhook_support: true, // Via Drive Push Notifications (Pub/Sub)
      webhook_events: ['file created', 'file updated', 'file deleted'],
      api_version: 'v3'
    },
    tags: ['google_drive', 'file_storage', 'cloud_storage', 'collaboration', 'api', 'productivity'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Zoom API Integration',
    summary: 'Zoom API enables management of meetings, webinars, users, and reports.',
    details: {
      auth_type: 'oauth2_jwt',
      base_url: 'https://api.zoom.us/v2',
      common_endpoints: ['/users', '/meetings', '/webinars', '/reports'],
      rate_limits: '30 requests/second per API, 100 requests/second account-wide',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Client ID for your Zoom OAuth App.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for your Zoom OAuth App.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'account_id', type: 'string', description: 'Account ID for JWT App credentials (legacy).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'jwt_api_key', type: 'secret', description: 'JWT API Key (legacy).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'jwt_api_secret', type: 'secret', description: 'JWT API Secret (legacy).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Creating, updating, and deleting Zoom meetings/webinars',
        'Managing Zoom users and accounts',
        'Retrieving meeting attendance and recording data',
        'Integrating Zoom with calendaring and CRM systems',
        'Automating meeting scheduling and follow-ups',
      ],
      associated_tools: [
        'Zoom API SDKs (Node.js, Python)',
        'Zoom App Marketplace',
        'Postman/Insomnia',
        'JWT.io (for JWT debugging)',
      ],
      webhook_support: true,
      webhook_events: ['meeting.created', 'meeting.ended', 'user.created', 'recording.completed'],
      api_version: 'v2'
    },
    tags: ['zoom', 'video_conferencing', 'meetings', 'webinars', 'communication', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'X (Twitter) API v2',
    summary: 'The X API v2 provides access to tweets, users, spaces, and real-time streams.',
    details: {
      auth_type: 'bearer_token_oauth1_oauth2',
      base_url: 'https://api.twitter.com/2',
      common_endpoints: ['/tweets', '/users', '/spaces', '/tweets/search/recent'],
      rate_limits: 'Varies by endpoint and access level (e.g., 50 requests/15min for tweets search)',
      credential_fields: [
        { name: 'bearer_token', type: 'secret', description: 'A long-lived token for accessing public data.', example_format: 'AAAAAAAAAAAAAAAAAAAAANxxxxxx%2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'consumer_key', type: 'string', description: 'API Key for OAuth 1.0a and OAuth 2.0 Client.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'consumer_secret', type: 'secret', description: 'API Secret Key for OAuth 1.0a and OAuth 2.0 Client.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'access_token', type: 'secret', description: 'Access Token for OAuth 1.0a (user context).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'access_token_secret', type: 'secret', description: 'Access Token Secret for OAuth 1.0a (user context).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Posting tweets and managing user timelines',
        'Searching for tweets by keywords, hashtags, or users',
        'Analyzing social media trends and sentiment',
        'Building social listening and engagement tools',
        'Managing followers and direct messages',
      ],
      associated_tools: [
        'Twarc (Python CLI tool)',
        'Tweepy (Python library)',
        'twitter-api-v2 (Node.js library)',
        'Postman/Insomnia',
        'X Developer Platform',
      ],
      webhook_support: true, // Via Webhooks for Account Activity API (premium)
      webhook_events: ['tweet.create', 'like.create', 'follow.create', 'dm.create'],
      api_version: '2'
    },
    tags: ['x', 'twitter', 'social_media', 'api', 'marketing', 'data_analysis'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'LinkedIn Marketing API',
    summary: 'LinkedIn Marketing API allows managing ad campaigns, accounts, and retrieving ad analytics.',
    details: {
      auth_type: 'oauth2',
      base_url: 'https://api.linkedin.com/v2',
      common_endpoints: ['/adAccounts', '/adCampaigns', '/adCreatives', '/organizationalEntityAcls'],
      rate_limits: 'Varies by endpoint and request type, typically 200 requests/5min',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Client ID for your LinkedIn OAuth App.', example_format: 'xxxxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for your LinkedIn OAuth App.', example_format: 'xxxxxxxxxxxxxx', is_required: true },
        { name: 'redirect_uri', type: 'string', description: 'Authorized Redirect URI for your OAuth App.', example_format: 'https://example.com/callback', is_required: true },
        { name: 'access_token', type: 'secret', description: 'OAuth access token for authenticated requests.', example_format: 'A0AQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Creating and managing LinkedIn ad campaigns',
        'Targeting specific audiences with ads',
        'Retrieving ad performance and spend data',
        'Automating content posting to company pages',
        'Managing organizational entities and permissions',
      ],
      associated_tools: [
        'LinkedIn Marketing API Documentation',
        'Postman/Insomnia',
        'LinkedIn Developer Platform',
      ],
      webhook_support: true, // Via Webhooks for Company Page updates, Share updates etc.
      webhook_events: ['urn:li:ugcPost', 'urn:li:share'],
      api_version: 'v2'
    },
    tags: ['linkedin', 'marketing', 'social_media', 'advertising', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Meta (Facebook) Graph API',
    summary: 'The Graph API is the primary way to get data into and out of the Facebook platform.',
    details: {
      auth_type: 'access_token',
      base_url: 'https://graph.facebook.com/v{version}',
      common_endpoints: ['/me', '/{page-id}/posts', '/{user-id}/photos', '/{ad-account-id}/campaigns'],
      rate_limits: 'Varies by app, endpoint, and user (typically time-based and call-count based)',
      credential_fields: [
        { name: 'access_token', type: 'secret', description: 'User, Page, or System User access token.', example_format: 'EAACEdEose0cBAJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'app_id', type: 'string', description: 'Your Facebook App ID.', example_format: '123456789012345', is_required: true },
        { name: 'app_secret', type: 'secret', description: 'Your Facebook App Secret.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Managing Facebook Pages and groups',
        'Posting content to timelines',
        'Analyzing user and page insights',
        'Managing Facebook Ads and campaigns',
        'Integrating with Messenger bots',
      ],
      associated_tools: [
        'Facebook SDKs (JavaScript, PHP, Python, etc.)',
        'Graph API Explorer',
        'Meta for Developers Dashboard',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['page_post', 'comments', 'messages', 'leads'],
      api_version: '19.0'
    },
    tags: ['meta', 'facebook', 'instagram', 'whatsapp', 'graph_api', 'social_media', 'marketing', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Google Analytics Data API (GA4)',
    summary: 'Access to Google Analytics 4 (GA4) property data for reporting and analytics.',
    details: {
      auth_type: 'oauth2_service_account',
      base_url: 'https://analyticsdata.googleapis.com/v1beta',
      common_endpoints: ['/properties/{propertyId}:runReport'],
      rate_limits: '200 requests per 100 seconds per project',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account with GA4 permissions.', is_required: true },
        { name: 'property_id', type: 'string', description: 'Your Google Analytics 4 Property ID.', example_format: '123456789', is_required: true },
      ],
      credential_use_cases: [
        'Retrieving website and app usage data (page views, events, users)',
        'Building custom dashboards and reports',
        'Analyzing user behavior and campaign performance',
        'Integrating analytics data into internal systems',
        'Automating data exports for advanced analysis',
      ],
      associated_tools: [
        'Google Analytics Data API Client Libraries',
        'Google Cloud Console',
        'Google Tag Manager',
        'Looker Studio (for visualization)',
      ],
      webhook_support: false, // Data API is for pulling data, not push events
      api_version: 'v1beta'
    },
    tags: ['google_analytics', 'ga4', 'analytics', 'data_reporting', 'web_analytics', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Notion API Integration',
    summary: 'Notion API enables programmatic interaction with pages, databases, and blocks within Notion workspaces.',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://api.notion.com/v1',
      common_endpoints: ['/databases', '/pages', '/blocks'],
      rate_limits: '3 requests per second per integration (can burst to 10/s)',
      credential_fields: [
        { name: 'notion_api_token', type: 'secret', description: 'An integration token obtained from your Notion workspace settings.', example_format: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Creating and updating Notion database entries',
        'Fetching content from Notion pages',
        'Automating content generation for documentation or wikis',
        'Syncing data between Notion and other task management tools',
        'Building custom interfaces on top of Notion data',
      ],
      associated_tools: [
        'Notion SDK for JavaScript',
        'Notion Python Client',
        'Notion Developer Console',
        'Postman/Insomnia',
        'Make (formerly Integromat)',
      ],
      webhook_support: true, // Via Webhooks
      webhook_events: ['page_updated', 'database_updated', 'block_created'],
      api_version: '2022-06-28'
    },
    tags: ['notion', 'productivity', 'knowledge_base', 'project_management', 'api', 'databases', 'collaboration'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Airtable API Integration',
    summary: 'Airtable API allows interacting with bases, tables, and records for flexible data management.',
    details: {
      auth_type: 'api_key_bearer_token',
      base_url: 'https://api.airtable.com/v0',
      common_endpoints: ['/{baseId}/{tableName}', '/meta/bases'],
      rate_limits: '5 requests per second per base',
      credential_fields: [
        { name: 'airtable_api_key', type: 'secret', description: 'Your personal Airtable API key (legacy, found in account settings).', example_format: 'keyxxxxxxxxxxxxxx', is_required: false },
        { name: 'access_token', type: 'secret', description: 'An OAuth access token for granular permissions (preferred).', example_format: 'patxxxxxxxxxxxxxx', is_required: true },
        { name: 'base_id', type: 'string', description: 'The ID of the Airtable base you want to access.', example_format: 'appxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Creating, reading, updating, and deleting records in Airtable tables',
        'Automating data entry and updates',
        'Building custom forms and dashboards on top of Airtable',
        'Syncing data between Airtable and other CRMs or project management tools',
        'Fetching data for reporting and analysis',
      ],
      associated_tools: [
        'Airtable.js (JavaScript SDK)',
        'Airtable Python API Client',
        'Airtable API Documentation',
        'Postman/Insomnia',
        'Zapier, Make',
      ],
      webhook_support: true,
      webhook_events: ['record created', 'record updated', 'record deleted'],
      api_version: 'v0'
    },
    tags: ['airtable', 'database', 'spreadsheet', 'no-code', 'automation', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Auth0 Management API',
    summary: 'Auth0 Management API allows programmatic control over users, roles, applications, and connections.',
    details: {
      auth_type: 'bearer_token_machine_to_machine',
      base_url: 'https://{your_domain}/api/v2',
      common_endpoints: ['/users', '/roles', '/clients', '/connections'],
      rate_limits: 'Varies by endpoint and plan (e.g., 500 requests/minute for tenant-level, 1000/minute for user-level)',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Client ID of your Machine to Machine Application in Auth0.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client Secret of your Machine to Machine Application in Auth0.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'audience', type: 'string', description: 'The audience for the Management API (e.g., https://YOUR_DOMAIN/api/v2/).', example_format: 'https://your-tenant.auth0.com/api/v2/', is_required: true },
        { name: 'auth0_domain', type: 'string', description: 'Your Auth0 tenant domain.', example_format: 'your-tenant.auth0.com', is_required: true },
        { name: 'access_token', type: 'secret', description: 'Machine-to-Machine access token obtained from Auth0 /oauth/token endpoint.', is_required: false },
      ],
      credential_use_cases: [
        'Managing user accounts (create, update, delete)',
        'Assigning and revoking roles to users',
        'Programmatically updating application settings',
        'Synchronizing user data with external systems',
        'Automating user provisioning and de-provisioning',
      ],
      associated_tools: [
        'Auth0 Node.js Management Client',
        'Auth0 Python SDK',
        'Auth0 Dashboard',
        'Postman/Insomnia',
        'JWT.io',
      ],
      webhook_support: true, // Via Hooks or Webhooks in Extensions
      webhook_events: ['user.created', 'user.deleted', 'user.updated_email'],
      api_version: 'v2'
    },
    tags: ['auth0', 'authentication', 'identity_management', 'security', 'user_management', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Stripe Connect API',
    summary: 'Stripe Connect enables platforms to onboard sellers, accept payments, and pay out funds.',
    details: {
      auth_type: 'api_key_oauth',
      base_url: 'https://api.stripe.com/v1',
      common_endpoints: ['/accounts', '/transfers', '/payment_intents'],
      rate_limits: 'Same as Stripe Core API: 100 requests/second in live mode',
      credential_fields: [
        { name: 'secret_key', type: 'secret', description: 'Your platform\'s secret API key.', example_format: '^sk_(live|test)_[A-Za-z0-9]{24}$', is_required: true },
        { name: 'client_id', type: 'string', description: 'Your platform\'s OAuth client ID.', example_format: 'ca_xxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'express_oauth_access_token', type: 'secret', description: 'Access token for a connected Express or Custom account.', example_format: 'ac_xxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Onboarding new sellers or service providers',
        'Facilitating payments between buyers and sellers',
        'Managing payouts to connected accounts',
        'Handling platform fees and revenue sharing',
        'Monitoring account balances and transactions',
      ],
      associated_tools: [
        'Stripe Node.js Library',
        'Stripe CLI',
        'Stripe Dashboard',
        'Stripe Connect Express Onboarding Flow',
      ],
      webhook_support: true,
      webhook_events: ['account.updated', 'account.application.authorized', 'transfer.succeeded', 'payout.succeeded'],
      api_version: '2024-06-20'
    },
    tags: ['stripe', 'payments', 'marketplace', 'fintech', 'connect', 'api'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'PostgreSQL Database Access',
    summary: 'Direct programmatic access to a PostgreSQL database for CRUD operations and complex queries.',
    details: {
      auth_type: 'username_password',
      base_url: 'N/A (direct connection)',
      common_endpoints: 'SQL queries via client library',
      rate_limits: 'Limited by database server resources and connection pooling',
      credential_fields: [
        { name: 'host', type: 'string', description: 'The database server hostname or IP address.', example_format: 'db.example.com', is_required: true },
        { name: 'port', type: 'number', description: 'The database port, typically 5432.', example_format: '5432', is_required: true },
        { name: 'database', type: 'string', description: 'The name of the database to connect to.', example_format: 'mydb', is_required: true },
        { name: 'user', type: 'string', description: 'The database username.', example_format: 'dbuser', is_required: true },
        { name: 'password', type: 'secret', description: 'The database password.', is_required: true },
        { name: 'ssl_mode', type: 'string', description: 'SSL mode for connection (e.g., "require", "prefer", "disable").', example_format: 'require', is_required: false },
      ],
      credential_use_cases: [
        'Storing and retrieving structured data',
        'Performing complex joins and aggregations',
        'Managing application state and user data',
        'Implementing transactional workflows',
        'Generating reports from raw data',
      ],
      associated_tools: [
        'psycopg2 (Python)',
        'node-postgres (Node.js)',
        'pgx (Rust)',
        'DBeaver, pgAdmin (GUI tools)',
        'SQL clients (psql)',
        'ORM libraries (SQLAlchemy, Prisma, Sequelize)',
      ],
      webhook_support: false, // Requires external trigger (e.g., change data capture, pg_cron)
      api_version: 'N/A (SQL standard)'
    },
    tags: ['postgresql', 'database', 'sql', 'relational_database', 'data_storage'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'MySQL Database Access',
    summary: 'Direct programmatic access to a MySQL database for data manipulation.',
    details: {
      auth_type: 'username_password',
      base_url: 'N/A (direct connection)',
      common_endpoints: 'SQL queries via client library',
      rate_limits: 'Limited by database server resources and connection pooling',
      credential_fields: [
        { name: 'host', type: 'string', description: 'The database server hostname or IP address.', example_format: 'mysql.example.com', is_required: true },
        { name: 'port', type: 'number', description: 'The database port, typically 3306.', example_format: '3306', is_required: true },
        { name: 'database', type: 'string', description: 'The name of the database to connect to.', example_format: 'mydb', is_required: true },
        { name: 'user', type: 'string', description: 'The database username.', example_format: 'dbuser', is_required: true },
        { name: 'password', type: 'secret', description: 'The database password.', is_required: true },
      ],
      credential_use_cases: [
        'Storing and retrieving structured application data',
        'Managing user sessions and profiles',
        'Backend for web applications and content management systems',
        'Performing analytics on operational data',
        'Implementing master-slave replication for high availability',
      ],
      associated_tools: [
        'mysql-connector-python (Python)',
        'mysql2 (Node.js)',
        'phpMyAdmin, MySQL Workbench (GUI tools)',
        'SQL clients (mysql CLI)',
        'ORM libraries',
      ],
      webhook_support: false,
      api_version: 'N/A (SQL standard)'
    },
    tags: ['mysql', 'database', 'sql', 'relational_database', 'data_storage'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'MongoDB Atlas API',
    summary: 'MongoDB Atlas API allows programmatic management of clusters, databases, and users.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://cloud.mongodb.com/api/atlas/v1.0',
      common_endpoints: ['/groups/{groupId}/clusters', '/groups/{groupId}/databaseUsers'],
      rate_limits: 'Varies by endpoint',
      credential_fields: [
        { name: 'public_key', type: 'string', description: 'Your MongoDB Atlas Public API Key.', example_format: 'abcdefg1234567890abcdefg', is_required: true },
        { name: 'private_key', type: 'secret', description: 'Your MongoDB Atlas Private API Key.', example_format: 'abcdefg1234567890abcdefg', is_required: true },
        { name: 'group_id', type: 'string', description: 'Your Atlas Project ID.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Automating cluster creation and scaling',
        'Managing database users and access roles',
        'Monitoring cluster performance metrics',
        'Backing up and restoring data',
        'Integrating Atlas with CI/CD pipelines',
      ],
      associated_tools: [
        'MongoDB Atlas CLI',
        'MongoDB Compass (GUI)',
        'MongoDB Shell (mongosh)',
        'Mongoose (Node.js ODM)',
        'PyMongo (Python Driver)',
      ],
      webhook_support: false, // Atlas does not directly offer webhooks for database changes; requires change streams.
      api_version: 'v1.0'
    },
    tags: ['mongodb', 'atlas', 'database', 'nosql', 'document_database', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Google Sheets API Integration',
    summary: 'Google Sheets API enables reading, writing, and formatting data in Google Spreadsheets.',
    details: {
      auth_type: 'oauth2_service_account',
      required_scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
      base_url: 'https://sheets.googleapis.com/v4',
      common_endpoints: ['/spreadsheets/{spreadsheetId}', '/spreadsheets/{spreadsheetId}/values/{range}'],
      rate_limits: '500 requests per 100 seconds per user, 100 requests per 100 seconds per user per sheet',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Your OAuth 2.0 client ID or service account client email.', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Your OAuth 2.0 client secret or service account private key.', is_required: true },
        { name: 'spreadsheet_id', type: 'string', description: 'The ID of the Google Sheet.', example_format: '1Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Reading data from spreadsheets for reporting or application input',
        'Writing data to spreadsheets for logging or tracking',
        'Automating data entry and updates in sheets',
        'Generating reports and summaries in spreadsheet format',
        'Integrating with forms and data collection workflows',
      ],
      associated_tools: [
        'Google APIs Client Libraries',
        'Google Cloud Console',
        'App Script (for serverless sheet automation)',
        'Zapier, Make',
      ],
      webhook_support: false, // Requires Google Apps Script triggers or Pub/Sub for changes
      api_version: 'v4'
    },
    tags: ['google_sheets', 'spreadsheet', 'data_management', 'automation', 'productivity', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Google Calendar API Integration',
    summary: 'Google Calendar API allows managing events, calendars, and attendees.',
    details: {
      auth_type: 'oauth2',
      required_scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
      base_url: 'https://www.googleapis.com/calendar/v3',
      common_endpoints: ['/calendars', '/calendars/{calendarId}/events'],
      rate_limits: '1,000,000,000 daily project quota units, 10,000 requests per 100 seconds per user',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Your OAuth 2.0 client ID.', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Your OAuth 2.0 client secret.', is_required: true },
        { name: 'refresh_token', type: 'secret', description: 'A long-lived token.', is_required: false },
      ],
      credential_use_cases: [
        'Creating, updating, and deleting calendar events',
        'Fetching calendar events for scheduling applications',
        'Managing attendee lists and sending invitations',
        'Automating scheduling tasks and reminders',
        'Syncing calendar data with other productivity tools',
      ],
      associated_tools: [
        'Google APIs Client Libraries',
        'Google Cloud Console',
        'Google Calendar UI',
      ],
      webhook_support: true, // Via Push Notifications (Pub/Sub)
      webhook_events: ['calendar event created', 'calendar event updated', 'calendar event deleted'],
      api_version: 'v3'
    },
    tags: ['google_calendar', 'calendar', 'scheduling', 'productivity', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Plaid API Integration',
    summary: 'Plaid API connects applications to bank accounts for financial data aggregation and payments.',
    details: {
      auth_type: 'client_id_secret_key',
      base_url: 'https://{env}.plaid.com',
      common_endpoints: ['/link/token/create', '/item/public_token/exchange', '/accounts/get', '/transactions/get'],
      rate_limits: 'Varies by product and plan',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Your Plaid client ID.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'secret', type: 'secret', description: 'Your Plaid secret key.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'public_key', type: 'string', description: 'Your Plaid public key (legacy, replaced by client ID for Link).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'environment', type: 'string', description: 'Plaid environment: "development", "sandbox", or "production".', example_format: 'sandbox', is_required: true },
      ],
      credential_use_cases: [
        'Initiating bank account linking (Plaid Link)',
        'Fetching transaction history and account balances',
        'Verifying account ownership',
        'Enabling ACH transfers and other payment methods',
        'Analyzing financial data for personal finance apps',
      ],
      associated_tools: [
        'Plaid Node.js Client Library',
        'Plaid Python Client Library',
        'Plaid Link SDK (frontend)',
        'Plaid Dashboard',
      ],
      webhook_support: true,
      webhook_events: ['TRANSACTIONS_UPDATED', 'ITEM_ERROR', 'ITEM_LOGIN_REQUIRED'],
      api_version: '2020-09-29'
    },
    tags: ['plaid', 'fintech', 'banking', 'payments', 'financial_data', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'DocuSign API Integration',
    summary: 'DocuSign API allows sending, managing, and tracking documents for e-signatures.',
    details: {
      auth_type: 'oauth2_jwt',
      base_url: 'https://{env}.docusign.net/restapi/{apiVersion}/accounts/{accountId}',
      common_endpoints: ['/envelopes', '/envelopes/{envelopeId}/documents', '/templates'],
      rate_limits: 'Typically 1000 API calls per hour per integration key',
      credential_fields: [
        { name: 'integration_key', type: 'string', description: 'Your DocuSign Integration Key (Client ID).', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'rsa_private_key', type: 'secret', description: 'RSA private key for JWT authentication.', is_required: true },
        { name: 'user_id', type: 'string', description: 'The GUID of the impersonated user.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'account_id', type: 'string', description: 'Your DocuSign Account ID.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'environment', type: 'string', description: 'DocuSign environment: "www" (production) or "demo".', example_format: 'demo', is_required: true },
      ],
      credential_use_cases: [
        'Sending documents for electronic signatures',
        'Tracking the status of envelopes (documents sent)',
        'Retrieving signed documents and certificate of completion',
        'Creating and using templates for common documents',
        'Integrating e-signature workflows into business applications',
      ],
      associated_tools: [
        'DocuSign SDKs (C#, Java, Node.js, PHP, Python, Ruby)',
        'DocuSign Developer Center',
        'JWT.io',
      ],
      webhook_support: true,
      webhook_events: ['envelope-sent', 'envelope-completed', 'envelope-voided'],
      api_version: 'v2.1'
    },
    tags: ['docusign', 'e_signature', 'document_management', 'workflow', 'legal', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Zapier Webhooks',
    summary: 'Zapier Webhooks allows sending and receiving data to/from Zapier automations.',
    details: {
      auth_type: 'webhook_url_api_key',
      base_url: 'N/A (webhook URL is the endpoint)',
      common_endpoints: 'The unique Zapier webhook URL',
      rate_limits: 'Varies by Zapier plan (e.g., 100 requests/minute)',
      credential_fields: [
        { name: 'webhook_url', type: 'string', description: 'The unique URL provided by Zapier for receiving data.', example_format: 'https://hooks.zapier.com/hooks/catch/1234567/abcdefg/', is_required: true },
        { name: 'zapier_api_key', type: 'secret', description: 'API Key for private integrations with Zapier (less common).', is_required: false },
      ],
      credential_use_cases: [
        'Triggering Zaps from external applications',
        'Sending data to Zapier to initiate multi-step automations',
        'Receiving processed data back from Zapier (via Webhooks by Zapier (Push) action)',
        'Connecting applications without native integrations',
        'Automating data transfer between disparate systems',
      ],
      associated_tools: [
        'Zapier Webhooks by Zapier app',
        'Zapier platform',
        'Postman/Insomnia (for testing webhooks)',
        'RequestBin, webhook.site',
      ],
      webhook_support: true,
      webhook_events: ['New Catch Hook', 'New Retrieve Poll'],
      api_version: 'N/A'
    },
    tags: ['zapier', 'automation', 'integration', 'no_code', 'low_code', 'webhooks'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Make (Integromat) Webhooks',
    summary: 'Make webhooks allow sending and receiving data to/from Make scenarios for automation.',
    details: {
      auth_type: 'webhook_url',
      base_url: 'N/A (webhook URL is the endpoint)',
      common_endpoints: 'The unique Make webhook URL',
      rate_limits: 'Varies by Make plan',
      credential_fields: [
        { name: 'webhook_url', type: 'string', description: 'The unique URL provided by Make for receiving data.', example_format: 'https://hook.eu1.make.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Triggering Make scenarios from external applications',
        'Sending data to Make to initiate complex automations',
        'Receiving processed data back from Make (via Webhook response)',
        'Connecting applications without native integrations',
        'Building custom API integrations using Make modules',
      ],
      associated_tools: [
        'Make Webhooks module',
        'Make platform',
        'Postman/Insomnia (for testing webhooks)',
        'RequestBin, webhook.site',
      ],
      webhook_support: true,
      webhook_events: ['Webhook trigger'],
      api_version: 'N/A'
    },
    tags: ['make', 'integromat', 'automation', 'integration', 'no_code', 'low_code', 'webhooks'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Google Maps Platform APIs',
    summary: 'Google Maps Platform provides APIs for maps, routes, and places data.',
    details: {
      auth_type: 'api_key_oauth2',
      base_url: 'https://maps.googleapis.com',
      common_endpoints: ['/maps/api/geocode/json', '/maps/api/directions/json', '/maps/api/place/textsearch/json'],
      rate_limits: 'Varies by API and pricing model (pay-as-you-go)',
      credential_fields: [
        { name: 'api_key', type: 'string', description: 'Your Google Maps Platform API key.', example_format: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Displaying interactive maps in web and mobile applications',
        'Geocoding addresses to coordinates and reverse geocoding',
        'Calculating routes and directions between locations',
        'Searching for places of interest (restaurants, businesses)',
        'Implementing autocomplete for addresses and places',
      ],
      associated_tools: [
        'Google Maps JavaScript API',
        'Google Maps SDK for Android/iOS',
        'Google Cloud Console',
        'Postman/Insomnia',
      ],
      webhook_support: false,
      api_version: 'N/A (version in path, e.g., /maps/api/geocode/json)'
    },
    tags: ['Maps', 'maps', 'geospatial', 'location', 'navigation', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Spotify Web API',
    summary: 'Spotify Web API allows access to music, podcasts, artist, and user data.',
    details: {
      auth_type: 'oauth2',
      base_url: 'https://api.spotify.com/v1',
      common_endpoints: ['/me', '/search', '/artists/{id}/albums', '/playlists/{playlist_id}/tracks'],
      rate_limits: 'Typically 50 requests/second',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Client ID for your Spotify for Developers application.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for your Spotify for Developers application.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'redirect_uri', type: 'string', description: 'Authorized redirect URI for your OAuth flow.', example_format: 'http://localhost:8888/callback', is_required: true },
        { name: 'access_token', type: 'secret', description: 'OAuth access token obtained for user or client credentials flow.', is_required: false },
      ],
      credential_use_cases: [
        'Searching for music tracks, artists, albums, and playlists',
        'Creating and managing user playlists',
        'Retrieving user listening history and preferences',
        'Building music discovery and recommendation systems',
        'Integrating music playback into applications',
      ],
      associated_tools: [
        'Spotify Web API Reference',
        'Spotipy (Python Library)',
        'spotify-web-api-node (Node.js Library)',
        'Postman/Insomnia',
      ],
      webhook_support: false, // No direct webhooks for general changes, but limited push for specific events.
      api_version: 'v1'
    },
    tags: ['spotify', 'music', 'streaming', 'audio', 'entertainment', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'YouTube Data API v3',
    summary: 'YouTube Data API allows access to videos, channels, playlists, and user activity.',
    details: {
      auth_type: 'api_key_oauth2',
      base_url: 'https://www.googleapis.com/youtube/v3',
      common_endpoints: ['/search', '/videos', '/channels', '/playlists'],
      rate_limits: '1,000,000 daily quota units',
      credential_fields: [
        { name: 'api_key', type: 'string', description: 'Your Google Cloud Project API Key.', example_format: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_id', type: 'string', description: 'Client ID for OAuth 2.0 (for user-specific data).', is_required: false },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for OAuth 2.0.', is_required: false },
      ],
      credential_use_cases: [
        'Searching for YouTube videos and channels',
        'Retrieving video details, comments, and statistics',
        'Managing playlists and subscriptions',
        'Uploading videos programmatically',
        'Analyzing channel performance',
      ],
      associated_tools: [
        'Google APIs Client Libraries',
        'Google Cloud Console',
        'YouTube Analytics',
      ],
      webhook_support: true, // Via PubSubHubbub for channel updates
      webhook_events: ['channel update', 'new video'],
      api_version: 'v3'
    },
    tags: ['youtube', 'video', 'streaming', 'social_media', 'api', 'content_creation'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Calendly API Integration',
    summary: 'Calendly API allows managing scheduling links, events, and users.',
    details: {
      auth_type: 'personal_access_token_oauth2',
      base_url: 'https://api.calendly.com',
      common_endpoints: ['/users/me', '/scheduled_events', '/event_types'],
      rate_limits: '100 requests per minute',
      credential_fields: [
        { name: 'personal_access_token', type: 'secret', description: 'A long-lived token generated from Calendly settings.', example_format: 'eyJraWQiOiIxxxxxxxxx', is_required: true },
        { name: 'client_id', type: 'string', description: 'Client ID for OAuth applications.', is_required: false },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for OAuth applications.', is_required: false },
      ],
      credential_use_cases: [
        'Fetching scheduled events and invitee details',
        'Retrieving user and event type information',
        'Creating custom scheduling workflows',
        'Integrating with CRM and marketing automation tools',
        'Automating event invitations and reminders',
      ],
      associated_tools: [
        'Calendly API Documentation',
        'Postman/Insomnia',
        'Calendly Admin Interface',
      ],
      webhook_support: true,
      webhook_events: ['invitee.created', 'invitee.canceled', 'event_type.created'],
      api_version: '2'
    },
    tags: ['calendly', 'scheduling', 'productivity', 'meetings', 'automation', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Typeform API Integration',
    summary: 'Typeform API enables managing forms, responses, and webhooks.',
    details: {
      auth_type: 'personal_access_token',
      base_url: 'https://api.typeform.com',
      common_endpoints: ['/forms', '/forms/{form_id}/responses', '/webhooks'],
      rate_limits: '150 requests per minute',
      credential_fields: [
        { name: 'personal_access_token', type: 'secret', description: 'Your Typeform Personal Access Token.', example_format: 'tfp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Retrieving form responses for analysis',
        'Creating and updating forms programmatically',
        'Integrating form data with CRMs or spreadsheets',
        'Automating follow-up actions based on responses',
        'Building custom dashboards for form insights',
      ],
      associated_tools: [
        'Typeform API Documentation',
        'Postman/Insomnia',
        'Typeform UI',
      ],
      webhook_support: true,
      webhook_events: ['form_response'],
      api_version: '1'
    },
    tags: ['typeform', 'forms', 'surveys', 'data_collection', 'automation', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Cloudflare API',
    summary: 'Cloudflare API allows programmatic control of DNS records, caching, firewall rules, and other security settings.',
    details: {
      auth_type: 'api_token_global_key',
      base_url: 'https://api.cloudflare.com/client/v4',
      common_endpoints: ['/zones', '/zones/{zone_id}/dns_records', '/user/tokens'],
      rate_limits: '1200 requests per 5 minutes per user per endpoint',
      credential_fields: [
        { name: 'api_token', type: 'secret', description: 'A scoped API token generated from your Cloudflare profile.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'email', type: 'string', description: 'Your Cloudflare account email (for Global API Key).', example_format: 'user@example.com', is_required: false },
        { name: 'global_api_key', type: 'secret', description: 'Your Global API Key (highly sensitive).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Automating DNS record management',
        'Purging CDN cache for specific URLs',
        'Managing firewall rules and access lists',
        'Configuring page rules and WAF settings',
        'Monitoring zone analytics and logs',
      ],
      associated_tools: [
        'Cloudflare API Documentation',
        'Cloudflare CLI',
        'Terraform Cloudflare Provider',
        'Postman/Insomnia',
      ],
      webhook_support: false, // No native webhooks, usually polled or triggered externally.
      api_version: 'v4'
    },
    tags: ['cloudflare', 'dns', 'cdn', 'security', 'waf', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Datadog API',
    summary: 'Datadog API enables programmatic interaction with monitoring data, dashboards, and alerts.',
    details: {
      auth_type: 'api_key_application_key',
      base_url: 'https://api.datadoghq.com/api/v1',
      common_endpoints: ['/metrics', '/events', '/monitors', '/dashboards'],
      rate_limits: 'Varies by endpoint (e.g., 2000 metrics per 10 seconds)',
      credential_fields: [
        { name: 'api_key', type: 'string', description: 'Your Datadog API Key.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'application_key', type: 'secret', description: 'Your Datadog Application Key.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'site', type: 'string', description: 'Datadog site (e.g., datadoghq.com, eu.datadoghq.com).', example_format: 'datadoghq.com', is_required: true },
      ],
      credential_use_cases: [
        'Sending custom metrics and events to Datadog',
        'Querying and visualizing monitoring data',
        'Creating and managing alerts and monitors',
        'Automating dashboard creation and updates',
        'Integrating with CI/CD for release tracking',
      ],
      associated_tools: [
        'Datadog API Clients (Python, Go, Java, Ruby, Node.js)',
        'Datadog Agent',
        'Datadog UI Dashboard',
        'Terraform Datadog Provider',
      ],
      webhook_support: true, // Via Webhook integrations for alerts
      webhook_events: ['monitor triggered', 'monitor recovered'],
      api_version: 'v1'
    },
    tags: ['datadog', 'monitoring', 'observability', 'metrics', 'logs', 'alerts', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'New Relic API',
    summary: 'New Relic APIs provide access to APM, Infrastructure, Logs, and Synthetics data.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.newrelic.com/v2',
      common_endpoints: ['/applications.json', '/metrics/data.json', '/alert_policies.json'],
      rate_limits: 'Varies by API key type and endpoint',
      credential_fields: [
        { name: 'insights_insert_key', type: 'secret', description: 'Key for inserting custom events into New Relic Insights.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'insights_query_key', type: 'secret', description: 'Key for querying data from New Relic Insights.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'rest_api_key', type: 'secret', description: 'Legacy REST API key for various operations.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'account_id', type: 'string', description: 'Your New Relic account ID.', example_format: '1234567', is_required: true },
      ],
      credential_use_cases: [
        'Sending custom event data for analytics',
        'Querying application performance metrics (APM)',
        'Managing alert policies and conditions',
        'Automating deployment markers and release tracking',
        'Integrating performance data into custom dashboards',
      ],
      associated_tools: [
        'New Relic Python Agent',
        'New Relic Node.js Agent',
        'New Relic One CLI',
        'New Relic UI',
        'NRQL (New Relic Query Language)',
      ],
      webhook_support: true, // Via Webhook notifications for alerts
      webhook_events: ['alert triggered', 'alert resolved'],
      api_version: 'v2'
    },
    tags: ['new_relic', 'monitoring', 'apm', 'observability', 'metrics', 'logs', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Segment API (Tracking & Identify)',
    summary: 'Segment API allows collecting, transforming, and sending customer data to various destinations.',
    details: {
      auth_type: 'write_key',
      base_url: 'https://api.segment.io/v1',
      common_endpoints: ['/track', '/identify', '/page', '/group'],
      rate_limits: 'Varies, typically high throughput',
      credential_fields: [
        { name: 'write_key', type: 'string', description: 'Your Segment Source Write Key.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Collecting customer behavioral data (events)',
        'Identifying users and their traits',
        'Sending data to analytics tools (Google Analytics, Mixpanel)',
        'Sending data to marketing automation platforms (Mailchimp, Braze)',
        'Building a unified customer profile',
      ],
      associated_tools: [
        'Segment Analytics.js (JavaScript)',
        'Segment SDKs (Node.js, Python, iOS, Android, etc.)',
        'Segment Debugger',
        'Segment Connections UI',
      ],
      webhook_support: true, // Via Webhook Destinations
      webhook_events: ['any tracked event', 'identify calls'],
      api_version: 'v1'
    },
    tags: ['segment', 'customer_data_platform', 'analytics', 'cdp', 'data_collection', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Twitch API',
    summary: 'Twitch API provides access to Twitch channel, user, stream, and game data.',
    details: {
      auth_type: 'oauth2_client_credentials',
      base_url: 'https://api.twitch.tv/helix',
      common_endpoints: ['/users', '/streams', '/games', '/eventsub/subscriptions'],
      rate_limits: 'Varies by endpoint (e.g., 800 requests/minute for users endpoint)',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Your Twitch Developer Console Client ID.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Your Twitch Developer Console Client Secret.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'access_token', type: 'secret', description: 'OAuth access token obtained via Client Credentials Flow or Authorization Code Flow.', is_required: false },
      ],
      credential_use_cases: [
        'Fetching live stream information and viewer counts',
        'Retrieving user and channel details',
        'Building chat bots for Twitch channels',
        'Automating stream announcements and moderation',
        'Creating custom overlays and integrations',
      ],
      associated_tools: [
        'Twitch Developer Console',
        'TwitchIO (Python library)',
        'tmi.js (Node.js chat client)',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via EventSub
      webhook_events: ['stream.online', 'channel.follow', 'channel.update', 'channel.chat.message'],
      api_version: 'helix'
    },
    tags: ['twitch', 'streaming', 'gaming', 'social_media', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Shopware 6 Admin API',
    summary: 'Shopware 6 Admin API enables managing products, orders, customers, and content in an e-commerce store.',
    details: {
      auth_type: 'oauth2',
      base_url: 'https://{shop_domain}/api',
      common_endpoints: ['/product', '/order', '/customer', '/cms-page'],
      rate_limits: 'Varies by server configuration',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Client ID for your Shopware API application.', example_format: 'administration', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for your Shopware API application.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'shop_domain', type: 'string', description: 'The domain of your Shopware 6 instance.', example_format: 'shop.example.com', is_required: true },
        { name: 'username', type: 'string', description: 'Admin API Username (for password grant type).', example_format: 'admin', is_required: false },
        { name: 'password', type: 'secret', description: 'Admin API Password (for password grant type).', is_required: false },
      ],
      credential_use_cases: [
        'Automating product creation and inventory updates',
        'Retrieving and processing orders for fulfillment',
        'Managing customer accounts and groups',
        'Syncing product data with external systems (ERP, PIM)',
        'Building custom administrative tools',
      ],
      associated_tools: [
        'Shopware 6 API Documentation',
        'Shopware CLI',
        'Postman/Insomnia',
        'Shopware Administration UI',
      ],
      webhook_support: true, // Via Flow Builder or custom extensions
      webhook_events: ['product.written', 'order.written', 'customer.written'],
      api_version: 'v1'
    },
    tags: ['shopware', 'e_commerce', 'api', 'cms', 'store_management', 'products', 'orders'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Magento 2 REST API',
    summary: 'Magento 2 REST API allows managing catalog, sales, customers, and other e-commerce functionalities.',
    details: {
      auth_type: 'oauth1_api_token_admin_token',
      base_url: 'https://{magento_domain}/rest/{store_code}',
      common_endpoints: ['/products', '/orders', '/customers', '/categories'],
      rate_limits: 'Configurable by server, typically 20 requests per second',
      credential_fields: [
        { name: 'access_token', type: 'secret', description: 'An integration access token obtained from Magento Admin.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'magento_domain', type: 'string', description: 'The domain of your Magento 2 instance.', example_format: 'magento.example.com', is_required: true },
        { name: 'store_code', type: 'string', description: 'The store view code (e.g., "all", "default", "en_us").', example_format: 'default', is_required: true },
      ],
      credential_use_cases: [
        'Automating product synchronization and updates',
        'Retrieving and managing orders and invoices',
        'Managing customer accounts and addresses',
        'Integrating with ERP, CRM, or shipping systems',
        'Building custom extensions and mobile apps',
      ],
      associated_tools: [
        'Magento 2 REST API Reference',
        'Postman/Insomnia',
        'Magento Admin Panel',
        'PHP libraries for Magento API',
      ],
      webhook_support: true, // Via Magento modules or extensions
      webhook_events: ['catalog_product_save_after', 'sales_order_save_after', 'customer_save_after'],
      api_version: 'Varies, typically `/V1` in URL'
    },
    tags: ['magento', 'e_commerce', 'api', 'store_management', 'products', 'orders'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'WooCommerce REST API',
    summary: 'WooCommerce REST API allows managing products, orders, customers, and other e-commerce data on WordPress sites.',
    details: {
      auth_type: 'oauth1',
      base_url: 'https://{wordpress_domain}/wp-json/wc/v3',
      common_endpoints: ['/products', '/orders', '/customers', '/coupons'],
      rate_limits: 'Configurable by server and hosting, typically higher on dedicated hosting',
      credential_fields: [
        { name: 'consumer_key', type: 'string', description: 'WooCommerce Consumer Key generated from WordPress Admin.', example_format: 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'consumer_secret', type: 'secret', description: 'WooCommerce Consumer Secret generated from WordPress Admin.', example_format: 'cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'wordpress_domain', type: 'string', description: 'The domain of your WordPress site.', example_format: 'your-store.com', is_required: true },
      ],
      credential_use_cases: [
        'Creating and updating products and variations',
        'Processing orders and updating order statuses',
        'Managing customer accounts and billing information',
        'Integrating with shipping carriers and payment gateways',
        'Automating inventory management',
      ],
      associated_tools: [
        'WooCommerce REST API Documentation',
        'WooCommerce Python Library',
        'WooCommerce Node.js Library',
        'Postman/Insomnia',
        'WordPress Admin Panel',
      ],
      webhook_support: true,
      webhook_events: ['product.created', 'order.created', 'customer.created', 'coupon.created'],
      api_version: 'v3'
    },
    tags: ['woocommerce', 'wordpress', 'e_commerce', 'api', 'store_management', 'products', 'orders'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Square API Integration',
    summary: 'Square APIs provide tools for payments, orders, customers, inventory, and point-of-sale systems.',
    details: {
      auth_type: 'bearer_token',
      base_url: 'https://connect.squareupsandbox.com/v2' || 'https://connect.squareup.com/v2',
      common_endpoints: ['/payments', '/orders', '/customers', '/inventory'],
      rate_limits: 'Default 60 requests/minute, burst to 100/minute',
      credential_fields: [
        { name: 'access_token', type: 'secret', description: 'Your Square API Access Token (Personal Access Token or OAuth Token).', example_format: 'EAAAECGixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'application_id', type: 'string', description: 'Your Square Application ID.', example_format: 'sq0idp-xxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'location_id', type: 'string', description: 'The ID of the Square location to interact with.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Processing online and in-person payments',
        'Managing customer profiles and loyalty programs',
        'Tracking inventory and product catalog',
        'Creating and fulfilling orders',
        'Integrating with point-of-sale systems',
      ],
      associated_tools: [
        'Square SDKs (Node.js, Python, Java, Ruby, PHP, .NET)',
        'Square Developer Dashboard',
        'Square Web Payments SDK (frontend)',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['payment.created', 'order.updated', 'customer.created', 'inventory.updated'],
      api_version: '2024-06-05'
    },
    tags: ['square', 'payments', 'pos', 'e_commerce', 'retail', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Adyen API Integration',
    summary: 'Adyen APIs offer comprehensive payment processing, risk management, and settlement functionalities.',
    details: {
      auth_type: 'api_key_hmac_signature',
      base_url: 'https://{region}-checkout.adyenpayments.com/v{version}' || 'https://{region}-pal-live.adyen.com/pal/servlet/Payment/v{version}',
      common_endpoints: ['/payments', '/payments/details', '/captures', '/refunds'],
      rate_limits: 'Varies, typically 200 requests/second by default',
      credential_fields: [
        { name: 'api_key', type: 'secret', description: 'Your Adyen API Key.', example_format: 'AQE2Ekywxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_key', type: 'string', description: 'Your Adyen Client Key (for frontend integration).', example_format: 'live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'hmac_key', type: 'secret', description: 'HMAC Key for verifying webhook signatures.', is_required: false },
        { name: 'merchant_account', type: 'string', description: 'Your Adyen Merchant Account name.', example_format: 'YourCompany', is_required: true },
      ],
      credential_use_cases: [
        'Processing various payment methods (cards, local payments, digital wallets)',
        'Managing refunds, captures, and cancellations',
        'Implementing recurring payments and subscriptions',
        'Handling risk management and fraud prevention',
        'Integrating with point-of-sale terminals',
      ],
      associated_tools: [
        'Adyen API Libraries (Java, Python, Node.js, PHP, .NET, Ruby)',
        'Adyen Customer Area',
        'Adyen Checkout SDK (frontend)',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['AUTHORISATION', 'CAPTURE', 'REFUND', 'CHARGEBACK'],
      api_version: '68'
    },
    tags: ['adyen', 'payments', 'fintech', 'e_commerce', 'pos', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Mux API Integration',
    summary: 'Mux API provides video infrastructure for encoding, streaming, and analytics.',
    details: {
      auth_type: 'api_access_token',
      base_url: 'https://api.mux.com',
      common_endpoints: ['/video/v1/assets', '/video/v1/live-streams', '/data/v1/metrics'],
      rate_limits: '100 requests per 10 seconds per endpoint',
      credential_fields: [
        { name: 'mux_access_token_id', type: 'string', description: 'Your Mux Access Token ID.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'mux_access_token_secret', type: 'secret', description: 'Your Mux Access Token Secret.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Uploading and encoding video assets',
        'Creating and managing live streams',
        'Retrieving video playback metrics and analytics',
        'Generating signed URLs for secure video delivery',
        'Building custom video players and platforms',
      ],
      associated_tools: [
        'Mux Node.js SDK',
        'Mux Python SDK',
        'Mux CLI',
        'Mux Dashboard',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['video.asset.ready', 'video.asset.created', 'video.live_stream.active'],
      api_version: 'v1'
    },
    tags: ['mux', 'video', 'streaming', 'media', 'cdn', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Vimeo API Integration',
    summary: 'Vimeo API allows managing videos, albums, and user portfolios.',
    details: {
      auth_type: 'oauth2_personal_access_token',
      base_url: 'https://api.vimeo.com',
      common_endpoints: ['/me/videos', '/videos/{video_id}/presets', '/users/{user_id}'],
      rate_limits: '5,000 requests per hour per authenticated user or IP address',
      credential_fields: [
        { name: 'access_token', type: 'secret', description: 'Your Vimeo Personal Access Token or OAuth token.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Uploading and managing videos',
        'Retrieving video metadata and analytics',
        'Creating and organizing albums/collections',
        'Setting video privacy and embed options',
        'Integrating Vimeo content into websites or applications',
      ],
      associated_tools: [
        'Vimeo API Reference',
        'Vimeo PHP, Python, Node.js, Ruby SDKs',
        'Vimeo Developer Apps Page',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Webhooks for Video Events
      webhook_events: ['video_ready', 'video_uploaded', 'video_deleted'],
      api_version: '3.4' // Implicit in Vimeo API
    },
    tags: ['vimeo', 'video', 'streaming', 'media', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'SendBird Chat API',
    summary: 'SendBird Chat API enables building real-time chat experiences into applications.',
    details: {
      auth_type: 'api_token',
      base_url: 'https://api-{app_id}.sendbird.com/v3',
      common_endpoints: ['/users', '/group_channels', '/open_channels', '/messages'],
      rate_limits: 'Varies by plan, typically high throughput',
      credential_fields: [
        { name: 'api_token', type: 'secret', description: 'Your SendBird API Token for server-side calls.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'app_id', type: 'string', description: 'Your SendBird Application ID.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Creating and managing chat users and channels',
        'Sending and receiving real-time messages',
        'Implementing chat moderation and user bans',
        'Retrieving message history and channel metadata',
        'Building 1:1, group, and open chat functionalities',
      ],
      associated_tools: [
        'SendBird Chat SDKs (JavaScript, iOS, Android, React Native)',
        'SendBird Dashboard',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['message_send', 'channel_creation', 'user_join'],
      api_version: 'v3'
    },
    tags: ['sendbird', 'chat', 'realtime', 'messaging', 'communication', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Agora.io Video SDK (Cloud API)',
    summary: 'Agora.io provides APIs and SDKs for real-time video, voice, and interactive live streaming.',
    details: {
      auth_type: 'app_id_app_certificate_temp_token',
      base_url: 'https://api.agora.io/dev/v1',
      common_endpoints: ['/projects/{projectId}/apps/{appId}/token'],
      rate_limits: 'Varies by usage, typically for token generation',
      credential_fields: [
        { name: 'app_id', type: 'string', description: 'Your Agora App ID.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'app_certificate', type: 'secret', description: 'Your Agora App Certificate (for generating tokens).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'channel_name', type: 'string', description: 'The name of the Agora channel.', example_format: 'my_video_call', is_required: true },
        { name: 'uid', type: 'number', description: 'User ID for token generation.', example_format: '0', is_required: true },
      ],
      credential_use_cases: [
        'Generating temporary tokens for users to join video/audio calls',
        'Managing live streaming sessions',
        'Implementing interactive whiteboards and screen sharing',
        'Building one-to-one or group video conferencing applications',
        'Enabling real-time voice chat in games or social apps',
      ],
      associated_tools: [
        'Agora SDKs (JavaScript, iOS, Android, Unity, Electron)',
        'Agora Console',
        'Agora Token Generator',
      ],
      webhook_support: false, // Primarily client-side SDKs for real-time events, cloud APIs are for management.
      api_version: 'v1'
    },
    tags: ['agora', 'video_call', 'realtime', 'streaming', 'communication', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Stripe Billing API',
    summary: 'Stripe Billing API enables managing recurring revenue with subscriptions, invoices, and prices.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.stripe.com/v1',
      common_endpoints: ['/subscriptions', '/invoices', '/products', '/prices', '/checkout/sessions'],
      rate_limits: 'Same as Stripe Core API: 100 requests/second in live mode',
      credential_fields: [
        { name: 'secret_key', type: 'secret', description: 'Your Stripe secret API key.', example_format: '^sk_(live|test)_[A-Za-z0-9]{24}$', is_required: true },
      ],
      credential_use_cases: [
        'Creating and managing subscriptions for customers',
        'Generating and handling invoices',
        'Defining products and pricing models',
        'Automating recurring payment collection',
        'Managing customer payment methods for subscriptions',
      ],
      associated_tools: [
        'Stripe Node.js Library',
        'Stripe CLI',
        'Stripe Dashboard',
        'Stripe Customer Portal',
        'Stripe Checkout',
      ],
      webhook_support: true,
      webhook_events: ['customer.subscription.created', 'invoice.paid', 'invoice.payment_failed', 'checkout.session.completed'],
      api_version: '2024-06-20'
    },
    tags: ['stripe', 'billing', 'subscriptions', 'payments', 'fintech', 'api'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'GitHub Actions API',
    summary: 'GitHub Actions API allows managing workflows, runs, and secrets for CI/CD automation.',
    details: {
      auth_type: 'personal_access_token',
      base_url: 'https://api.github.com',
      common_endpoints: ['/repos/{owner}/{repo}/actions/workflows', '/repos/{owner}/{repo}/actions/runs'],
      rate_limits: '5000 requests per hour per authenticated user',
      credential_fields: [
        { name: 'personal_access_token', type: 'secret', description: 'A PAT with `workflow` scope for managing workflows.', example_format: '^ghp_[A-Za-z0-9]{36}$', is_required: true },
        { name: 'repo_owner', type: 'string', description: 'The owner of the repository (user or organization).', example_format: 'octocat', is_required: true },
        { name: 'repo_name', type: 'string', description: 'The name of the repository.', example_format: 'octocats-repo', is_required: true },
      ],
      credential_use_cases: [
        'Triggering workflow runs manually',
        'Retrieving workflow run status and logs',
        'Managing repository secrets for workflows',
        'Enabling or disabling workflows',
        'Automating deployment processes',
      ],
      associated_tools: [
        'GitHub CLI',
        'GitHub Actions UI',
        'GitHub API Documentation',
        'Octokit SDKs',
      ],
      webhook_support: true, // Webhooks triggered by Actions events
      webhook_events: ['workflow_run', 'check_run'],
      api_version: '2022-11-28'
    },
    tags: ['github_actions', 'github', 'ci_cd', 'automation', 'devops', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'GitLab API Integration',
    summary: 'GitLab API provides comprehensive access to repositories, CI/CD, issues, and users.',
    details: {
      auth_type: 'personal_access_token_oauth2',
      base_url: 'https://gitlab.com/api/v4',
      common_endpoints: ['/projects', '/users', '/issues', '/pipelines'],
      rate_limits: 'Varies by endpoint (e.g., 600 requests/minute for most)',
      credential_fields: [
        { name: 'private_token', type: 'secret', description: 'A Personal Access Token generated from GitLab profile settings.', example_format: 'glpat-xxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'project_id', type: 'string', description: 'The ID of the GitLab project.', example_format: '12345678', is_required: true },
      ],
      credential_use_cases: [
        'Managing Git repositories and branches',
        'Automating CI/CD pipelines',
        'Creating and updating issues and merge requests',
        'Fetching project and user data',
        'Integrating with DevOps tools and dashboards',
      ],
      associated_tools: [
        'python-gitlab (Python)',
        'node-gitlab (Node.js)',
        'GitLab CLI (glab)',
        'GitLab UI',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['Push Hook', 'Merge Request Hook', 'Issue Hook', 'Pipeline Hook'],
      api_version: 'v4'
    },
    tags: ['gitlab', 'git', 'version_control', 'devops', 'ci_cd', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Bitbucket Cloud REST API',
    summary: 'Bitbucket Cloud REST API allows managing repositories, pull requests, issues, and pipelines.',
    details: {
      auth_type: 'oauth2_app_password',
      base_url: 'https://api.bitbucket.org/2.0',
      common_endpoints: ['/repositories/{workspace}/{repo_slug}', '/pullrequests', '/issues'],
      rate_limits: '1000 requests per hour per user/IP',
      credential_fields: [
        { name: 'username', type: 'string', description: 'Your Bitbucket username or email.', example_format: 'your_username', is_required: true },
        { name: 'app_password', type: 'secret', description: 'An App Password generated from Bitbucket settings with required permissions.', example_format: 'xxxxxxxxxxxxxxxx', is_required: true },
        { name: 'workspace', type: 'string', description: 'The workspace ID or slug.', example_format: 'your-workspace', is_required: true },
        { name: 'repo_slug', type: 'string', description: 'The repository slug.', example_format: 'my-repo', is_required: true },
      ],
      credential_use_cases: [
        'Creating and managing repositories',
        'Automating pull request workflows',
        'Creating and updating issues',
        'Integrating with Bitbucket Pipelines',
        'Fetching code for analysis',
      ],
      associated_tools: [
        'Bitbucket REST API Documentation',
        'atlassian-python-sdk (Python)',
        'Postman/Insomnia',
        'Bitbucket UI',
      ],
      webhook_support: true,
      webhook_events: ['repo:push', 'pullrequest:created', 'issue:created'],
      api_version: '2.0'
    },
    tags: ['bitbucket', 'git', 'version_control', 'devops', 'ci_cd', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'CircleCI API v2',
    summary: 'CircleCI API allows managing pipelines, workflows, jobs, and project settings.',
    details: {
      auth_type: 'api_token',
      base_url: 'https://circleci.com/api/v2',
      common_endpoints: ['/project/{project-slug}/pipeline', '/workflow/{workflow-id}/job'],
      rate_limits: 'Varies, typically 300 requests/minute',
      credential_fields: [
        { name: 'circle_ci_api_token', type: 'secret', description: 'Your CircleCI Personal API Token.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'project_slug', type: 'string', description: 'Project slug in the format `vcs/org/repo`.', example_format: 'github/my-org/my-repo', is_required: true },
      ],
      credential_use_cases: [
        'Triggering CircleCI pipelines programmatically',
        'Retrieving pipeline and workflow status',
        'Managing environment variables and contexts',
        'Automating CI/CD workflows and deployments',
        'Integrating with external notification systems',
      ],
      associated_tools: [
        'CircleCI CLI',
        'CircleCI UI',
        'CircleCI API Documentation',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Webhook notifications for job/workflow status
      webhook_events: ['job-completed', 'workflow-completed'],
      api_version: 'v2'
    },
    tags: ['circleci', 'ci_cd', 'devops', 'automation', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Contentful Content Management API (CMA)',
    summary: 'Contentful CMA allows programmatic creation, updating, and deletion of content entries and assets.',
    details: {
      auth_type: 'personal_access_token_oauth',
      base_url: 'https://api.contentful.com',
      common_endpoints: ['/spaces/{space_id}/environments/{environment_id}/entries', '/spaces/{space_id}/environments/{environment_id}/assets'],
      rate_limits: '10 requests per second per space',
      credential_fields: [
        { name: 'cma_token', type: 'secret', description: 'Your Contentful Content Management API Access Token.', example_format: 'CFPAT-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'space_id', type: 'string', description: 'Your Contentful Space ID.', example_format: 'xxxxxxxxxxxxxx', is_required: true },
        { name: 'environment_id', type: 'string', description: 'The environment ID (e.g., "master").', example_format: 'master', is_required: true },
      ],
      credential_use_cases: [
        'Automating content creation and updates in Contentful',
        'Uploading and managing assets (images, files)',
        'Synchronizing content from external data sources',
        'Implementing bulk content operations',
        'Building headless CMS integrations',
      ],
      associated_tools: [
        'Contentful JavaScript SDK',
        'Contentful CLI',
        'Contentful Web App',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['Entry.publish', 'Entry.unpublish', 'Asset.create', 'Asset.delete'],
      api_version: '1'
    },
    tags: ['contentful', 'cms', 'headless_cms', 'content_management', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'WordPress REST API',
    summary: 'WordPress REST API enables programmatic interaction with posts, pages, users, and media on WordPress sites.',
    details: {
      auth_type: 'oauth1_basic_auth_application_passwords',
      base_url: 'https://{wordpress_domain}/wp-json/wp/v2',
      common_endpoints: ['/posts', '/pages', '/users', '/media'],
      rate_limits: 'Configurable by server and hosting, typically higher on dedicated hosting',
      credential_fields: [
        { name: 'username', type: 'string', description: 'WordPress username.', example_format: 'api_user', is_required: true },
        { name: 'application_password', type: 'secret', description: 'An Application Password generated from WordPress user profile.', example_format: 'xxxxxxxx xxxxxxxx xxxxxxxx xxxxxxxx', is_required: true },
        { name: 'wordpress_domain', type: 'string', description: 'The domain of your WordPress site.', example_format: 'your-blog.com', is_required: true },
      ],
      credential_use_cases: [
        'Creating and updating blog posts and pages',
        'Managing media uploads and library',
        'Retrieving content for custom front-ends or mobile apps',
        'Automating content publishing and scheduling',
        'Integrating with external content sources',
      ],
      associated_tools: [
        'WordPress REST API Handbook',
        'Postman/Insomnia',
        'WordPress Admin Panel',
        'WP-CLI',
      ],
      webhook_support: true, // Via plugins or custom code for post/page changes
      webhook_events: ['save_post', 'delete_post', 'new_comment'],
      api_version: 'v2'
    },
    tags: ['wordpress', 'cms', 'blogging', 'content_management', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Zendesk Support API',
    summary: 'Zendesk Support API allows managing tickets, users, organizations, and comments.',
    details: {
      auth_type: 'api_token_oauth2',
      base_url: 'https://{subdomain}.zendesk.com/api/v2',
      common_endpoints: ['/tickets', '/users', '/organizations', '/tickets/{id}/comments'],
      rate_limits: '400 requests per minute by default',
      credential_fields: [
        { name: 'email', type: 'string', description: 'Your Zendesk agent email.', example_format: 'agent@example.com', is_required: true },
        { name: 'api_token', type: 'secret', description: 'Your Zendesk API token generated from Admin Center.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'subdomain', type: 'string', description: 'Your Zendesk subdomain.', example_format: 'yourcompany', is_required: true },
      ],
      credential_use_cases: [
        'Creating, updating, and resolving support tickets',
        'Managing customer and agent profiles',
        'Automating ticket assignments and responses',
        'Fetching ticket data for reporting and analytics',
        'Integrating with CRM and other business tools',
      ],
      associated_tools: [
        'Zendesk API Documentation',
        'Zendesk SDKs (Ruby, Python, Node.js)',
        'Zendesk Admin Center',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Webhooks and Triggers
      webhook_events: ['ticket_created', 'ticket_updated', 'comment_added'],
      api_version: 'v2'
    },
    tags: ['zendesk', 'customer_support', 'help_desk', 'ticketing', 'crm', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Pipedrive API Integration',
    summary: 'Pipedrive API allows managing deals, organizations, persons, and activities for sales CRM.',
    details: {
      auth_type: 'api_token_oauth2',
      base_url: 'https://api.pipedrive.com/v1',
      common_endpoints: ['/deals', '/persons', '/organizations', '/activities'],
      rate_limits: '100 requests per 10 seconds per user',
      credential_fields: [
        { name: 'api_token', type: 'secret', description: 'Your Pipedrive API Token.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Creating and updating deals and sales opportunities',
        'Managing contacts (persons) and companies (organizations)',
        'Scheduling and logging sales activities',
        'Automating sales pipeline stages',
        'Fetching sales data for forecasting and reporting',
      ],
      associated_tools: [
        'Pipedrive API Documentation',
        'Postman/Insomnia',
        'Pipedrive UI',
        'Zapier, Make',
      ],
      webhook_support: true,
      webhook_events: ['added.deal', 'updated.deal', 'deleted.deal', 'added.person'],
      api_version: 'v1'
    },
    tags: ['pipedrive', 'crm', 'sales', 'sales_automation', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Intercom API',
    summary: 'Intercom API provides access to user, conversation, and message data for customer messaging.',
    details: {
      auth_type: 'bearer_token_oauth2',
      base_url: 'https://api.intercom.io',
      common_endpoints: ['/users', '/conversations', '/messages'],
      rate_limits: 'Varies by endpoint (e.g., 80 requests/minute for users)',
      credential_fields: [
        { name: 'access_token', type: 'secret', description: 'Your Intercom Access Token.', example_format: 'dGhlxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Creating and updating users and leads',
        'Sending messages to users (in-app, email, push)',
        'Managing customer conversations and support tickets',
        'Fetching user attributes and events for segmentation',
        'Automating onboarding and engagement messages',
      ],
      associated_tools: [
        'Intercom API Reference',
        'Intercom SDKs (JavaScript, Ruby, Python, PHP)',
        'Intercom Admin UI',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['conversation_part.created', 'user.created', 'lead.created'],
      api_version: '2.8' // Implicit in Intercom API
    },
    tags: ['intercom', 'customer_messaging', 'crm', 'chat', 'support', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'ClickUp API',
    summary: 'ClickUp API allows managing tasks, lists, folders, spaces, and teams for project management.',
    details: {
      auth_type: 'personal_access_token_oauth2',
      base_url: 'https://api.clickup.com/api/v2',
      common_endpoints: ['/team', '/space', '/folder', '/list', '/task'],
      rate_limits: '100 requests per minute',
      credential_fields: [
        { name: 'personal_access_token', type: 'secret', description: 'Your ClickUp Personal Access Token.', example_format: 'pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'team_id', type: 'string', description: 'Your ClickUp Team ID.', example_format: '1234567', is_required: true },
      ],
      credential_use_cases: [
        'Creating, updating, and deleting tasks',
        'Managing projects (lists, folders, spaces)',
        'Assigning tasks and setting due dates',
        'Fetching task details and custom fields',
        'Integrating with other productivity and reporting tools',
      ],
      associated_tools: [
        'ClickUp API Documentation',
        'Postman/Insomnia',
        'ClickUp UI',
        'Zapier, Make',
      ],
      webhook_support: true,
      webhook_events: ['taskCreated', 'taskUpdated', 'taskDeleted', 'taskStatusUpdated'],
      api_version: 'v2'
    },
    tags: ['clickup', 'project_management', 'tasks', 'productivity', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Google AdSense Management API',
    summary: 'Google AdSense Management API allows programmatic access to AdSense performance reports and account information.',
    details: {
      auth_type: 'oauth2',
      base_url: 'https://www.googleapis.com/adsense/v2',
      common_endpoints: ['/accounts/{accountId}/reports', '/accounts/{accountId}/adclients'],
      rate_limits: 'Varies by request type and quota',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Your OAuth 2.0 client ID.', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Your OAuth 2.0 client secret.', is_required: true },
        { name: 'refresh_token', type: 'secret', description: 'A long-lived token.', is_required: false },
      ],
      credential_use_cases: [
        'Retrieving AdSense earnings and performance reports',
        'Accessing ad unit and custom channel data',
        'Automating report generation for publishers',
        'Integrating AdSense data into analytics dashboards',
        'Monitoring ad performance trends',
      ],
      associated_tools: [
        'Google APIs Client Libraries',
        'Google Cloud Console',
        'AdSense UI',
      ],
      webhook_support: false,
      api_version: 'v2'
    },
    tags: ['google_adsense', 'advertising', 'publishing', 'analytics', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Google Ad Manager API',
    summary: 'Google Ad Manager API (formerly DoubleClick for Publishers) allows programmatic management of ad inventory, campaigns, and reports.',
    details: {
      auth_type: 'oauth2_service_account',
      base_url: 'https://ads.googleapis.com/v202X',
      common_endpoints: ['/CompanyService', '/LineItemService', '/OrderService', '/ReportService'],
      rate_limits: 'Varies, typically high throughput for large publishers',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account with Ad Manager permissions.', is_required: true },
        { name: 'network_code', type: 'string', description: 'Your Google Ad Manager network code.', example_format: '12345678', is_required: true },
      ],
      credential_use_cases: [
        'Creating and managing ad campaigns and line items',
        'Generating and retrieving detailed ad performance reports',
        'Managing ad inventory and forecasting',
        'Automating order and creative management',
        'Integrating with custom ad serving solutions',
      ],
      associated_tools: [
        'Google Ad Manager API Client Libraries (Java, Python, PHP, .NET)',
        'Google Cloud Console',
        'Ad Manager UI',
      ],
      webhook_support: false,
      api_version: 'v202405' // Version changes frequently
    },
    tags: ['google_ad_manager', 'advertising', 'ad_tech', 'publishing', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Google Search Console API',
    summary: 'Google Search Console API provides access to search performance data, crawl errors, and sitemap information.',
    details: {
      auth_type: 'oauth2_service_account',
      base_url: 'https://www.googleapis.com/webmasters/v3',
      common_endpoints: ['/sites', '/sites/{siteUrl}/searchAnalytics/query', '/sites/{siteUrl}/sitemaps'],
      rate_limits: 'Varies, typically 1 request per second per user',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account with Search Console permissions.', is_required: true },
        { name: 'site_url', type: 'string', description: 'The URL of the site property in Search Console (e.g., https://example.com/).', example_format: 'https://example.com/', is_required: true },
      ],
      credential_use_cases: [
        'Retrieving search performance data (queries, impressions, clicks)',
        'Identifying and tracking crawl errors',
        'Submitting and managing sitemaps',
        'Monitoring indexing status and URL inspection',
        'Integrating SEO data into analytics dashboards',
      ],
      associated_tools: [
        'Google APIs Client Libraries',
        'Google Cloud Console',
        'Google Search Console UI',
      ],
      webhook_support: false,
      api_version: 'v3'
    },
    tags: ['Google Search_console', 'seo', 'webmasters', 'analytics', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Google My Business API',
    summary: 'Google My Business API allows managing business information, reviews, posts, and insights for local businesses.',
    details: {
      auth_type: 'oauth2_service_account',
      base_url: 'https://mybusiness.googleapis.com/v4',
      common_endpoints: ['/accounts/{accountId}/locations', '/locations/{locationId}/reviews', '/locations/{locationId}/localPosts'],
      rate_limits: 'Varies, typically 100 queries per 100 seconds per user',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account with Google My Business permissions.', is_required: true },
        { name: 'account_id', type: 'string', description: 'Your Google My Business Account ID.', example_format: '1234567890123456789', is_required: true },
      ],
      credential_use_cases: [
        'Updating business information (address, phone, hours)',
        'Responding to customer reviews',
        'Creating and managing local posts and offers',
        'Retrieving business insights and performance data',
        'Integrating with local SEO and reputation management platforms',
      ],
      associated_tools: [
        'Google APIs Client Libraries',
        'Google Cloud Console',
        'Google My Business Dashboard',
      ],
      webhook_support: true, // Via Pub/Sub for review updates
      webhook_events: ['review.new', 'review.updated'],
      api_version: 'v4'
    },
    tags: ['google_my_business', 'local_seo', 'reputation_management', 'marketing', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Twilio Segment API (Source)',
    summary: 'Twilio Segment API (Source) allows sending customer data to your Segment workspace.',
    details: {
      auth_type: 'write_key',
      base_url: 'https://api.segment.io/v1',
      common_endpoints: ['/track', '/identify', '/page', '/group', '/alias'],
      rate_limits: 'Varies based on plan, designed for high volume.',
      credential_fields: [
        { name: 'write_key', type: 'string', description: 'Your Segment Source Write Key.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Collecting customer behavioral events from your application',
        'Identifying users and their properties for unified profiles',
        'Tracking page views and screen views',
        'Grouping users into organizations',
        'Sending data to hundreds of destinations (analytics, marketing, data warehouses)',
      ],
      associated_tools: [
        'Segment SDKs (Analytics.js, Node.js, Python, iOS, Android)',
        'Segment Debugger',
        'Segment UI',
      ],
      webhook_support: false, // This is a source API, not a webhook endpoint.
      api_version: 'v1'
    },
    tags: ['segment', 'twilio', 'cdp', 'customer_data', 'analytics', 'data_collection', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Twilio Segment API (Destination)',
    summary: 'Twilio Segment API (Destination) receives data from Segment and typically processes it via webhooks or cloud functions.',
    details: {
      auth_type: 'webhook_signature',
      base_url: 'N/A (your endpoint)',
      common_endpoints: 'Your configured webhook endpoint',
      rate_limits: 'Handled by Segment\'s outgoing rate limits for destinations.',
      credential_fields: [
        { name: 'webhook_secret', type: 'secret', description: 'The secret key used to verify the signature of incoming Segment webhooks.', example_format: 'sh_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'webhook_url', type: 'string', description: 'The URL where Segment sends event data (your server endpoint).', example_format: 'https://your-api.com/segment-webhook', is_required: true },
      ],
      credential_use_cases: [
        'Receiving real-time customer event data from Segment',
        'Triggering custom business logic based on events (e.g., send email, update CRM)',
        'Loading data into a custom data warehouse or system',
        'Implementing server-side integrations not available via direct Segment integrations',
        'Enriching data and sending it to other internal services',
      ],
      associated_tools: [
        'Segment Webhooks Destination',
        'Express.js (Node.js) with body-parser',
        'Flask/Django (Python)',
        'Ngrok (for local development)',
        'Webhook.site',
      ],
      webhook_support: true,
      webhook_events: ['all Segment events'],
      api_version: 'v1'
    },
    tags: ['segment', 'twilio', 'cdp', 'customer_data', 'webhooks', 'data_processing', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Stripe Issuing API',
    summary: 'Stripe Issuing API enables businesses to create, manage, and distribute custom virtual and physical cards.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.stripe.com/v1',
      common_endpoints: ['/issuing/cards', '/issuing/cardholders', '/issuing/authorizations'],
      rate_limits: 'Same as Stripe Core API: 100 requests/second in live mode',
      credential_fields: [
        { name: 'secret_key', type: 'secret', description: 'Your Stripe secret API key.', example_format: '^sk_(live|test)_[A-Za-z0-9]{24}$', is_required: true },
      ],
      credential_use_cases: [
        'Programmatically creating virtual or physical cards',
        'Managing cardholder information and spending controls',
        'Approving or declining card authorizations in real-time',
        'Monitoring card transactions and disputes',
        'Building expense management or corporate card programs',
      ],
      associated_tools: [
        'Stripe Node.js Library',
        'Stripe CLI',
        'Stripe Dashboard',
        'Webhook testing tools',
      ],
      webhook_support: true,
      webhook_events: ['issuing_authorization.request', 'issuing_authorization.created', 'issuing_transaction.created'],
      api_version: '2024-06-20'
    },
    tags: ['stripe', 'issuing', 'fintech', 'payments', 'cards', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Twilio Flex API',
    summary: 'Twilio Flex API provides programmatic control over contact center operations, agents, and tasks.',
    details: {
      auth_type: 'account_sid_auth_token',
      base_url: 'https://flex-api.twilio.com/v1',
      common_endpoints: ['/FlexFlows', '/Workspaces/{sid}/Workers', '/Tasks'],
      rate_limits: 'Varies by endpoint and operation',
      credential_fields: [
        { name: 'account_sid', type: 'string', description: 'Your Twilio Account SID.', example_format: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'auth_token', type: 'secret', description: 'Your Twilio Auth Token.', example_format: 'your_auth_token', is_required: true },
      ],
      credential_use_cases: [
        'Managing Flex agents and their statuses',
        'Creating and routing tasks to agents',
        'Customizing contact center workflows',
        'Retrieving call and task data for reporting',
        'Integrating Flex with CRM or ticketing systems',
      ],
      associated_tools: [
        'Twilio Node.js Helper Library',
        'Twilio Flex Plugins CLI',
        'Twilio Console',
        'Twilio Functions (for serverless backend)',
      ],
      webhook_support: true,
      webhook_events: ['task.created', 'task.updated', 'worker.activity.update'],
      api_version: 'v1'
    },
    tags: ['twilio', 'flex', 'contact_center', 'ccaaS', 'customer_service', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Microsoft Power BI REST API',
    summary: 'Power BI REST API allows programmatic interaction with Power BI dashboards, reports, datasets, and gateways.',
    details: {
      auth_type: 'oauth2',
      base_url: 'https://api.powerbi.com/v1.0/myorg',
      common_endpoints: ['/dashboards', '/reports', '/datasets', '/gateways'],
      rate_limits: '200 requests per hour per user',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Application (client) ID for your Azure AD app.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client secret for your Azure AD app.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'tenant_id', type: 'string', description: 'Directory (tenant) ID of your Azure AD tenant.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: false },
      ],
      credential_use_cases: [
        'Embedding Power BI reports and dashboards into custom applications',
        'Refreshing datasets programmatically',
        'Automating report generation and data exports',
        'Managing users and permissions for Power BI content',
        'Integrating Power BI data with other business intelligence tools',
      ],
      associated_tools: [
        'Power BI REST API Documentation',
        'Azure AD App Registrations',
        'Postman/Insomnia',
        'Power BI Desktop',
      ],
      webhook_support: true, // Via Power Automate (Flow) for data refresh
      webhook_events: ['dataset refresh completed', 'data alert triggered'],
      api_version: 'v1.0'
    },
    tags: ['power_bi', 'microsoft', 'business_intelligence', 'analytics', 'data_visualization', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Zendesk Chat API',
    summary: 'Zendesk Chat API allows managing agents, visitors, chats, and account settings for live chat.',
    details: {
      auth_type: 'jwt_oauth',
      base_url: 'https://www.zopim.com/api/v2',
      common_endpoints: ['/chats', '/agents', '/visitors'],
      rate_limits: '200 requests per minute',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Client ID for your Zendesk Chat OAuth Client.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client Secret for your Zendesk Chat OAuth Client.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'subdomain', type: 'string', description: 'Your Zendesk Chat subdomain.', example_format: 'yourcompany', is_required: true },
      ],
      credential_use_cases: [
        'Sending messages to chat visitors',
        'Retrieving chat transcripts and visitor information',
        'Managing agent availability and routing',
        'Automating chat responses and greetings',
        'Integrating live chat data with CRM or analytics platforms',
      ],
      associated_tools: [
        'Zendesk Chat API Documentation',
        'Zendesk Chat Widget SDK',
        'Zendesk Admin Center',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['chat_start', 'chat_end', 'message_sent', 'visitor_left'],
      api_version: 'v2'
    },
    tags: ['zendesk', 'chat', 'live_chat', 'customer_support', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Microsoft 365 (Microsoft Graph API)',
    summary: 'Microsoft Graph API provides a unified endpoint for accessing data across Microsoft 365 services like Outlook, OneDrive, Teams, and Azure AD.',
    details: {
      auth_type: 'oauth2_azure_ad',
      base_url: 'https://graph.microsoft.com/v1.0',
      common_endpoints: ['/me/messages', '/me/drive/root', '/users', '/groups', '/teams'],
      rate_limits: 'Varies by service and application (e.g., Outlook 10,000 requests/10 minutes per app per user)',
      credential_fields: [
        { name: 'client_id', type: 'string', description: 'Application (client) ID for your Azure AD App Registration.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'client_secret', type: 'secret', description: 'Client secret for your Azure AD App Registration.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'tenant_id', type: 'string', description: 'Directory (tenant) ID of your Azure AD tenant.', example_format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', is_required: true },
        { name: 'access_token', type: 'secret', description: 'OAuth access token for authenticated requests.', is_required: false },
        { name: 'refresh_token', type: 'secret', description: 'OAuth refresh token for obtaining new access tokens.', is_required: false },
      ],
      credential_use_cases: [
        'Sending and receiving emails via Outlook',
        'Managing files in OneDrive and SharePoint',
        'Accessing calendar events and contacts',
        'Interacting with Microsoft Teams chats and channels',
        'Managing users and groups in Azure AD',
        'Automating administrative tasks across Microsoft 365',
      ],
      associated_tools: [
        'Microsoft Graph SDKs (Node.js, Python, C#, Java)',
        'Microsoft Graph Explorer',
        'Azure Portal (for App Registrations)',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Change Notifications (webhooks)
      webhook_events: ['message created', 'drive item created', 'calendar event created', 'presence change'],
      api_version: 'v1.0'
    },
    tags: ['microsoft_365', 'microsoft_graph', 'outlook', 'onedrive', 'teams', 'azure_ad', 'productivity', 'collaboration', 'api'],
    priority: 10
  },
  {
    category: 'platform_knowledge',
    title: 'Atlassian Jira Service Management API',
    summary: 'Jira Service Management API allows managing service requests, queues, and knowledge base articles.',
    details: {
      auth_type: 'api_token_oauth',
      base_url: 'https://{your-domain}.atlassian.net/rest/servicedeskapi',
      common_endpoints: ['/request', '/request/{issueKey}/attachment'],
      rate_limits: 'Varies, typically 400 requests per 10 seconds per IP address',
      credential_fields: [
        { name: 'email', type: 'string', description: 'The email address of a Jira user.', example_format: 'user@example.com', is_required: true },
        { name: 'api_token', type: 'secret', description: 'An API token generated from your Atlassian account security settings.', example_format: 'ATATTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'jira_domain', type: 'string', description: 'Your Jira Cloud instance domain (e.g., your-company.atlassian.net).', example_format: 'your-company.atlassian.net', is_required: true },
      ],
      credential_use_cases: [
        'Creating and updating service requests',
        'Adding comments and attachments to requests',
        'Managing customer portals and knowledge base',
        'Fetching request data for external dashboards',
        'Automating support workflows and escalations',
      ],
      associated_tools: [
        'Jira Service Management API Documentation',
        'Atlassian Forge CLI',
        'Postman/Insomnia',
        'Jira Service Management Portal',
      ],
      webhook_support: true, // Via Jira webhooks
      webhook_events: ['servicedesk_request_created', 'servicedesk_request_updated'],
      api_version: 'latest'
    },
    tags: ['jira_service_management', 'atlassian', 'it_service_management', 'help_desk', 'ticketing', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Cloudinary API',
    summary: 'Cloudinary API provides image and video management, optimization, and delivery solutions.',
    details: {
      auth_type: 'api_key_api_secret',
      base_url: 'https://api.cloudinary.com/v1_1/{cloud_name}',
      common_endpoints: ['/image/upload', '/resources/image', '/admin/resources'],
      rate_limits: 'Varies by plan, typically 500 requests/minute for upload, 5000/minute for admin API',
      credential_fields: [
        { name: 'cloud_name', type: 'string', description: 'Your Cloudinary Cloud Name.', example_format: 'your_cloud_name', is_required: true },
        { name: 'api_key', type: 'string', description: 'Your Cloudinary API Key.', example_format: '123456789012345', is_required: true },
        { name: 'api_secret', type: 'secret', description: 'Your Cloudinary API Secret.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Uploading images and videos to the cloud',
        'Applying transformations and optimizations to media assets',
        'Delivering responsive images via CDN',
        'Managing media collections and folders',
        'Analyzing image metadata and properties',
      ],
      associated_tools: [
        'Cloudinary SDKs (Node.js, Python, PHP, Ruby, Java, .NET)',
        'Cloudinary UI Dashboard',
        'Cloudinary Uploader Widget',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Notifications for upload/transformation completion
      webhook_events: ['upload', 'transformation', 'delete'],
      api_version: 'v1_1'
    },
    tags: ['cloudinary', 'media_management', 'image_optimization', 'video_streaming', 'cdn', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Algolia Search API',
    summary: 'Algolia Search API provides powerful search-as-a-service functionality for websites and applications.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://{application_id}-dsn.algolia.net',
      common_endpoints: ['/1/indexes/{index_name}/query', '/1/indexes/{index_name}/batch'],
      rate_limits: 'Varies by plan, typically high throughput for search operations',
      credential_fields: [
        { name: 'application_id', type: 'string', description: 'Your Algolia Application ID.', example_format: 'xxxxxxxxxxxxxx', is_required: true },
        { name: 'api_key', type: 'secret', description: 'Your Algolia Admin API Key (highly privileged).', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'search_api_key', type: 'string', description: 'A public-facing Search-only API Key.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'index_name', type: 'string', description: 'The name of the Algolia index.', example_format: 'products', is_required: true },
      ],
      credential_use_cases: [
        'Implementing instant search and autocomplete functionality',
        'Indexing product catalogs, articles, or user data',
        'Filtering and faceting search results',
        'Personalizing search experiences',
        'Tracking search analytics and user engagement',
      ],
      associated_tools: [
        'Algolia API Clients (JavaScript, Python, PHP, Ruby, Java, Go, C#)',
        'Algolia Dashboard',
        'Algolia InstantSearch.js (frontend)',
        'Algolia CLI',
      ],
      webhook_support: false, // Primarily a search API, not event-driven.
      api_version: '1'
    },
    tags: ['algolia', 'search', 'saas', 'e_commerce', 'developer_tool', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Sendinblue (Brevo) API',
    summary: 'Sendinblue (now Brevo) API offers email marketing, transactional email, SMS, and chat features.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.brevo.com/v3',
      common_endpoints: ['/smtp/email', '/contacts', '/campaigns'],
      rate_limits: 'Varies by plan, typically 100 requests/second',
      credential_fields: [
        { name: 'api_key', type: 'secret', description: 'Your Sendinblue (Brevo) API key.', example_format: 'xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Sending transactional emails (password resets, order confirmations)',
        'Managing contact lists and attributes',
        'Sending marketing campaigns and newsletters',
        'Automating SMS messages',
        'Tracking email delivery and open rates',
      ],
      associated_tools: [
        'Brevo SDKs (Node.js, Python, PHP, Ruby, Java)',
        'Brevo Platform UI',
        'Postman/Insomnia',
      ],
      webhook_support: true,
      webhook_events: ['email_sent', 'email_opened', 'email_clicked', 'contact_created'],
      api_version: 'v3'
    },
    tags: ['sendinblue', 'brevo', 'email_marketing', 'transactional_email', 'sms', 'crm', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Sentry API',
    summary: 'Sentry API allows programmatic interaction with error monitoring data, projects, and issues.',
    details: {
      auth_type: 'bearer_token_api_key',
      base_url: 'https://sentry.io/api/0',
      common_endpoints: ['/organizations/{organization_slug}/issues', '/projects/{organization_slug}/{project_slug}/events'],
      rate_limits: 'Varies, typically 100 requests/minute',
      credential_fields: [
        { name: 'api_key', type: 'secret', description: 'Your Sentry Auth Token.', example_format: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'organization_slug', type: 'string', description: 'Your Sentry organization slug.', example_format: 'my-org', is_required: true },
        { name: 'project_slug', type: 'string', description: 'Your Sentry project slug.', example_format: 'my-project', is_required: true },
      ],
      credential_use_cases: [
        'Retrieving error events and issue details',
        'Resolving or ignoring issues programmatically',
        'Creating custom alerts and notifications',
        'Integrating error data into custom dashboards',
        'Automating incident response workflows',
      ],
      associated_tools: [
        'Sentry SDKs (various languages)',
        'Sentry UI',
        'Sentry CLI',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Webhook integrations for alerts
      webhook_events: ['issue.created', 'issue.resolved', 'error.new'],
      api_version: '0'
    },
    tags: ['sentry', 'error_monitoring', 'observability', 'logging', 'devops', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'LogRocket API',
    summary: 'LogRocket API allows programmatic access to user session replays, console logs, and network requests.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.logrocket.com',
      common_endpoints: ['/v2/sessions', '/v2/search'],
      rate_limits: 'Varies by plan',
      credential_fields: [
        { name: 'api_key', type: 'secret', description: 'Your LogRocket API Key.', example_format: 'prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
        { name: 'organization_id', type: 'string', description: 'Your LogRocket Organization ID.', example_format: 'org_xxxxxxxxxxxxxxxxxxxxxxxx', is_required: true },
      ],
      credential_use_cases: [
        'Searching and retrieving user session recordings',
        'Accessing console logs and network requests from sessions',
        'Identifying and debugging user-reported issues',
        'Integrating session data with customer support tools',
        'Automating analysis of user behavior patterns',
      ],
      associated_tools: [
        'LogRocket JavaScript SDK',
        'LogRocket Dashboard',
        'Postman/Insomnia',
      ],
      webhook_support: true, // Via Webhooks for session events
      webhook_events: ['session_finished'],
      api_version: 'v2'
    },
    tags: ['logrocket', 'session_replay', 'debugging', 'observability', 'frontend', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Stripe Radar API',
    summary: 'Stripe Radar API provides tools for fraud detection and prevention, allowing rule management and review automation.',
    details: {
      auth_type: 'api_key',
      base_url: 'https://api.stripe.com/v1',
      common_endpoints: ['/radar/early_fraud_warnings', '/radar/value_list_items'],
      rate_limits: 'Same as Stripe Core API: 100 requests/second in live mode',
      credential_fields: [
        { name: 'secret_key', type: 'secret', description: 'Your Stripe secret API key with Radar permissions.', example_format: '^sk_(live|test)_[A-Za-z0-9]{24}$', is_required: true },
      ],
      credential_use_cases: [
        'Retrieving early fraud warnings',
        'Managing custom fraud rules and value lists',
        'Automating the review of suspicious payments',
        'Integrating fraud signals into internal dashboards',
        'Updating risk scores and blocking transactions programmatically',
      ],
      associated_tools: [
        'Stripe Node.js Library',
        'Stripe CLI',
        'Stripe Dashboard (Radar section)',
        'Stripe Machine Learning',
      ],
      webhook_support: true,
      webhook_events: ['review.opened', 'review.closed', 'charge.dispute.created'],
      api_version: '2024-06-20'
    },
    tags: ['stripe', 'radar', 'fraud_detection', 'security', 'payments', 'fintech', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'SendGrid Parse Webhook',
    summary: 'SendGrid Parse Webhook allows receiving incoming emails via HTTP POST to your application.',
    details: {
      auth_type: 'webhook_signature',
      base_url: 'N/A (your endpoint)',
      common_endpoints: 'Your configured Parse Webhook endpoint',
      rate_limits: 'Limited by your server capacity and SendGrid queues',
      credential_fields: [
        { name: 'hostname', type: 'string', description: 'The hostname configured for the Parse Webhook in SendGrid.', example_format: 'parse.example.com', is_required: true },
        { name: 'url', type: 'string', description: 'The URL on your server where SendGrid will POST parsed emails.', example_format: 'https://your-app.com/incoming-email', is_required: true },
        { name: 'shared_secret', type: 'secret', description: 'The shared secret for verifying signed parse webhooks.', is_required: false },
      ],
      credential_use_cases: [
        'Receiving and processing incoming emails for automation',
        'Building custom email reply systems',
        'Extracting data from email content (e.g., invoices, support requests)',
        'Creating new tasks or records based on email triggers',
        'Implementing email-to-anything workflows',
      ],
      associated_tools: [
        'SendGrid Inbound Parse Webhook settings',
        'Node.js Express with body-parser',
        'Python Flask/Django',
        'Ngrok (for local development)',
        'email-parser libraries',
      ],
      webhook_support: true,
      webhook_events: ['incoming email'],
      api_version: 'N/A'
    },
    tags: ['sendgrid', 'email', 'webhook', 'inbound_email', 'automation'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Docusign eSignature API (Admin)',
    summary: 'DocuSign eSignature API (Admin) allows managing users, accounts, and permissions.',
    details: {
      auth_type: 'oauth2_jwt',
      base_url: 'https://api.{env}.docusign.net/management/v2',
      common_endpoints: ['/accounts/{accountId}/users', '/accounts/{accountId}/permissions'],
      rate_limits: 'Typically 1000 API calls per hour per integration key',
      credential_fields: [
        { name: 'integration_key', type: 'string', description: 'Your DocuSign Integration Key (Client ID).', is_required: true },
        { name: 'rsa_private_key', type: 'secret', description: 'RSA private key for JWT authentication.', is_required: true },
        { name: 'user_id', type: 'string', description: 'The GUID of the impersonated user (must be an admin).', is_required: true },
        { name: 'account_id', type: 'string', description: 'Your DocuSign Account ID.', is_required: true },
        { name: 'environment', type: 'string', description: 'DocuSign environment: "www" (production) or "demo".', is_required: true },
      ],
      credential_use_cases: [
        'Automating user provisioning and de-provisioning',
        'Managing user permissions and groups',
        'Retrieving account settings and usage data',
        'Auditing API calls and security events',
        'Integrating with HR systems for employee onboarding',
      ],
      associated_tools: [
        'DocuSign SDKs',
        'DocuSign Admin Console',
        'JWT.io',
      ],
      webhook_support: false, // Admin API doesn't directly offer webhooks for user changes.
      api_version: 'v2'
    },
    tags: ['docusign', 'e_signature', 'admin', 'user_management', 'api'],
    priority: 7
  },
  {
    category: 'platform_knowledge',
    title: 'Google Cloud Pub/Sub API',
    summary: 'Google Cloud Pub/Sub is a real-time messaging service for asynchronous communication and event delivery.',
    details: {
      auth_type: 'service_account',
      base_url: 'https://pubsub.googleapis.com/v1',
      common_endpoints: ['/projects/{projectId}/topics', '/projects/{projectId}/subscriptions'],
      rate_limits: 'Varies by usage and quota per project',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account with Pub/Sub Publisher/Subscriber roles.', is_required: true },
        { name: 'project_id', type: 'string', description: 'Your Google Cloud Project ID.', example_format: 'my-gcp-project', is_required: true },
        { name: 'topic_name', type: 'string', description: 'The name of the Pub/Sub topic.', example_format: 'my-topic', is_required: true },
        { name: 'subscription_name', type: 'string', description: 'The name of the Pub/Sub subscription.', example_format: 'my-subscription', is_required: true },
      ],
      credential_use_cases: [
        'Publishing messages to topics for event-driven architectures',
        'Subscribing to topics to receive messages',
        'Implementing fan-out patterns for message delivery',
        'Integrating with other Google Cloud services (Cloud Functions, Dataflow)',
        'Building real-time data pipelines',
      ],
      associated_tools: [
        'Google Cloud Client Libraries',
        'gcloud CLI',
        'Google Cloud Console',
        'Cloud Functions',
      ],
      webhook_support: true, // Via Push Subscriptions
      webhook_events: ['message received'],
      api_version: 'v1'
    },
    tags: ['google_cloud', 'pubsub', 'messaging', 'event_driven', 'realtime', 'api'],
    priority: 9
  },
  {
    category: 'platform_knowledge',
    title: 'Firebase Realtime Database API',
    summary: 'Firebase Realtime Database is a cloud-hosted NoSQL database that lets you store and sync data in real-time.',
    details: {
      auth_type: 'service_account_api_key',
      base_url: 'https://{database_name}.firebaseio.com',
      common_endpoints: '/.json (for root)',
      rate_limits: 'Varies by plan, typically 100,000 concurrent connections per database',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account with Firebase permissions.', is_required: false },
        { name: 'api_key', type: 'string', description: 'Your Firebase Web API Key (for client-side access).', example_format: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'database_url', type: 'string', description: 'Your Firebase Realtime Database URL.', example_format: 'https://your-project.firebaseio.com', is_required: true },
      ],
      credential_use_cases: [
        'Storing and synchronizing real-time application data',
        'Building collaborative features (e.g., chat, drawing apps)',
        'Managing user profiles and game states',
        'Implementing offline data persistence with client SDKs',
        'Integrating with Firebase Cloud Functions for backend logic',
      ],
      associated_tools: [
        'Firebase SDKs (JavaScript, Android, iOS, Admin SDK)',
        'Firebase Console',
        'Firebase CLI',
      ],
      webhook_support: true, // Via Cloud Functions for database triggers
      webhook_events: ['onCreate', 'onUpdate', 'onDelete', 'onWrite'],
      api_version: 'N/A (REST uses database path)'
    },
    tags: ['firebase', 'realtime_database', 'nosql', 'database', 'backend_as_a_service', 'api'],
    priority: 8
  },
  {
    category: 'platform_knowledge',
    title: 'Firebase Cloud Firestore API',
    summary: 'Cloud Firestore is a flexible, scalable NoSQL cloud database for mobile, web, and server development.',
    details: {
      auth_type: 'service_account_api_key',
      base_url: 'https://firestore.googleapis.com/v1',
      common_endpoints: ['/projects/{projectId}/databases/(default)/documents'],
      rate_limits: 'Varies by usage and quota per project (e.g., 10,000 writes/second)',
      credential_fields: [
        { name: 'service_account_key_json', type: 'json_secret', description: 'JSON key file for a service account with Cloud Firestore permissions.', is_required: false },
        { name: 'api_key', type: 'string', description: 'Your Firebase Web API Key (for client-side access).', example_format: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', is_required: false },
        { name: 'project_id', type: 'string', description: 'Your Firebase Project ID.', example_format: 'your-project-id', is_required: true },
      ],

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
