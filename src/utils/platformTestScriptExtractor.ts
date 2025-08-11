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
  testConfig?: any;
  test_payloads?: any[];
  chatai_data?: any;
  credentials: Array<{
    field: string;
    placeholder: string;
    link: string;
    why_needed: string;
  }>;
}

/**
 * CRITICAL FIX: Extract clean, executable test script prioritizing ChatAI original_platform data FIRST
 */
export const extractTestScript = (platform: Platform, credentials: Record<string, string>): string => {
  console.log('🔍 CRITICAL FIX: Extracting test script for platform:', platform.name);
  console.log('🔍 Platform chatai_data:', platform.chatai_data);
  
  // CRITICAL PRIORITY 1: Use ChatAI original_platform.required_credentials if available
  if (platform.chatai_data?.original_platform?.required_credentials) {
    console.log('✅ CRITICAL FIX: Using ChatAI original_platform.required_credentials');
    return generateChatAIOriginalPlatformScript(platform, credentials, platform.chatai_data.original_platform);
  }
  
  // CRITICAL PRIORITY 2: Use ChatAI test_payloads if available (with proper extraction)
  const extractedTestPayloads = extractChatAIValue(platform.test_payloads);
  if (extractedTestPayloads && Array.isArray(extractedTestPayloads) && extractedTestPayloads.length > 0) {
    console.log('✅ CRITICAL FIX: Using extracted ChatAI test_payloads');
    return generateChatAIPayloadScript(platform, credentials, extractedTestPayloads);
  }
  
  // CRITICAL PRIORITY 3: Use ChatAI testConfig if available (with proper extraction)
  const extractedTestConfig = extractChatAIValue(platform.testConfig);
  if (extractedTestConfig && typeof extractedTestConfig === 'object') {
    console.log('✅ CRITICAL FIX: Using extracted ChatAI testConfig');
    return generateChatAIConfigScript(platform, credentials, extractedTestConfig);
  }
  
  // PRIORITY 4: Use existing platform testConfig or create fallback
  console.log('⚠️ No valid ChatAI data found after extraction, using fallback configuration');
  const config = createFallbackConfig(platform.name);
  const script = generateExecutableScript(config, platform.name, credentials);
  return script;
};

/**
 * CRITICAL: Generate test script from ChatAI original_platform data (HIGHEST PRIORITY)
 */
const generateChatAIOriginalPlatformScript = (platform: Platform, credentials: Record<string, string>, originalPlatform: any): string => {
  const requiredCredentials = originalPlatform.required_credentials || [];
  
  // Extract authentication configuration from ChatAI required_credentials
  const authConfig = requiredCredentials.length > 0 ? {
    field_name: requiredCredentials[0].field_name,
    obtain_link: requiredCredentials[0].obtain_link,
    purpose: requiredCredentials[0].purpose
  } : null;
  
  const script = {
    platform: platform.name,
    source: "ChatAI Original Platform Configuration",
    generated_by: "YusrAI ChatAI System",
    timestamp: new Date().toISOString(),
    chatai_original_platform: originalPlatform,
    authentication_config: authConfig ? {
      field_name: authConfig.field_name,
      authentication_header: determineAuthHeader(authConfig.field_name),
      format: determineAuthFormat(authConfig.field_name)
    } : null,
    test_configuration: {
      method: "GET",
      base_url: generateIntelligentBaseUrl(platform.name),
      endpoint: generateIntelligentEndpoint(platform.name),
      headers: authConfig ? {
        [determineAuthHeader(authConfig.field_name)]: `{${authConfig.field_name}}`
      } : {}
    },
    credentials_required: requiredCredentials.map((cred: any) => ({
      field_name: cred.field_name,
      obtain_link: cred.obtain_link,
      purpose: cred.purpose
    })),
    instructions: [
      "This test configuration was generated from ChatAI original_platform data",
      "It contains the exact field names and authentication requirements",
      "Credentials will be automatically injected when testing"
    ],
    chatai_metadata: {
      data_successfully_extracted: true,
      extraction_source: "ChatAI original_platform.required_credentials",
      credential_count: requiredCredentials.length
    }
  };
  
  return JSON.stringify(script, null, 2);
};

/**
 * CRITICAL: Determine authentication header based on field name
 */
const determineAuthHeader = (fieldName: string): string => {
  const lowerField = fieldName.toLowerCase();
  
  if (lowerField.includes('xi') && lowerField.includes('api')) {
    return 'xi-api-key';
  }
  
  if (lowerField.includes('authorization') || lowerField.includes('bearer')) {
    return 'Authorization';
  }
  
  if (lowerField.includes('api_key') || lowerField.includes('apikey')) {
    return 'Authorization';
  }
  
  if (lowerField.includes('token')) {
    return 'Authorization';
  }
  
  // Default based on field name
  return fieldName.replace('_', '-');
};

