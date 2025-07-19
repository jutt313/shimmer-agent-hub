
import { supabase } from '@/integrations/supabase/client';

export interface DynamicTestConfig {
  base_url: string;
  test_endpoint: {
    method: string;
    path: string;
    headers: Record<string, string>;
    query_params?: Record<string, string>;
    body?: any;
  };
  authentication?: {
    type: string;
    location: string;
    parameter_name: string;
    format: string;
  };
  expected_success_indicators: string[];
  expected_error_indicators: string[];
  validation_rules: Record<string, any>;
  field_mappings?: Record<string, string>;
  error_patterns?: Record<string, string>;
}

export interface DynamicExecutionConfig {
  method: string;
  base_url: string;
  endpoint: string;
  headers: Record<string, string>;
  request_body?: any;
  description?: string;
}

export class DynamicConfigValidator {
  /**
   * Validate AI-generated test configuration
   */
  static validateTestConfig(testConfig: any): { valid: boolean; message: string; errors: string[] } {
    console.log('🔍 Validating AI-generated test configuration');
    
    const errors: string[] = [];

    // Required fields
    if (!testConfig) {
      return { valid: false, message: 'No test configuration provided', errors: ['Missing test config'] };
    }

    if (!testConfig.base_url) {
      errors.push('Missing base_url');
    }

    if (!testConfig.test_endpoint) {
      errors.push('Missing test_endpoint');
    } else {
      if (!testConfig.test_endpoint.method) {
        errors.push('Missing test_endpoint.method');
      }
      if (!testConfig.test_endpoint.path) {
        errors.push('Missing test_endpoint.path');
      }
      if (!testConfig.test_endpoint.headers) {
        errors.push('Missing test_endpoint.headers');
      }
    }

    if (!testConfig.expected_success_indicators || !Array.isArray(testConfig.expected_success_indicators)) {
      errors.push('Missing or invalid expected_success_indicators array');
    }

    if (!testConfig.expected_error_indicators || !Array.isArray(testConfig.expected_error_indicators)) {
      errors.push('Missing or invalid expected_error_indicators array');
    }

    if (!testConfig.validation_rules || typeof testConfig.validation_rules !== 'object') {
      errors.push('Missing or invalid validation_rules object');
    }

    // Validate URL format
    if (testConfig.base_url) {
      try {
        new URL(testConfig.base_url);
      } catch {
        errors.push('Invalid base_url format');
      }
    }

    // Validate HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (testConfig.test_endpoint?.method && !validMethods.includes(testConfig.test_endpoint.method.toUpperCase())) {
      errors.push('Invalid HTTP method');
    }

    const isValid = errors.length === 0;
    const message = isValid ? 'Test configuration is valid' : `Test configuration validation failed: ${errors.join(', ')}`;

    console.log(`${isValid ? '✅' : '❌'} Test config validation:`, { isValid, errors });

