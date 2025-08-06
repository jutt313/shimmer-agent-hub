
interface PlatformTestConfig {
  base_url: string;
  test_endpoint: {
    path: string;
    method: string;
    headers?: Record<string, string>;
  };
  authentication: {
    type: string;
    location: string;
    parameter_name: string;
    format: string;
  };
  success_indicators: {
    status_codes: number[];
    response_patterns: string[];
  };
  error_patterns: Record<string, string>;
}

interface Platform {
  name: string;
  testConfig?: PlatformTestConfig;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

/**
 * Extract clean, executable test script from platform configuration
 */
export const extractTestScript = (platform: Platform, credentials: Record<string, string>): string => {
  // Use existing platform testConfig or create fallback
  const config = platform.testConfig || createFallbackConfig(platform.name);
  
  // Generate clean API call script as structured JSON
  const script = generateExecutableScript(config, platform.name, credentials);
  return script;
};

/**
 * Dynamically inject credentials into test script
 */
export const injectCredentials = (baseScript: string, credentials: Record<string, string>): string => {
  let updatedScript = baseScript;
  
  // Replace credential placeholders with actual values (masked for security)
  Object.entries(credentials).forEach(([key, value]) => {
    if (value && value !== '' && value !== '••••••••••••••••') {
      const maskedValue = value.length > 8 ? value.substring(0, 4) + '••••••••' : '••••••••';
      
      // Replace various placeholder formats
      updatedScript = updatedScript.replace(new RegExp(`\\{${key}\\}`, 'g'), maskedValue);
      updatedScript = updatedScript.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), maskedValue);
      updatedScript = updatedScript.replace(new RegExp(`<${key}>`, 'g'), maskedValue);
      updatedScript = updatedScript.replace(new RegExp(`YOUR_${key.toUpperCase()}`, 'g'), maskedValue);
    }
  });
  
  return updatedScript;
};

/**
 * Format script for clean display in Live Test Payload
 */
export const formatExecutableScript = (script: string): string => {
  // Return the script as-is since it's already formatted as JSON
  return script;
};

/**
 * Generate executable API call script as structured JSON from test configuration
 */
const generateExecutableScript = (config: PlatformTestConfig, platformName: string, credentials: Record<string, string>): string => {
  const { base_url, test_endpoint, authentication } = config;
  const url = `${base_url}${test_endpoint.path}`;
  const method = test_endpoint.method || 'GET';
  
  // Build headers object
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Test/1.0'
  };
  
  // Add any additional headers from test_endpoint
  if (test_endpoint.headers) {
    Object.assign(headers, test_endpoint.headers);
  }
  
  // Add authentication header
  if (authentication.location === 'header') {
    const credentialKey = findCredentialKey(credentials, authentication);
    const authValue = authentication.format.replace(/\{[\w_]+\}/g, `{${credentialKey}}`);
    headers[authentication.parameter_name] = authValue;
  }
  
  // Create structured JSON payload
  const testPayload = {
    platform: platformName,
    request: {
      method: method,
      url: url,
      headers: headers,
      authentication: {
        type: authentication.type,
        location: authentication.location,
        parameter: authentication.parameter_name
      }
    },
    expected_response: {
      status_codes: config.success_indicators.status_codes,
      response_patterns: config.success_indicators.response_patterns
    },
    error_handling: config.error_patterns
  };

  // Return formatted JSON string
  return JSON.stringify(testPayload, null, 2);
};

/**
 * Find the appropriate credential key for authentication
 */
const findCredentialKey = (credentials: Record<string, string>, authentication: any): string => {
  // Try common patterns first
  const commonKeys = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token'];
  for (const key of commonKeys) {
    if (credentials.hasOwnProperty(key)) {
      return key;
    }
  }
  
  // Use first available credential key
  const keys = Object.keys(credentials);
  return keys.length > 0 ? keys[0] : 'api_key';
};

/**
 * Create dynamic fallback configuration with intelligent TLD detection
 */
const createFallbackConfig = (platformName: string): PlatformTestConfig => {
  const lowerPlatform = platformName.toLowerCase();
  
  // Intelligent base URL generation with proper TLD detection
  const baseUrl = generateIntelligentBaseUrl(lowerPlatform);
  
  // Dynamic endpoint path based on platform patterns
  const endpointPath = generateIntelligentEndpoint(lowerPlatform);
  
  return {
    base_url: baseUrl,
    test_endpoint: { 
      path: endpointPath, 
      method: 'GET' 
    },
    authentication: {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {api_key}'
    },
    success_indicators: { 
      status_codes: [200], 
      response_patterns: ['id', 'user', 'data', 'ok'] 
    },
    error_patterns: { 
      '401': 'Unauthorized', 
      '404': 'Not Found',
      '403': 'Forbidden'
    }
  };
};

/**
 * Generate intelligent base URL with proper TLD detection
 */
const generateIntelligentBaseUrl = (platformName: string): string => {
  const cleanPlatform = platformName.replace(/\s+/g, '').toLowerCase();
  
  // Specific platform TLD mappings
  if (cleanPlatform.includes('elevenlabs') || cleanPlatform.includes('11labs')) {
    return 'https://api.elevenlabs.io';
  }
  
  if (cleanPlatform.includes('openai')) {
    return 'https://api.openai.com';
  }
  
  if (cleanPlatform.includes('slack')) {
    return 'https://slack.com/api';
  }
  
  if (cleanPlatform.includes('notion')) {
    return 'https://api.notion.com';
  }
  
  // Smart TLD detection based on common patterns
  if (cleanPlatform.endsWith('.io') || cleanPlatform.includes('.io')) {
    const domain = cleanPlatform.replace('.io', '');
    return `https://api.${domain}.io`;
  }
  
  if (cleanPlatform.endsWith('.ai') || cleanPlatform.includes('.ai')) {
    const domain = cleanPlatform.replace('.ai', '');
    return `https://api.${domain}.ai`;
  }
  
  if (cleanPlatform.endsWith('.dev') || cleanPlatform.includes('.dev')) {
    const domain = cleanPlatform.replace('.dev', '');
    return `https://api.${domain}.dev`;
  }
  
  // Default to .com for unknown platforms
  return `https://api.${cleanPlatform}.com`;
};

/**
 * Generate intelligent endpoint path based on platform patterns
 */
const generateIntelligentEndpoint = (platformName: string): string => {
  if (platformName.includes('elevenlabs') || platformName.includes('11labs')) {
    return '/v1/user';
  }
  
  if (platformName.includes('openai')) {
    return '/v1/models';
  }
  
  if (platformName.includes('slack')) {
    return '/auth.test';
  }
  
  if (platformName.includes('notion')) {
    return '/v1/users/me';
  }
  
  // Common API patterns
  return '/me';
};
