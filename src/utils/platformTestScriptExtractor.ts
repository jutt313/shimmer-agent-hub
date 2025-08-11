
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
 * SIMPLIFIED: Extract clean test script with basic authentication objects
 */
export const extractTestScript = (platform: Platform, credentials: Record<string, string>): string => {
  console.log('🔍 SIMPLIFIED: Extracting test script for platform:', platform.name);
  
  try {
    // PRIORITY 1: Use ChatAI original_platform.required_credentials if available
    if (platform.chatai_data?.original_platform?.required_credentials) {
      console.log('✅ SIMPLIFIED: Using ChatAI original_platform.required_credentials');
      return generateSimplifiedOriginalPlatformScript(platform, credentials, platform.chatai_data.original_platform);
    }
    
    // PRIORITY 2: Use ChatAI test_payloads if available
    const extractedTestPayloads = extractChatAIValue(platform.test_payloads);
    if (extractedTestPayloads && Array.isArray(extractedTestPayloads) && extractedTestPayloads.length > 0) {
      console.log('✅ SIMPLIFIED: Using extracted ChatAI test_payloads');
      return generateChatAIPayloadScript(platform, credentials, extractedTestPayloads);
    }
    
    // PRIORITY 3: Use ChatAI testConfig if available
    const extractedTestConfig = extractChatAIValue(platform.testConfig);
    if (extractedTestConfig && typeof extractedTestConfig === 'object') {
      console.log('✅ SIMPLIFIED: Using extracted ChatAI testConfig');
      return generateChatAIConfigScript(platform, credentials, extractedTestConfig);
    }
    
    // PRIORITY 4: Use basic fallback configuration
    console.log('⚠️ Using simplified fallback configuration');
    const config = createBasicFallbackConfig(platform.name);
    const script = generateExecutableScript(config, platform.name, credentials);
    return script;
  } catch (error) {
    console.error('💥 Error in extractTestScript:', error);
    return generateBasicFallbackScript(platform.name, credentials);
  }
};

/**
 * SIMPLIFIED: Generate test script from ChatAI original_platform data with basic objects
 */
const generateSimplifiedOriginalPlatformScript = (platform: Platform, credentials: Record<string, string>, originalPlatform: any): string => {
  try {
    const requiredCredentials = originalPlatform.required_credentials || [];
    
    // SIMPLIFIED: Basic authentication configuration
    let authConfig = null;
    if (requiredCredentials.length > 0) {
      const firstCred = requiredCredentials[0];
      authConfig = {
        field_name: firstCred.field_name || 'api_key',
        obtain_link: firstCred.obtain_link || '',
        purpose: firstCred.purpose || 'API authentication'
      };
    }
    
    // SIMPLIFIED: Basic authentication header determination
    const authHeader = getBasicAuthHeader(authConfig?.field_name, platform.name);
    const authFormat = getBasicAuthFormat(authConfig?.field_name, platform.name);
    
    const script = {
      platform: platform.name,
      source: "ChatAI Original Platform Configuration - SIMPLIFIED",
      generated_by: "YusrAI ChatAI System - Basic Mode",
      timestamp: new Date().toISOString(),
      chatai_original_platform: originalPlatform,
      authentication_config: authConfig ? {
        field_name: authConfig.field_name,
        authentication_header: authHeader,
        format: authFormat
      } : null,
      test_configuration: {
        method: "GET",
        base_url: getBasicBaseUrl(platform.name),
        endpoint: getBasicEndpoint(platform.name),
        authentication: {
          parameter_name: authHeader,
          format: authFormat,
          type: "header"
        },
        headers: {
          [authHeader]: authFormat
        }
      },
      credentials_required: requiredCredentials.map((cred: any) => ({
        field_name: cred.field_name || 'api_key',
        obtain_link: cred.obtain_link || '',
        purpose: cred.purpose || 'API authentication'
      })),
      instructions: [
        "SIMPLIFIED: This test configuration uses basic authentication objects",
        "It contains clean field names and authentication requirements",
        "Credentials will be automatically injected when testing"
      ]
    };
    
    return JSON.stringify(script, null, 2);
  } catch (error) {
    console.error('💥 Error in generateSimplifiedOriginalPlatformScript:', error);
    return generateBasicFallbackScript(platform.name, credentials);
  }
};

/**
 * SIMPLIFIED: Basic authentication header determination
 */
const getBasicAuthHeader = (fieldName: string, platformName: string): string => {
  const lowerField = (fieldName || '').toLowerCase();
  const lowerPlatform = (platformName || '').toLowerCase();
  
  if (lowerPlatform.includes('elevenlabs') || lowerPlatform.includes('11labs')) {
    return 'xi-api-key';
  }
  
  if (lowerField.includes('xi') && lowerField.includes('api')) {
    return 'xi-api-key';
  }
  
  return 'Authorization';
};

/**
 * SIMPLIFIED: Basic authentication format determination
 */
const getBasicAuthFormat = (fieldName: string, platformName: string): string => {
  const lowerField = (fieldName || '').toLowerCase();
  const lowerPlatform = (platformName || '').toLowerCase();
  
  if (lowerPlatform.includes('elevenlabs') || lowerPlatform.includes('11labs')) {
    return `{${fieldName || 'api_key'}}`;
  }
  
  if (lowerField.includes('xi') && lowerField.includes('api')) {
    return `{${fieldName}}`;
  }
  
  return `Bearer {${fieldName || 'api_key'}}`;
};

/**
 * SIMPLIFIED: Basic fallback script when everything fails
 */
