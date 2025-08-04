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
  
  // Generate clean API call script
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
  // Remove any explanatory text, keep only the executable part
  const lines = script.split('\n');
  const executableLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed && 
           !trimmed.startsWith('To ') && 
           !trimmed.startsWith('This ') && 
           !trimmed.startsWith('Below ') &&
           !trimmed.startsWith('Generate ') &&
           !trimmed.includes('explanation') &&
           !trimmed.includes('detailed');
  });
  
  return executableLines.join('\n');
};

/**
 * Generate executable API call script from test configuration
 */
const generateExecutableScript = (config: PlatformTestConfig, platformName: string, credentials: Record<string, string>): string => {
  const { base_url, test_endpoint, authentication } = config;
  const url = `${base_url}${test_endpoint.path}`;
  const method = test_endpoint.method || 'GET';
  
  // Build headers
  const headers: string[] = [
    'Content-Type: application/json',
    'User-Agent: YusrAI-Test/1.0'
  ];
  
  // Add authentication header
  if (authentication.location === 'header') {
    const credentialKey = findCredentialKey(credentials, authentication);
    const authValue = authentication.format.replace(/\{[\w_]+\}/g, `{${credentialKey}}`);
    headers.push(`${authentication.parameter_name}: ${authValue}`);
  }
  
  // Generate curl command
  const curlScript = `# ${platformName} API Test Call

curl -X ${method} "${url}" \\
${headers.map(header => `  -H "${header}"`).join(' \\\n')}

# Expected Response:
# Status: 200 OK
# Response: Platform-specific data`;

  return curlScript;
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
 * Create fallback configuration for platforms without testConfig
 */
const createFallbackConfig = (platformName: string): PlatformTestConfig => {
  const configs: Record<string, PlatformTestConfig> = {
    'OpenAI': {
      base_url: 'https://api.openai.com',
      test_endpoint: { path: '/v1/models', method: 'GET' },
      authentication: {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {api_key}'
      },
      success_indicators: { status_codes: [200], response_patterns: ['data'] },
      error_patterns: { '401': 'Invalid API key', '429': 'Rate limit exceeded' }
    },
    'Slack': {
      base_url: 'https://slack.com/api',
      test_endpoint: { path: '/auth.test', method: 'POST' },
      authentication: {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {bot_token}'
      },
      success_indicators: { status_codes: [200], response_patterns: ['ok'] },
      error_patterns: { '401': 'Invalid token', '403': 'Insufficient permissions' }
    }
  };
  
  return configs[platformName] || {
    base_url: `https://api.${platformName.toLowerCase()}.com`,
    test_endpoint: { path: '/me', method: 'GET' },
    authentication: {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {api_key}'
    },
    success_indicators: { status_codes: [200], response_patterns: ['id', 'user'] },
    error_patterns: { '401': 'Unauthorized', '404': 'Not Found' }
  };
};
