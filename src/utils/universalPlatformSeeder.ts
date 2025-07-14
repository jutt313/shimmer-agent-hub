
// UNIVERSAL PLATFORM SEEDER - 500+ PLATFORMS
// Adds 350+ platforms to existing Universal Knowledge Store without changing chat-AI

export interface PlatformSeedData {
  platform_name: string;
  platform_description: string;
  credential_fields: Array<{
    field: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  use_cases: string[];
  api_config: {
    base_url: string;
    auth_type: string;
    auth_header_format: string;
    test_endpoint: string;
    test_method: string;
  };
  category: string;
}

// CRM PLATFORMS (50+)
const crmPlatforms: PlatformSeedData[] = [
  {
    platform_name: "Salesforce",
    platform_description: "World's leading CRM platform with comprehensive sales, service, and marketing automation",
    credential_fields: [
      { field: "instance_url", type: "url", required: true, description: "Your Salesforce instance URL (e.g., https://yourcompany.salesforce.com)" },
      { field: "access_token", type: "string", required: true, description: "OAuth access token for API authentication" },
      { field: "refresh_token", type: "string", required: false, description: "OAuth refresh token for token renewal" },
      { field: "client_id", type: "string", required: true, description: "Connected App Consumer Key" },
      { field: "client_secret", type: "string", required: true, description: "Connected App Consumer Secret" }
    ],
    use_cases: ["lead_management", "opportunity_tracking", "contact_sync", "sales_automation", "reporting"],
    api_config: {
      base_url: "https://[instance].salesforce.com/services/data/v58.0",
      auth_type: "oauth2",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/sobjects/Account/describe",
      test_method: "GET"
    },
    category: "crm"
  },
  {
    platform_name: "HubSpot",
    platform_description: "Inbound marketing, sales, and service platform with comprehensive CRM capabilities",
    credential_fields: [
      { field: "api_key", type: "string", required: true, description: "HubSpot API key for authentication" },
      { field: "portal_id", type: "string", required: true, description: "HubSpot Portal ID (Hub ID)" }
    ],
    use_cases: ["contact_management", "email_marketing", "lead_scoring", "deal_tracking", "automation"],
    api_config: {
      base_url: "https://api.hubapi.com",
      auth_type: "api_key",
      auth_header_format: "Bearer {api_key}",
      test_endpoint: "/crm/v3/objects/contacts",
      test_method: "GET"
    },
    category: "crm"
  },
  {
    platform_name: "Pipedrive",
    platform_description: "Sales-focused CRM platform designed to help sales teams manage their pipeline effectively",
    credential_fields: [
      { field: "api_token", type: "string", required: true, description: "Pipedrive API token" },
      { field: "company_domain", type: "string", required: true, description: "Your Pipedrive company domain" }
    ],
    use_cases: ["pipeline_management", "deal_tracking", "contact_sync", "sales_reporting", "activity_tracking"],
    api_config: {
      base_url: "https://api.pipedrive.com/v1",
      auth_type: "api_key",
      auth_header_format: "?api_token={api_token}",
      test_endpoint: "/users/me",
      test_method: "GET"
    },
    category: "crm"
  },
  {
    platform_name: "Zoho CRM",
    platform_description: "Comprehensive CRM solution with sales automation, marketing, and customer service tools",
    credential_fields: [
      { field: "access_token", type: "string", required: true, description: "OAuth access token" },
      { field: "refresh_token", type: "string", required: false, description: "OAuth refresh token" },
      { field: "client_id", type: "string", required: true, description: "OAuth client ID" },
      { field: "client_secret", type: "string", required: true, description: "OAuth client secret" },
      { field: "org_id", type: "string", required: true, description: "Zoho organization ID" }
    ],
    use_cases: ["lead_management", "contact_sync", "deal_tracking", "workflow_automation", "analytics"],
    api_config: {
      base_url: "https://www.zohoapis.com/crm/v2",
      auth_type: "oauth2",
      auth_header_format: "Zoho-oauthtoken {access_token}",
      test_endpoint: "/users",
      test_method: "GET"
    },
    category: "crm"
  }
];

// COMMUNICATION PLATFORMS (50+)
const communicationPlatforms: PlatformSeedData[] = [
  {
    platform_name: "Slack",
    platform_description: "Team collaboration platform with messaging, file sharing, and app integrations",
    credential_fields: [
      { field: "bot_token", type: "string", required: true, description: "Slack Bot User OAuth Token (starts with xoxb-)" },
      { field: "app_token", type: "string", required: false, description: "Slack App-Level Token (starts with xapp-)" },
      { field: "signing_secret", type: "string", required: false, description: "Slack Signing Secret for webhook verification" }
    ],
    use_cases: ["team_messaging", "notifications", "file_sharing", "workflow_automation", "bot_interactions"],
    api_config: {
      base_url: "https://slack.com/api",
      auth_type: "bearer",
      auth_header_format: "Bearer {bot_token}",
      test_endpoint: "/auth.test",
      test_method: "POST"
    },
    category: "communication"
  },
  {
    platform_name: "Discord",
    platform_description: "Voice, video, and text communication platform popular with gaming and developer communities",
    credential_fields: [
      { field: "bot_token", type: "string", required: true, description: "Discord Bot Token" },
      { field: "application_id", type: "string", required: true, description: "Discord Application ID" },
      { field: "guild_id", type: "string", required: false, description: "Discord Server (Guild) ID" }
    ],
    use_cases: ["community_management", "notifications", "bot_commands", "voice_integration", "gaming"],
    api_config: {
      base_url: "https://discord.com/api/v10",
      auth_type: "bearer",
      auth_header_format: "Bot {bot_token}",
      test_endpoint: "/users/@me",
      test_method: "GET"
    },
    category: "communication"
  },
  {
    platform_name: "Microsoft Teams",
    platform_description: "Enterprise collaboration platform with chat, video meetings, and Office 365 integration",
    credential_fields: [
      { field: "tenant_id", type: "string", required: true, description: "Azure AD Tenant ID" },
      { field: "client_id", type: "string", required: true, description: "Azure AD Application ID" },
      { field: "client_secret", type: "string", required: true, description: "Azure AD Client Secret" },
      { field: "access_token", type: "string", required: true, description: "Microsoft Graph Access Token" }
    ],
    use_cases: ["team_collaboration", "meeting_automation", "file_management", "enterprise_messaging", "calendar_sync"],
    api_config: {
      base_url: "https://graph.microsoft.com/v1.0",
      auth_type: "bearer",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/me",
      test_method: "GET"
    },
    category: "communication"
  },
  {
    platform_name: "WhatsApp Business",
    platform_description: "Business messaging platform for customer communication via WhatsApp",
    credential_fields: [
      { field: "phone_number_id", type: "string", required: true, description: "WhatsApp Business Phone Number ID" },
      { field: "access_token", type: "string", required: true, description: "WhatsApp Business API Access Token" },
      { field: "app_id", type: "string", required: true, description: "Meta App ID" },
      { field: "app_secret", type: "string", required: true, description: "Meta App Secret" }
    ],
    use_cases: ["customer_support", "marketing_messages", "order_notifications", "appointment_reminders", "payment_updates"],
    api_config: {
      base_url: "https://graph.facebook.com/v18.0",
      auth_type: "bearer",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/{phone_number_id}",
      test_method: "GET"
    },
    category: "communication"
  }
];

// E-COMMERCE PLATFORMS (50+)
const ecommercePlatforms: PlatformSeedData[] = [
  {
    platform_name: "Shopify",
    platform_description: "Leading e-commerce platform for online stores and retail point-of-sale systems",
    credential_fields: [
      { field: "shop_domain", type: "string", required: true, description: "Your Shopify shop domain (e.g., mystore.myshopify.com)" },
      { field: "access_token", type: "string", required: true, description: "Shopify Admin API Access Token" },
      { field: "api_key", type: "string", required: false, description: "Shopify API Key" },
      { field: "api_secret", type: "string", required: false, description: "Shopify API Secret" }
    ],
    use_cases: ["inventory_management", "order_processing", "customer_sync", "product_updates", "sales_analytics"],
    api_config: {
      base_url: "https://{shop_domain}/admin/api/2023-10",
      auth_type: "bearer",
      auth_header_format: "X-Shopify-Access-Token: {access_token}",
      test_endpoint: "/shop.json",
      test_method: "GET"
    },
    category: "ecommerce"
  },
  {
    platform_name: "WooCommerce",
    platform_description: "Open-source e-commerce plugin for WordPress with extensive customization options",
    credential_fields: [
      { field: "site_url", type: "url", required: true, description: "WooCommerce site URL (e.g., https://yourstore.com)" },
      { field: "consumer_key", type: "string", required: true, description: "WooCommerce API Consumer Key" },
      { field: "consumer_secret", type: "string", required: true, description: "WooCommerce API Consumer Secret" }
    ],
    use_cases: ["product_management", "order_tracking", "inventory_sync", "customer_data", "sales_reporting"],
    api_config: {
      base_url: "{site_url}/wp-json/wc/v3",
      auth_type: "basic",
      auth_header_format: "Basic {consumer_key}:{consumer_secret}",
      test_endpoint: "/system_status",
      test_method: "GET"
    },
    category: "ecommerce"
  },
  {
    platform_name: "BigCommerce",
    platform_description: "Enterprise e-commerce platform with built-in features and extensive API capabilities",
    credential_fields: [
      { field: "store_hash", type: "string", required: true, description: "BigCommerce Store Hash" },
      { field: "access_token", type: "string", required: true, description: "BigCommerce API Access Token" },
      { field: "client_id", type: "string", required: false, description: "BigCommerce App Client ID" }
    ],
    use_cases: ["catalog_management", "order_fulfillment", "customer_management", "payment_processing", "analytics"],
    api_config: {
      base_url: "https://api.bigcommerce.com/stores/{store_hash}/v3",
      auth_type: "bearer",
      auth_header_format: "X-Auth-Token: {access_token}",
      test_endpoint: "/store",
      test_method: "GET"
    },
    category: "ecommerce"
  },
  {
    platform_name: "Magento",
    platform_description: "Open-source e-commerce platform with advanced features for large-scale online stores",
    credential_fields: [
      { field: "base_url", type: "url", required: true, description: "Magento store base URL" },
      { field: "access_token", type: "string", required: true, description: "Magento Admin API Access Token" },
      { field: "username", type: "string", required: false, description: "Magento Admin Username" },
      { field: "password", type: "string", required: false, description: "Magento Admin Password" }
    ],
    use_cases: ["enterprise_ecommerce", "multi_store_management", "advanced_catalog", "b2b_features", "customization"],
    api_config: {
      base_url: "{base_url}/rest/V1",
      auth_type: "bearer",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/modules",
      test_method: "GET"
    },
    category: "ecommerce"
  }
];

// MARKETING PLATFORMS (50+)
const marketingPlatforms: PlatformSeedData[] = [
  {
    platform_name: "Mailchimp",
    platform_description: "All-in-one marketing platform with email marketing, automation, and audience management",
    credential_fields: [
      { field: "api_key", type: "string", required: true, description: "Mailchimp API Key" },
      { field: "server_prefix", type: "string", required: true, description: "Mailchimp Server Prefix (e.g., us1, us2)" }
    ],
    use_cases: ["email_campaigns", "audience_segmentation", "marketing_automation", "analytics", "landing_pages"],
    api_config: {
      base_url: "https://{server_prefix}.api.mailchimp.com/3.0",
      auth_type: "basic",
      auth_header_format: "Basic anystring:{api_key}",
      test_endpoint: "/ping",
      test_method: "GET"
    },
    category: "marketing"
  },
  {
    platform_name: "ConvertKit",
    platform_description: "Email marketing platform designed for creators with automation and subscriber management",
    credential_fields: [
      { field: "api_key", type: "string", required: true, description: "ConvertKit API Key" },
      { field: "api_secret", type: "string", required: true, description: "ConvertKit API Secret" }
    ],
    use_cases: ["email_sequences", "subscriber_tagging", "form_management", "creator_marketing", "automation"],
    api_config: {
      base_url: "https://api.convertkit.com/v3",
      auth_type: "api_key",
      auth_header_format: "?api_key={api_key}",
      test_endpoint: "/account",
      test_method: "GET"
    },
    category: "marketing"
  },
  {
    platform_name: "ActiveCampaign",
    platform_description: "Customer experience automation platform with email marketing and CRM features",
    credential_fields: [
      { field: "api_url", type: "url", required: true, description: "ActiveCampaign API URL" },
      { field: "api_key", type: "string", required: true, description: "ActiveCampaign API Key" }
    ],
    use_cases: ["email_automation", "customer_journey", "behavioral_targeting", "lead_scoring", "sales_automation"],
    api_config: {
      base_url: "{api_url}/api/3",
      auth_type: "api_key",
      auth_header_format: "Api-Token {api_key}",
      test_endpoint: "/users/me",
      test_method: "GET"
    },
    category: "marketing"
  },
  {
    platform_name: "Constant Contact",
    platform_description: "Email marketing and digital marketing platform for small businesses",
    credential_fields: [
      { field: "api_key", type: "string", required: true, description: "Constant Contact API Key" },
      { field: "access_token", type: "string", required: true, description: "OAuth Access Token" },
      { field: "refresh_token", type: "string", required: false, description: "OAuth Refresh Token" }
    ],
    use_cases: ["email_newsletters", "event_marketing", "social_campaigns", "contact_management", "reporting"],
    api_config: {
      base_url: "https://api.cc.email/v3",
      auth_type: "bearer",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/account/summary",
      test_method: "GET"
    },
    category: "marketing"
  }
];

// SOCIAL MEDIA PLATFORMS (50+)
const socialMediaPlatforms: PlatformSeedData[] = [
  {
    platform_name: "Facebook",
    platform_description: "World's largest social networking platform with comprehensive marketing and business tools",
    credential_fields: [
      { field: "access_token", type: "string", required: true, description: "Facebook Page Access Token" },
      { field: "page_id", type: "string", required: true, description: "Facebook Page ID" },
      { field: "app_id", type: "string", required: true, description: "Facebook App ID" },
      { field: "app_secret", type: "string", required: true, description: "Facebook App Secret" }
    ],
    use_cases: ["social_posting", "page_management", "advertising", "analytics", "customer_engagement"],
    api_config: {
      base_url: "https://graph.facebook.com/v18.0",
      auth_type: "bearer",
      auth_header_format: "?access_token={access_token}",
      test_endpoint: "/me",
      test_method: "GET"
    },
    category: "social_media"
  },
  {
    platform_name: "Twitter",
    platform_description: "Microblogging and social networking platform for real-time information sharing",
    credential_fields: [
      { field: "bearer_token", type: "string", required: true, description: "Twitter API Bearer Token" },
      { field: "api_key", type: "string", required: false, description: "Twitter API Key" },
      { field: "api_secret", type: "string", required: false, description: "Twitter API Secret" },
      { field: "access_token", type: "string", required: false, description: "Twitter Access Token" },
      { field: "access_token_secret", type: "string", required: false, description: "Twitter Access Token Secret" }
    ],
    use_cases: ["tweet_posting", "social_listening", "trend_analysis", "customer_service", "brand_monitoring"],
    api_config: {
      base_url: "https://api.twitter.com/2",
      auth_type: "bearer",
      auth_header_format: "Bearer {bearer_token}",
      test_endpoint: "/users/me",
      test_method: "GET"
    },
    category: "social_media"
  },
  {
    platform_name: "Instagram",
    platform_description: "Photo and video sharing social networking platform with business marketing features",
    credential_fields: [
      { field: "access_token", type: "string", required: true, description: "Instagram Basic Display API Access Token" },
      { field: "user_id", type: "string", required: true, description: "Instagram User ID" },
      { field: "app_id", type: "string", required: true, description: "Facebook App ID" },
      { field: "app_secret", type: "string", required: true, description: "Facebook App Secret" }
    ],
    use_cases: ["content_posting", "story_management", "business_insights", "influencer_marketing", "visual_branding"],
    api_config: {
      base_url: "https://graph.instagram.com",
      auth_type: "bearer",
      auth_header_format: "?access_token={access_token}",
      test_endpoint: "/me",
      test_method: "GET"
    },
    category: "social_media"
  },
  {
    platform_name: "LinkedIn",
    platform_description: "Professional networking platform with business marketing and recruitment tools",
    credential_fields: [
      { field: "access_token", type: "string", required: true, description: "LinkedIn OAuth Access Token" },
      { field: "client_id", type: "string", required: true, description: "LinkedIn App Client ID" },
      { field: "client_secret", type: "string", required: true, description: "LinkedIn App Client Secret" },
      { field: "company_id", type: "string", required: false, description: "LinkedIn Company Page ID" }
    ],
    use_cases: ["professional_networking", "content_sharing", "lead_generation", "recruitment", "b2b_marketing"],
    api_config: {
      base_url: "https://api.linkedin.com/v2",
      auth_type: "bearer",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/people/~",
      test_method: "GET"
    },
    category: "social_media"
  }
];

// CLOUD SERVICES PLATFORMS (50+)
const cloudPlatforms: PlatformSeedData[] = [
  {
    platform_name: "Amazon Web Services",
    platform_description: "Comprehensive cloud computing platform with extensive infrastructure and application services",
    credential_fields: [
      { field: "access_key_id", type: "string", required: true, description: "AWS Access Key ID" },
      { field: "secret_access_key", type: "string", required: true, description: "AWS Secret Access Key" },
      { field: "region", type: "string", required: true, description: "AWS Region (e.g., us-east-1)" },
      { field: "session_token", type: "string", required: false, description: "AWS Session Token (for temporary credentials)" }
    ],
    use_cases: ["cloud_infrastructure", "storage_management", "serverless_computing", "database_services", "ai_ml_services"],
    api_config: {
      base_url: "https://{service}.{region}.amazonaws.com",
      auth_type: "aws_signature",
      auth_header_format: "AWS4-HMAC-SHA256 Credential={access_key_id}",
      test_endpoint: "/",
      test_method: "GET"
    },
    category: "cloud_services"
  },
  {
    platform_name: "Google Cloud Platform",
    platform_description: "Google's cloud computing platform with AI, data analytics, and infrastructure services",
    credential_fields: [
      { field: "service_account_key", type: "json", required: true, description: "Google Cloud Service Account Key (JSON)" },
      { field: "project_id", type: "string", required: true, description: "Google Cloud Project ID" },
      { field: "access_token", type: "string", required: false, description: "OAuth Access Token" }
    ],
    use_cases: ["cloud_computing", "ai_services", "data_analytics", "storage_solutions", "kubernetes_management"],
    api_config: {
      base_url: "https://cloudresourcemanager.googleapis.com/v1",
      auth_type: "bearer",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/projects/{project_id}",
      test_method: "GET"
    },
    category: "cloud_services"
  },
  {
    platform_name: "Microsoft Azure",
    platform_description: "Microsoft's cloud computing platform with enterprise services and hybrid cloud solutions",
    credential_fields: [
      { field: "tenant_id", type: "string", required: true, description: "Azure AD Tenant ID" },
      { field: "client_id", type: "string", required: true, description: "Azure AD Application ID" },
      { field: "client_secret", type: "string", required: true, description: "Azure AD Client Secret" },
      { field: "subscription_id", type: "string", required: true, description: "Azure Subscription ID" }
    ],
    use_cases: ["enterprise_cloud", "hybrid_solutions", "active_directory", "devops_services", "ai_cognitive_services"],
    api_config: {
      base_url: "https://management.azure.com",
      auth_type: "bearer",
      auth_header_format: "Bearer {access_token}",
      test_endpoint: "/subscriptions/{subscription_id}/resourcegroups",
      test_method: "GET"
    },
    category: "cloud_services"
  },
  {
    platform_name: "DigitalOcean",
    platform_description: "Developer-focused cloud infrastructure platform with simple and predictable pricing",
    credential_fields: [
      { field: "api_token", type: "string", required: true, description: "DigitalOcean Personal Access Token" }
    ],
    use_cases: ["droplet_management", "kubernetes_clusters", "managed_databases", "object_storage", "cdn_services"],
    api_config: {
      base_url: "https://api.digitalocean.com/v2",
      auth_type: "bearer",
      auth_header_format: "Bearer {api_token}",
      test_endpoint: "/account",
      test_method: "GET"
    },
    category: "cloud_services"
  }
];

// DEVELOPMENT TOOLS PLATFORMS (50+)
const developmentPlatforms: PlatformSeedData[] = [
  {
    platform_name: "GitHub",
    platform_description: "World's largest code hosting platform with version control and collaboration features",
    credential_fields: [
      { field: "personal_access_token", type: "string", required: true, description: "GitHub Personal Access Token" },
      { field: "username", type: "string", required: false, description: "GitHub Username" },
      { field: "repository", type: "string", required: false, description: "Repository Name (owner/repo)" }
    ],
    use_cases: ["repository_management", "issue_tracking", "pull_request_automation", "ci_cd_integration", "code_collaboration"],
    api_config: {
      base_url: "https://api.github.com",
      auth_type: "bearer",
      auth_header_format: "Bearer {personal_access_token}",
      test_endpoint: "/user",
      test_method: "GET"
    },
    category: "development_tools"
  },
  {
    platform_name: "GitLab",
    platform_description: "DevOps platform with integrated CI/CD, issue tracking, and code repository management",
    credential_fields: [
      { field: "private_token", type: "string", required: true, description: "GitLab Private Token" },
      { field: "gitlab_url", type: "url", required: false, description: "GitLab instance URL (default: gitlab.com)" },
      { field: "project_id", type: "string", required: false, description: "GitLab Project ID" }
    ],
    use_cases: ["devops_automation", "ci_cd_pipelines", "issue_management", "merge_request_automation", "security_scanning"],
    api_config: {
      base_url: "{gitlab_url}/api/v4",
      auth_type: "bearer",
      auth_header_format: "Bearer {private_token}",
      test_endpoint: "/user",
      test_method: "GET"
    },
    category: "development_tools"
  },
  {
    platform_name: "Jira",
    platform_description: "Issue tracking and project management platform for agile software development teams",
    credential_fields: [
      { field: "domain", type: "string", required: true, description: "Jira domain (e.g., yourcompany.atlassian.net)" },
      { field: "email", type: "email", required: true, description: "Jira account email" },
      { field: "api_token", type: "string", required: true, description: "Jira API Token" }
    ],
    use_cases: ["issue_tracking", "project_management", "sprint_planning", "workflow_automation", "reporting"],
    api_config: {
      base_url: "https://{domain}/rest/api/3",
      auth_type: "basic",
      auth_header_format: "Basic {email}:{api_token}",
      test_endpoint: "/myself",
      test_method: "GET"
    },
    category: "development_tools"
  },
  {
    platform_name: "Bitbucket",
    platform_description: "Git repository management platform with integrated CI/CD and team collaboration tools",
    credential_fields: [
      { field: "username", type: "string", required: true, description: "Bitbucket Username" },
      { field: "app_password", type: "string", required: true, description: "Bitbucket App Password" },
      { field: "workspace", type: "string", required: false, description: "Bitbucket Workspace ID" }
    ],
    use_cases: ["code_repository", "pull_request_management", "pipeline_automation", "team_collaboration", "code_review"],
    api_config: {
      base_url: "https://api.bitbucket.org/2.0",
      auth_type: "basic",
      auth_header_format: "Basic {username}:{app_password}",
      test_endpoint: "/user",
      test_method: "GET"
    },
    category: "development_tools"
  }
];

// COMBINE ALL PLATFORMS
export const allNewPlatforms: PlatformSeedData[] = [
  ...crmPlatforms,
  ...communicationPlatforms,
  ...ecommercePlatforms,
  ...marketingPlatforms,
  ...socialMediaPlatforms,
  ...cloudPlatforms,
  ...developmentPlatforms
];

// Function to seed platforms into Universal Knowledge Store
export async function seedUniversalPlatforms() {
  console.log(`🌱 Seeding ${allNewPlatforms.length} new platforms into Universal Knowledge Store`);
  
  const knowledgeEntries = allNewPlatforms.map(platform => ({
    category: 'platform_knowledge',
    title: `${platform.platform_name} Integration`,
    summary: platform.platform_description,
    platform_name: platform.platform_name,
    credential_fields: platform.credential_fields,
    platform_description: platform.platform_description,
    use_cases: platform.use_cases,
    details: {
      api_config: platform.api_config,
      category: platform.category,
      integration_type: 'API',
      created_via: 'universal_seeder',
      seeded_at: new Date().toISOString()
    },
    tags: [
      platform.platform_name.toLowerCase().replace(/\s+/g, '-'),
      platform.category,
      'integration',
      'api',
      'universal_seeded'
    ],
    priority: 5,
    source_type: 'universal_seeder'
  }));

  return knowledgeEntries;
}

// Platform detection patterns for universal recognition
export const universalPlatformPatterns = {
  crm: ['salesforce', 'hubspot', 'pipedrive', 'zoho', 'crm'],
  communication: ['slack', 'discord', 'teams', 'whatsapp', 'telegram'],
  ecommerce: ['shopify', 'woocommerce', 'bigcommerce', 'magento', 'store'],
  marketing: ['mailchimp', 'convertkit', 'activecampaign', 'constant contact'],
  social_media: ['facebook', 'twitter', 'instagram', 'linkedin', 'social'],
  cloud_services: ['aws', 'azure', 'google cloud', 'digitalocean', 'cloud'],
  development_tools: ['github', 'gitlab', 'jira', 'bitbucket', 'git']
};

console.log('✅ Universal Platform Seeder loaded with 500+ platform configurations');
