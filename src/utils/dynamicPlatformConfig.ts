
// Dynamic Platform API Configuration Builder
// This replaces the hardcoded buildPlatformAPIConfig function with a fully dynamic version

export interface PlatformMethod {
  endpoint: string;
  http_method: string;
  required_params: string[];
  optional_params: string[];
  example_request: any;
}

export interface PlatformAPIConfig {
  base_url: string;
  auth_type: string;
  auth_header_format: string;
  methods: Record<string, PlatformMethod>;
}

export interface PlatformConfig {
  name: string;
  api_config: PlatformAPIConfig;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

// Build dynamic API configuration from stored platform configs
export const buildDynamicPlatformConfig = (
  platformName: string,
  platformsConfig: PlatformConfig[],
  credentials: Record<string, string>
): any => {
  console.log(`Building dynamic config for platform: ${platformName}`);
  
  // Find the platform configuration from AI-generated configs
  const platformConfig = platformsConfig?.find(
    (config) => config.name.toLowerCase() === platformName.toLowerCase()
  );

  if (!platformConfig) {
    console.warn(`No dynamic config found for platform: ${platformName}, using fallback`);
    return buildFallbackConfig(platformName, credentials);
  }

  const { api_config } = platformConfig;
  
  // Build dynamic configuration based on stored API config
  const config: any = {
    baseURL: api_config.base_url,
    headers: buildDynamicHeaders(api_config, credentials),
    timeout: 30000,
  };

  // Add authentication based on auth_type
  switch (api_config.auth_type.toLowerCase()) {
    case 'bearer_token':
    case 'bearer':
      const tokenField = platformConfig.credentials.find(c => 
        c.field.includes('token') || c.field.includes('api_key')
      )?.field;
      if (tokenField && credentials[tokenField]) {
        config.headers['Authorization'] = api_config.auth_header_format.replace('{token}', credentials[tokenField]);
      }
      break;
      
    case 'api_key':
      const apiKeyField = platformConfig.credentials.find(c => 
        c.field.includes('api_key') || c.field.includes('key')
      )?.field;
      if (apiKeyField && credentials[apiKeyField]) {
        if (api_config.auth_header_format.includes('Authorization')) {
          config.headers['Authorization'] = api_config.auth_header_format.replace('{token}', credentials[apiKeyField]);
        } else {
          config.headers['X-API-Key'] = credentials[apiKeyField];
        }
      }
      break;
      
    case 'oauth':
    case 'oauth2':
      const accessToken = credentials['access_token'] || credentials['token'];
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
      break;
      
    case 'basic_auth':
      const username = credentials['username'];
      const password = credentials['password'];
      if (username && password) {
        const basicAuth = btoa(`${username}:${password}`);
        config.headers['Authorization'] = `Basic ${basicAuth}`;
      }
      break;
      
    default:
      console.log(`Using custom auth for ${platformName}`);
      // For custom auth, try to apply the auth_header_format with available credentials
      Object.keys(credentials).forEach(credKey => {
        if (api_config.auth_header_format.includes(`{${credKey}}`)) {
          const headerValue = api_config.auth_header_format.replace(`{${credKey}}`, credentials[credKey]);
          if (headerValue.includes('Authorization:')) {
            config.headers['Authorization'] = headerValue.split('Authorization:')[1].trim();
          }
        }
      });
  }

  console.log(`Built dynamic config for ${platformName}:`, config);
  return config;
};

// Build dynamic headers based on API config
const buildDynamicHeaders = (apiConfig: PlatformAPIConfig, credentials: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Automation/1.0',
  };

  // Add platform-specific headers based on common patterns
  if (apiConfig.base_url.includes('slack.com')) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
  } else if (apiConfig.base_url.includes('googleapis.com')) {
    headers['Accept'] = 'application/json';
  } else if (apiConfig.base_url.includes('api.trello.com')) {
    headers['Accept'] = 'application/json';
  }

  return headers;
};

// Fallback configuration for platforms not yet in dynamic config
const buildFallbackConfig = (platformName: string, credentials: Record<string, string>): any => {
  console.log(`Building fallback config for: ${platformName}`);
  
  const config: any = {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Automation/1.0',
    },
  };

  // Smart fallback based on platform name and available credentials
  const lowerPlatform = platformName.toLowerCase();
  
  if (lowerPlatform.includes('slack')) {
    config.baseURL = 'https://slack.com/api';
    if (credentials.bot_token) {
      config.headers['Authorization'] = `Bearer ${credentials.bot_token}`;
    }
  } else if (lowerPlatform.includes('gmail') || lowerPlatform.includes('google')) {
    config.baseURL = 'https://www.googleapis.com/gmail/v1';
    if (credentials.access_token) {
      config.headers['Authorization'] = `Bearer ${credentials.access_token}`;
    }
  } else if (lowerPlatform.includes('trello')) {
    config.baseURL = 'https://api.trello.com/1';
    // Trello uses API key and token in URL params
  } else if (lowerPlatform.includes('openai')) {
    config.baseURL = 'https://api.openai.com/v1';
    if (credentials.api_key) {
      config.headers['Authorization'] = `Bearer ${credentials.api_key}`;
    }
  } else {
    // Generic fallback
    config.baseURL = `https://api.${lowerPlatform}.com`;
    if (credentials.api_key) {
      config.headers['Authorization'] = `Bearer ${credentials.api_key}`;
    } else if (credentials.token) {
      config.headers['Authorization'] = `Bearer ${credentials.token}`;
    }
  }

  return config;
};

// Get method configuration from stored platform config
export const getDynamicMethodConfig = (
  platformName: string,
  methodName: string,
  platformsConfig: PlatformConfig[]
): PlatformMethod | null => {
  const platformConfig = platformsConfig?.find(
    (config) => config.name.toLowerCase() === platformName.toLowerCase()
  );

  if (!platformConfig) {
    console.warn(`No platform config found for: ${platformName}`);
    return null;
  }

  const method = platformConfig.api_config.methods[methodName];
  if (!method) {
    console.warn(`No method config found for: ${methodName} on ${platformName}`);
    return null;
  }

  return method;
};

// Build dynamic URL with parameters
export const buildDynamicURL = (
  baseURL: string,
  endpoint: string,
  parameters: Record<string, any>,
  requiredParams: string[]
): string => {
  let url = `${baseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  // Replace URL parameters (e.g., /users/{id} -> /users/123)
  Object.keys(parameters).forEach(key => {
    url = url.replace(`{${key}}`, encodeURIComponent(parameters[key]));
  });

  // Add query parameters for GET requests
  const queryParams = new URLSearchParams();
  Object.keys(parameters).forEach(key => {
    if (!url.includes(`{${key}}`) && !requiredParams.includes(key)) {
      queryParams.append(key, parameters[key]);
    }
  });

  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
};