const generateBasicFallbackScript = (platformName: string, credentials: Record<string, string>): string => {
  const script = {
    platform: platformName,
    source: "BASIC FALLBACK CONFIGURATION",
    generated_by: "YusrAI Basic Recovery System",
    timestamp: new Date().toISOString(),
    test_configuration: {
      method: "GET",
      base_url: getBasicBaseUrl(platformName),
      endpoint: getBasicEndpoint(platformName),
      authentication: {
        parameter_name: "Authorization",
        format: "Bearer {api_key}",
        type: "header"
      },
      headers: {
        "Authorization": "Bearer {api_key}",
        "Content-Type": "application/json"
      }
    },
    instructions: [
      "BASIC FALLBACK: This configuration was generated during system recovery",
      "Simple authentication setup should work for most platforms",
      "Manual adjustment may be needed for specific platform requirements"
    ]
  };
  
  return JSON.stringify(script, null, 2);
};

/**
 * SIMPLIFIED: Extract ChatAI wrapped values
 */
const extractChatAIValue = (data: any): any => {
  console.log('🔧 SIMPLIFIED: Extracting ChatAI value from:', data);
  
  if (!data) {
    return null;
  }
  
  try {
    // Handle ChatAI wrapped structure
    if (typeof data === 'object' && data._type !== undefined && data.value !== undefined) {
      if (data.value === "undefined" || data.value === undefined || data.value === null) {
        return null;
      }
      
      if (typeof data.value === 'string') {
        if (data.value.startsWith('{') || data.value.startsWith('[')) {
          try {
            return JSON.parse(data.value);
          } catch {
            return data.value;
          }
        } else {
          return data.value;
        }
      }
      
      return data.value;
    }
    
    return data;
  } catch (error) {
    console.error('💥 Error in extractChatAIValue:', error);
    return null;
  }
};

/**
 * SIMPLIFIED: Generate test script from ChatAI test_payloads
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
    ]
  };
  
  return JSON.stringify(script, null, 2);
};

/**
 * SIMPLIFIED: Generate test script from ChatAI testConfig
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
    ]
  };
  
  return JSON.stringify(script, null, 2);
};

/**
 * Dynamically inject credentials into test script
 */
export const injectCredentials = (baseScript: string, credentials: Record<string, string>): string => {
  let updatedScript = baseScript;
  
  Object.entries(credentials).forEach(([key, value]) => {
    if (value && value !== '' && value !== '••••••••••••••••') {
      const maskedValue = value.length > 8 ? value.substring(0, 4) + '••••••••' : '••••••••';
      
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
  return script || 'No test script available';
};

/**
 * Generate executable API call script as structured JSON from test configuration
 */
const generateExecutableScript = (config: PlatformTestConfig, platformName: string, credentials: Record<string, string>): string => {
  const { base_url, test_endpoint, authentication } = config;
  const url = `${base_url}${test_endpoint.path}`;
  const method = test_endpoint.method || 'GET';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'YusrAI-Test/1.0'
  };
  
  if (test_endpoint.headers) {
    Object.assign(headers, test_endpoint.headers);
  }
  
  if (authentication.location === 'header') {
    const credentialKey = findCredentialKey(credentials, authentication);
    const authValue = authentication.format.replace(/\{[\w_]+\}/g, `{${credentialKey}}`);
    headers[authentication.parameter_name] = authValue;
  }
  
  const testPayload = {
    platform: platformName,
    source: "Basic Platform Detection",
    generated_by: "YusrAI Basic System",
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

  return JSON.stringify(testPayload, null, 2);
};

/**
 * Find the appropriate credential key for authentication
 */
const findCredentialKey = (credentials: Record<string, string>, authentication: any): string => {
  const commonKeys = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token'];
  for (const key of commonKeys) {
    if (credentials.hasOwnProperty(key)) {
      return key;
    }
  }
  
  const keys = Object.keys(credentials);
  return keys.length > 0 ? keys[0] : 'api_key';
};

/**
 * SIMPLIFIED: Create basic fallback configuration
 */
const createBasicFallbackConfig = (platformName: string): PlatformTestConfig => {
  const lowerPlatform = platformName.toLowerCase();
  
  const baseUrl = getBasicBaseUrl(lowerPlatform);
  const endpointPath = getBasicEndpoint(lowerPlatform);
  
  let authConfig = {
    type: 'bearer',
    location: 'header',
    parameter_name: 'Authorization',
    format: 'Bearer {api_key}'
  };
  
  if (lowerPlatform.includes('elevenlabs') || lowerPlatform.includes('11labs')) {
    authConfig = {
      type: 'api_key',
      location: 'header',
      parameter_name: 'xi-api-key',
      format: '{api_key}'
    };
  }
  
  return {
    base_url: baseUrl,
    test_endpoint: { 
      path: endpointPath, 
      method: 'GET' 
    },
    authentication: authConfig,
    success_indicators: { 
      status_codes: [200], 
      response_patterns: ['id', 'user', 'data', 'ok', 'voices', 'models'] 
    },
    error_patterns: { 
      '401': 'Unauthorized', 
      '404': 'Not Found',
      '403': 'Forbidden'
    }
  };
};

/**
 * SIMPLIFIED: Generate basic base URL
 */
const getBasicBaseUrl = (platformName: string): string => {
  const cleanPlatform = platformName.replace(/\s+/g, '').toLowerCase();
  
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
  
  if (cleanPlatform.includes('typeform')) {
    return 'https://api.typeform.com';
  }
  
  return `https://api.${cleanPlatform}.com`;
};

/**
 * SIMPLIFIED: Generate basic endpoint path
 */
const getBasicEndpoint = (platformName: string): string => {
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
  
  if (platformName.includes('typeform')) {
    return '/me';
  }
  
  return '/me';
};
