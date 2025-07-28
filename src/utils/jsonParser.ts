export interface YusrAIStructuredResponse {
  summary: string;
  steps: any[];
  platforms: Platform[];
  clarification_questions: any[];
  agents: any[];
  test_payloads: any;
  execution_blueprint: any;
}

export interface Platform {
  name: string;
  credentials: Credential[];
  test_payloads: any[];
}

export interface Credential {
  field: string;
  placeholder: string;
  link: string;
  why_needed: string;
}

export const parseYusrAIResponse = (response: string): YusrAIStructuredResponse | null => {
  try {
    console.log('🔍 Parsing YusrAI response for 7 sections...');
    
    let jsonData;
    try {
      jsonData = JSON.parse(response);
    } catch (error) {
      console.log('⚠️ Direct JSON parse failed, attempting regex extraction...');
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('❌ No valid JSON found in response');
        return null;
      }
    }

    console.log('📊 Raw JSON data:', jsonData);

    // Enhanced platform extraction with real platform name detection
    const extractPlatforms = (data: any): Platform[] => {
      const platforms: Platform[] = [];
      
      // Check various possible platform fields
      const platformSources = [
        data.platforms,
        data.integrations,
        data.tools,
        data.services,
        data.apis
      ].filter(Boolean);

      for (const source of platformSources) {
        if (Array.isArray(source)) {
          for (const item of source) {
            if (typeof item === 'object' && item !== null) {
              const platform = extractSinglePlatform(item);
              if (platform) {
                platforms.push(platform);
              }
            }
          }
        }
      }

      // If no platforms found, try to extract from text content
      if (platforms.length === 0) {
        const textContent = JSON.stringify(data);
        const detectedPlatforms = detectPlatformsFromText(textContent);
        platforms.push(...detectedPlatforms);
      }

      console.log('🔧 Extracted platforms:', platforms);
      return platforms;
    };

    // Extract a single platform with enhanced name detection
    const extractSinglePlatform = (item: any): Platform | null => {
      const platformName = extractPlatformName(item);
      if (!platformName) return null;

      const credentials = extractCredentials(item, platformName);
      const testPayloads = item.test_payloads || item.test_payload || item.testing || [];

      return {
        name: platformName,
        credentials,
        test_payloads: Array.isArray(testPayloads) ? testPayloads : []
      };
    };

    // Enhanced platform name extraction with real-world platform detection
    const extractPlatformName = (item: any): string | null => {
      // Try direct name fields first
      const directNames = [
        item.name,
        item.platform_name,
        item.platform,
        item.service,
        item.tool,
        item.api,
        item.integration
      ];

      for (const name of directNames) {
        if (name && typeof name === 'string') {
          const normalizedName = normalizePlatformName(name);
          if (normalizedName) return normalizedName;
        }
      }

      // Try to extract from description or other fields
      const textFields = [
        item.description,
        item.purpose,
        item.why_needed,
        item.endpoint,
        item.url
      ];

      for (const field of textFields) {
        if (field && typeof field === 'string') {
          const detectedName = detectPlatformFromText(field);
          if (detectedName) return detectedName;
        }
      }

      return null;
    };

    // Normalize platform names to standard format
    const normalizePlatformName = (name: string): string | null => {
      const normalized = name.trim();
      
      // Known platform mappings
      const platformMappings: { [key: string]: string } = {
        'openai': 'OpenAI',
        'open ai': 'OpenAI',
        'gpt': 'OpenAI',
        'chatgpt': 'OpenAI',
        'slack': 'Slack',
        'discord': 'Discord',
        'typeform': 'Typeform',
        'notion': 'Notion',
        'google sheets': 'Google Sheets',
        'gmail': 'Gmail',
        'google': 'Google',
        'github': 'GitHub',
        'gitlab': 'GitLab',
        'trello': 'Trello',
        'asana': 'Asana',
        'jira': 'Jira',
        'stripe': 'Stripe',
        'paypal': 'PayPal',
        'zoom': 'Zoom',
        'microsoft teams': 'Microsoft Teams',
        'teams': 'Microsoft Teams',
        'twitter': 'Twitter',
        'facebook': 'Facebook',
        'linkedin': 'LinkedIn',
        'instagram': 'Instagram',
        'youtube': 'YouTube',
        'twilio': 'Twilio',
        'sendgrid': 'SendGrid',
        'mailchimp': 'Mailchimp',
        'shopify': 'Shopify',
        'salesforce': 'Salesforce',
        'hubspot': 'HubSpot',
        'airtable': 'Airtable',
        'zapier': 'Zapier',
        'webhooks': 'Webhooks',
        'rest api': 'REST API',
        'api': 'API'
      };

      const lowerName = normalized.toLowerCase();
      return platformMappings[lowerName] || (normalized.length > 2 ? normalized : null);
    };

    // Detect platforms from text content
    const detectPlatformsFromText = (text: string): Platform[] => {
      const platforms: Platform[] = [];
      const lowerText = text.toLowerCase();

      // Platform detection patterns
      const platformPatterns = [
        { pattern: /openai|gpt|chatgpt|open ai/i, name: 'OpenAI' },
        { pattern: /slack/i, name: 'Slack' },
        { pattern: /discord/i, name: 'Discord' },
        { pattern: /typeform/i, name: 'Typeform' },
        { pattern: /notion/i, name: 'Notion' },
        { pattern: /google sheets|googlesheets/i, name: 'Google Sheets' },
        { pattern: /gmail/i, name: 'Gmail' },
        { pattern: /github/i, name: 'GitHub' },
        { pattern: /gitlab/i, name: 'GitLab' },
        { pattern: /trello/i, name: 'Trello' },
        { pattern: /asana/i, name: 'Asana' },
        { pattern: /jira/i, name: 'Jira' },
        { pattern: /stripe/i, name: 'Stripe' },
        { pattern: /paypal/i, name: 'PayPal' },
        { pattern: /zoom/i, name: 'Zoom' },
        { pattern: /microsoft teams|teams/i, name: 'Microsoft Teams' },
        { pattern: /twitter/i, name: 'Twitter' },
        { pattern: /facebook/i, name: 'Facebook' },
        { pattern: /linkedin/i, name: 'LinkedIn' },
        { pattern: /instagram/i, name: 'Instagram' },
        { pattern: /youtube/i, name: 'YouTube' },
        { pattern: /twilio/i, name: 'Twilio' },
        { pattern: /sendgrid/i, name: 'SendGrid' },
        { pattern: /mailchimp/i, name: 'Mailchimp' },
        { pattern: /shopify/i, name: 'Shopify' },
        { pattern: /salesforce/i, name: 'Salesforce' },
        { pattern: /hubspot/i, name: 'HubSpot' },
        { pattern: /airtable/i, name: 'Airtable' },
        { pattern: /zapier/i, name: 'Zapier' },
        { pattern: /webhook/i, name: 'Webhooks' }
      ];

      for (const { pattern, name } of platformPatterns) {
        if (pattern.test(text)) {
          platforms.push({
            name,
            credentials: generateDefaultCredentials(name),
            test_payloads: []
          });
        }
      }

      return platforms;
    };

    // Detect single platform from text
    const detectPlatformFromText = (text: string): string | null => {
      const detectedPlatforms = detectPlatformsFromText(text);
      return detectedPlatforms.length > 0 ? detectedPlatforms[0].name : null;
    };

    // Generate default credentials for known platforms
    const generateDefaultCredentials = (platformName: string): Credential[] => {
      const credentialMappings: { [key: string]: Credential[] } = {
        'OpenAI': [
          {
            field: 'api_key',
            placeholder: 'sk-...',
            link: 'https://platform.openai.com/api-keys',
            why_needed: 'Required for OpenAI API access'
          }
        ],
        'Slack': [
          {
            field: 'bot_token',
            placeholder: 'xoxb-...',
            link: 'https://api.slack.com/apps',
            why_needed: 'Required for Slack bot functionality'
          }
        ],
        'Discord': [
          {
            field: 'bot_token',
            placeholder: 'Your Discord bot token',
            link: 'https://discord.com/developers/applications',
            why_needed: 'Required for Discord bot functionality'
          }
        ],
        'Typeform': [
          {
            field: 'personal_access_token',
            placeholder: 'tfp_...',
            link: 'https://admin.typeform.com/account#/section/tokens',
            why_needed: 'Required for Typeform API access'
          }
        ],
        'Notion': [
          {
            field: 'integration_token',
            placeholder: 'secret_...',
            link: 'https://www.notion.so/my-integrations',
            why_needed: 'Required for Notion API access'
          }
        ],
        'Google Sheets': [
          {
            field: 'access_token',
            placeholder: 'Your Google access token',
            link: 'https://console.cloud.google.com/apis/credentials',
            why_needed: 'Required for Google Sheets API access'
          }
        ],
        'GitHub': [
          {
            field: 'access_token',
            placeholder: 'ghp_...',
            link: 'https://github.com/settings/tokens',
            why_needed: 'Required for GitHub API access'
          }
        ]
      };

      return credentialMappings[platformName] || [
        {
          field: 'api_key',
          placeholder: `Your ${platformName} API key`,
          link: `https://${platformName.toLowerCase()}.com/api`,
          why_needed: `Required for ${platformName} API access`
        }
      ];
    };

    // Enhanced credential extraction
    const extractCredentials = (item: any, platformName: string): Credential[] => {
      const credentials: Credential[] = [];
      
      // Try to extract from various credential fields
      const credentialSources = [
        item.credentials,
        item.required_credentials,
        item.credential_requirements,
        item.auth,
        item.authentication,
        item.config,
        item.configuration
      ];

      for (const source of credentialSources) {
        if (Array.isArray(source)) {
          for (const cred of source) {
            if (typeof cred === 'object' && cred !== null) {
              const credential = extractSingleCredential(cred);
              if (credential) {
                credentials.push(credential);
              }
            }
          }
        }
      }

      // If no credentials found, use default for the platform
      if (credentials.length === 0) {
        credentials.push(...generateDefaultCredentials(platformName));
      }

      return credentials;
    };

    // Extract single credential
    const extractSingleCredential = (cred: any): Credential | null => {
      const field = cred.field || cred.name || cred.key || cred.parameter || 'api_key';
      const placeholder = cred.placeholder || cred.example || cred.format || `Your ${field}`;
      const link = cred.link || cred.url || cred.documentation || cred.where_to_get || '';
      const why_needed = cred.why_needed || cred.description || cred.purpose || `Required for authentication`;

      return {
        field: String(field),
        placeholder: String(placeholder),
        link: String(link),
        why_needed: String(why_needed)
      };
    };

    const extractAgents = (data: any): any[] => {
      if (!data.agents || !Array.isArray(data.agents)) {
        return [];
      }
    
      return data.agents.map(agent => ({
        name: agent.name || agent.agent_name || 'AI Agent',
        role: agent.role || agent.agent_role || 'Assistant',
        goal: agent.goal || agent.agent_goal || agent.objective || 'Process automation data',
        rules: agent.rules || agent.rule || agent.agent_rules || agent.instruction || 'Follow automation requirements',
        memory: agent.memory || agent.agent_memory || agent.context || 'Store task context and results',
        why_needed: agent.why_needed || agent.purpose || agent.description || 'Enhances automation intelligence'
      }));
    };

    // Build the final structured response
    const structuredResponse: YusrAIStructuredResponse = {
      summary: jsonData.summary || '',
      steps: Array.isArray(jsonData.steps) ? jsonData.steps : [],
      platforms: extractPlatforms(jsonData),
      clarification_questions: Array.isArray(jsonData.clarification_questions) ? jsonData.clarification_questions : [],
      agents: Array.isArray(jsonData.agents) ? jsonData.agents : [],
      test_payloads: jsonData.test_payloads || {},
      execution_blueprint: jsonData.execution_blueprint || null
    };

    console.log('✅ Successfully parsed YusrAI structured response:', structuredResponse);
    return structuredResponse;

  } catch (error) {
    console.error('❌ Error parsing YusrAI response:', error);
    return null;
  }
};