    return { valid: isValid, message, errors };
  }

  /**
   * Validate AI-generated execution configuration
   */
  static validateExecutionConfig(executionConfig: any): { valid: boolean; message: string; errors: string[] } {
    console.log('🔍 Validating AI-generated execution configuration');
    
    const errors: string[] = [];

    // Required fields
    if (!executionConfig) {
      return { valid: false, message: 'No execution configuration provided', errors: ['Missing execution config'] };
    }

    if (!executionConfig.method) {
      errors.push('Missing method');
    }

    if (!executionConfig.base_url) {
      errors.push('Missing base_url');
    }

    if (!executionConfig.endpoint) {
      errors.push('Missing endpoint');
    }

    if (!executionConfig.headers || typeof executionConfig.headers !== 'object') {
      errors.push('Missing or invalid headers object');
    }

    // Validate URL format
    if (executionConfig.base_url) {
      try {
        new URL(executionConfig.base_url);
      } catch {
        errors.push('Invalid base_url format');
      }
    }

    // Validate HTTP method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (executionConfig.method && !validMethods.includes(executionConfig.method.toUpperCase())) {
      errors.push('Invalid HTTP method');
    }

    // Validate endpoint path
    if (executionConfig.endpoint && !executionConfig.endpoint.startsWith('/')) {
      errors.push('Endpoint path must start with /');
    }

    const isValid = errors.length === 0;
    const message = isValid ? 'Execution configuration is valid' : `Execution configuration validation failed: ${errors.join(', ')}`;

    console.log(`${isValid ? '✅' : '❌'} Execution config validation:`, { isValid, errors });

    return { valid: isValid, message, errors };
  }

  /**
   * Generate AI configuration for any platform
   */
  static async generateDynamicConfiguration(platformName: string, configurationType: 'test' | 'execution', context?: any): Promise<any> {
    console.log(`🤖 Generating dynamic ${configurationType} configuration for ${platformName}`);
    
    try {
      const message = configurationType === 'test' 
        ? `Generate COMPLETE test configuration for ${platformName} platform including all required fields for dynamic testing.`
        : `Generate COMPLETE execution configuration for ${platformName} to perform the specified action with all required fields.`;

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message,
          messages: [],
          requestType: `dynamic_${configurationType}_config`,
          context: context || {}
        }
      });

      if (error) {
        throw new Error(`AI configuration generation failed: ${error.message}`);
      }

      let config;
      try {
        if (typeof data === 'string') {
          const jsonMatch = data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            config = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in AI response');
          }
        } else {
          config = data;
        }
      } catch (parseError) {
        throw new Error(`Failed to parse AI configuration: ${parseError.message}`);
      }

      // Validate the generated configuration
      const validation = configurationType === 'test' 
        ? this.validateTestConfig(config)
        : this.validateExecutionConfig(config);

      if (!validation.valid) {
        throw new Error(`AI generated invalid configuration: ${validation.message}`);
      }

      console.log(`✅ Dynamic ${configurationType} configuration generated and validated for ${platformName}`);
      return config;

    } catch (error: any) {
      console.error(`💥 Failed to generate dynamic ${configurationType} configuration for ${platformName}:`, error);
      throw error;
    }
  }

  /**
   * Sanitize configuration for safe storage and display
   */
  static sanitizeConfig(config: any): any {
    const sanitized = { ...config };
    
    // Remove sensitive information from headers
    if (sanitized.headers) {
      Object.keys(sanitized.headers).forEach(key => {
        if (key.toLowerCase().includes('authorization') || key.toLowerCase().includes('token')) {
          sanitized.headers[key] = '[CREDENTIAL_PLACEHOLDER]';
        }
      });
    }

    if (sanitized.test_endpoint?.headers) {
      Object.keys(sanitized.test_endpoint.headers).forEach(key => {
        if (key.toLowerCase().includes('authorization') || key.toLowerCase().includes('token')) {
          sanitized.test_endpoint.headers[key] = '[CREDENTIAL_PLACEHOLDER]';
        }
      });
    }

    return sanitized;
  }

  /**
   * Check if platform supports dynamic configuration
   */
  static async isPlatformSupported(platformName: string): Promise<boolean> {
    try {
      const testConfig = await this.generateDynamicConfiguration(platformName, 'test');
      return testConfig !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get platform capabilities through AI analysis
   */
  static async getPlatformCapabilities(platformName: string): Promise<any> {
    console.log(`🔍 Analyzing ${platformName} capabilities`);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: `Analyze ${platformName} platform and provide comprehensive capabilities information including supported actions, API endpoints, authentication methods, and integration possibilities.`,
          messages: [],
          requestType: 'platform_capabilities_analysis'
        }
      });

      if (error) {
        throw error;
      }

      console.log(`✅ Platform capabilities analyzed for ${platformName}`);
      return data;

    } catch (error: any) {
      console.error(`💥 Failed to analyze platform capabilities for ${platformName}:`, error);
      return null;
    }
  }
}

console.log('✅ Dynamic Configuration Validator loaded');