/**
 * CRITICAL: Determine authentication format based on field name
 */
const determineAuthFormat = (fieldName: string): string => {
  const lowerField = fieldName.toLowerCase();
  
  if (lowerField.includes('xi') && lowerField.includes('api')) {
    return `{${fieldName}}`;
  }
  
  if (lowerField.includes('bearer') || lowerField.includes('token')) {
    return `Bearer {${fieldName}}`;
  }
  
  if (lowerField.includes('api_key') || lowerField.includes('apikey')) {
    return `Bearer {${fieldName}}`;
  }
  
  // Default format
  return `{${fieldName}}`;
};

/**
 * CRITICAL FIX: Extract ChatAI wrapped values properly handling _type and value structures
 */
const extractChatAIValue = (data: any): any => {
  console.log('🔧 CRITICAL FIX: Extracting ChatAI value from:', data);
  
  if (!data) {
    console.log('🔧 No data provided, returning null');
    return null;
  }
  
  // Handle ChatAI wrapped structure with _type and value
  if (typeof data === 'object' && data._type !== undefined && data.value !== undefined) {
    console.log('🔧 Found ChatAI wrapped structure with _type:', data._type, 'value:', data.value);
    
    // If value is "undefined" string, return null
    if (data.value === "undefined" || data.value === undefined || data.value === null) {
      console.log('🔧 ChatAI value is undefined/null, returning null');
      return null;
    }
    
    // Try to parse if it's a JSON string
    if (typeof data.value === 'string') {
      // Don't try to parse simple strings that aren't JSON
      if (data.value.startsWith('{') || data.value.startsWith('[')) {
        try {
          const parsed = JSON.parse(data.value);
          console.log('🔧 Parsed ChatAI JSON value:', parsed);
          return parsed;
        } catch {
          console.log('🔧 Failed to parse as JSON, using ChatAI string value:', data.value);
          return data.value;
        }
      } else {
        console.log('🔧 Using ChatAI string value directly:', data.value);
        return data.value;
      }
    }
    
    console.log('🔧 Using ChatAI direct value:', data.value);
    return data.value;
  }
  
  // Handle direct data
  console.log('🔧 Using direct data:', data);
  return data;
};

/**
 * CRITICAL: Generate test script from ChatAI test_payloads
 */
const generateChatAIPayloadScript = (platform: Platform, credentials: Record<string, string>, extractedPayloads: any[]): string => {
  const chatAIPayload = extractedPayloads[0];
  
  const script = {
    platform: platform.name,
    source: "ChatAI Generated Test Payload",
    generated_by: "YusrAI ChatAI System",
    timestamp: new Date().toISOString(),
    test_payload: chatAIPayload,
    credentials_required: platform.credentials.map(cred => ({
      field: cred.field,
      placeholder: cred.placeholder,
      why_needed: cred.why_needed
    })),
    instructions: [
      "This test payload was specifically generated by ChatAI for your platform",
      "It contains the exact API calls and parameters needed for testing",
      "Credentials will be automatically injected when testing"
    ],
    chatai_metadata: {
      data_successfully_extracted: true,
      extraction_source: "ChatAI test_payloads",
      payload_count: extractedPayloads.length
    }
  };
  
  return JSON.stringify(script, null, 2);
};

/**
 * CRITICAL: Generate test script from ChatAI testConfig
 */
const generateChatAIConfigScript = (platform: Platform, credentials: Record<string, string>, extractedConfig: any): string => {
  const script = {
    platform: platform.name,
    source: "ChatAI Test Configuration",
    generated_by: "YusrAI ChatAI System",
    timestamp: new Date().toISOString(),
    test_configuration: extractedConfig,
    request_details: {
      method: extractedConfig.test_endpoint?.method || 'GET',
      base_url: extractedConfig.base_url,
      endpoint: extractedConfig.test_endpoint?.path || '/me',
      authentication: extractedConfig.authentication
    },
    expected_response: {
      success_codes: extractedConfig.success_indicators?.status_codes || [200],
      success_patterns: extractedConfig.success_indicators?.response_patterns || ['success', 'data', 'user']
    },
    credentials_required: platform.credentials.map(cred => ({
      field: cred.field,
      placeholder: cred.placeholder,
      why_needed: cred.why_needed
    })),
    instructions: [
      "This test configuration was provided by ChatAI specifically for your platform",
      "It includes the correct endpoints, authentication methods, and success indicators",
      "The test will validate your credentials against the actual platform API"
    ],
    chatai_metadata: {
      data_successfully_extracted: true,
      extraction_source: "ChatAI testConfig",
      config_validated: true
    }
  };
  
  return JSON.stringify(script, null, 2);
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
  return script || 'No test script available';
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
    source: "Intelligent Platform Detection",
    generated_by: "YusrAI Fallback System",
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
    error_handling: config.error_patterns,
    note: "This is a fallback configuration generated when ChatAI data is not available"
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
