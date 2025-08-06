import { UniversalAuthDetector } from './universalAuthDetector';

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
 * Extract clean, executable test script with UNIVERSAL AUTH DEBUGGING
 */
export const extractTestScript = (platform: Platform, credentials: Record<string, string>): string => {
  // Use existing platform testConfig or create universal fallback
  const config = platform.testConfig || createUniversalFallbackConfig(platform.name);
  
  // Generate clean API call script with AUTHENTICATION DEBUGGING
  const script = generateExecutableScriptWithAuthDebug(config, platform.name, credentials);
  return script;
};

/**
 * ENHANCED: Inject credentials with AUTH DEBUG MODE
 */
export const injectCredentials = (baseScript: string, credentials: Record<string, string>): string => {
  let updatedScript = baseScript;
  
  // ENHANCED: Show more credential characters for debugging (but still secure)
  Object.entries(credentials).forEach(([key, value]) => {
    if (value && value !== '' && value !== '••••••••••••••••') {
      // DEBUGGING MODE: Show more characters for auth debugging
      const debugValue = value.length > 12 ? 
        value.substring(0, 8) + '••••' + value.substring(value.length-4) : 
        value.substring(0, 4) + '••••••••';
      
      // Replace various placeholder formats
      updatedScript = updatedScript.replace(new RegExp(`\\{${key}\\}`, 'g'), debugValue);
      updatedScript = updatedScript.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), debugValue);
      updatedScript = updatedScript.replace(new RegExp(`<${key}>`, 'g'), debugValue);
      updatedScript = updatedScript.replace(new RegExp(`YOUR_${key.toUpperCase()}`, 'g'), debugValue);
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
 * UNIVERSAL: Generate executable script with authentication debugging info
 */
const generateExecutableScriptWithAuthDebug = async (
  config: PlatformTestConfig, 
  platformName: string, 
  credentials: Record<string, string>
): Promise<string> => {
  const { base_url, test_endpoint, authentication } = config;
  const url = `${base_url}${test_endpoint.path}`;
  const method = test_endpoint.method || 'GET';
  
  // Get universal authentication pattern
  const authPattern = await UniversalAuthDetector.detectAuthPattern(platformName);
  
  // Build headers with UNIVERSAL AUTHENTICATION
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Universal-Auth-Tester/4.0'
  };
  
  // Add any additional headers from test_endpoint
  if (test_endpoint.headers) {
    Object.assign(headers, test_endpoint.headers);
  }
  
  // UNIVERSAL: Add authentication header using detected pattern
  const credentialValue = UniversalAuthDetector.getCredentialValue(credentials, authPattern);
  if (credentialValue) {
    const authHeaders = UniversalAuthDetector.buildAuthHeader(authPattern, `{${authPattern.credential_field}}`);
    Object.assign(headers, authHeaders);
  }
  
  // Create enhanced structured JSON payload with AUTH DEBUGGING
  const testPayload = {
    platform: platformName,
    universal_auth_detection: {
      detected_pattern: authPattern.type,
      header_name: authPattern.parameter_name,
      header_format: authPattern.format,
      credential_field: authPattern.credential_field,
      auth_location: authPattern.location
    },
    request: {
      method: method,
      url: url,
      headers: headers,
      authentication_debug: {
        detected_auth_type: authPattern.type,
        using_header: authPattern.parameter_name,
        credential_source: authPattern.credential_field,
        format_template: authPattern.format
      }
    },
    expected_response: {
      status_codes: config.success_indicators.status_codes,
      response_patterns: config.success_indicators.response_patterns
    },
    error_handling: config.error_patterns,
    debugging_info: {
      note: "Shows authentication method being used for debugging",
      credential_visibility: "Partial credentials shown for debugging (secure masking applied)"
    }
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
 * UNIVERSAL: Create dynamic fallback configuration without hardcoding
 */
const createUniversalFallbackConfig = async (platformName: string): Promise<PlatformTestConfig> => {
  // Get universal authentication pattern
  const authPattern = await UniversalAuthDetector.detectAuthPattern(platformName);
  
  return {
    base_url: generateIntelligentBaseUrl(platformName),
    test_endpoint: { 
      path: generateIntelligentEndpoint(platformName), 
      method: 'GET' 
    },
    authentication: {
      type: authPattern.type,
      location: authPattern.location,
      parameter_name: authPattern.parameter_name,
      format: authPattern.format
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
  const cleanPlatform = platformName.toLowerCase().replace(/\s+/g, '');
  
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
