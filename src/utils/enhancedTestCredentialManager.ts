
import { supabase } from '@/integrations/supabase/client';
import { TestConfigGenerator, TestConfig } from './testConfigGenerator';

export interface EnhancedTestResult {
  success: boolean;
  message: string;
  details: {
    status: number;
    endpoint_tested: string;
    ai_generated_config: boolean;
    platform_name: string;
    api_response: any;
    headers_used: Record<string, string>;
    config_source: string;
  };
  error_type?: string;
  troubleshooting?: string[];
}

export class EnhancedTestCredentialManager {
  /**
   * Test platform credentials using AI-generated configuration
   */
  static async testCredentialsWithAI(
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<EnhancedTestResult> {
    console.log(`🧪 ENHANCED AI TESTING: ${platformName} for user ${userId}`);
    
    try {
      // Phase 1: Generate AI test configuration
      const testConfig = await TestConfigGenerator.generateTestConfig(platformName);
      console.log(`🤖 Using AI-generated config:`, testConfig);

      // Phase 2: Build test request using AI config
      const testRequest = this.buildTestRequestFromAIConfig(testConfig, credentials);
      console.log(`📡 AI-powered test request:`, testRequest.url);

      // Phase 3: Execute test with AI configuration
      const response = await fetch(testRequest.url, testRequest.options);
      
      // Phase 4: Process response using AI success patterns
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Phase 5: AI-powered success detection
      const isSuccess = this.detectSuccessWithAI(response, responseData, testConfig);
      
      if (isSuccess) {
        console.log(`✅ AI-powered test SUCCESS for ${platformName}`);
        
        return {
          success: true,
          message: `${platformName} credentials verified successfully using AI-generated test configuration!`,
          details: {
            status: response.status,
            endpoint_tested: testRequest.url,
            ai_generated_config: testConfig.ai_generated,
            platform_name: testConfig.platform_name,
            api_response: this.sanitizeResponse(responseData),
            headers_used: testRequest.options.headers || {},
            config_source: testConfig.ai_generated ? 'chat-ai' : 'fallback'
          }
        };
      } else {
        console.error(`❌ AI-powered test FAILED for ${platformName}:`, response.status);
        
        return {
          success: false,
          message: this.generateAIErrorMessage(platformName, response.status, testConfig),
          error_type: this.categorizeError(response.status),
          details: {
            status: response.status,
            endpoint_tested: testRequest.url,
            ai_generated_config: testConfig.ai_generated,
            platform_name: testConfig.platform_name,
            api_response: this.sanitizeResponse(responseData),
            headers_used: testRequest.options.headers || {},
            config_source: testConfig.ai_generated ? 'chat-ai' : 'fallback'
          },
          troubleshooting: this.generateAITroubleshooting(platformName, response.status, testConfig)
        };
      }

    } catch (error: any) {
      console.error(`💥 Enhanced AI testing error for ${platformName}:`, error);
      
      return {
        success: false,
        message: `AI-powered testing failed for ${platformName}: ${error.message}`,
        error_type: 'connection_error',
        details: {
          status: 0,
          endpoint_tested: 'connection_failed',
          ai_generated_config: false,
          platform_name: platformName,
          api_response: error.message,
          headers_used: {},
          config_source: 'error'
        },
        troubleshooting: [
          'Check your internet connection',
          'Verify the platform service is operational',
          'Ensure credentials are valid and active',
          'Try testing again in a few minutes'
        ]
      };
    }
  }

  /**
   * Build test request from AI-generated configuration
   */
  private static buildTestRequestFromAIConfig(
    testConfig: TestConfig,
    credentials: Record<string, string>
  ): any {
    const { base_url, test_endpoint, authentication, field_mappings } = testConfig;
    
    // Build URL
    let url = `${base_url}${test_endpoint.path}`;
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Enhanced-AI-Tester/4.0',
      ...test_endpoint.headers
    };

    // Apply AI-generated authentication
    if (authentication.location === 'header') {
      const credentialValue = this.getCredentialValue(credentials, field_mappings, authentication);
      if (credentialValue) {
        headers[authentication.parameter_name] = authentication.format.replace(/\{[\w_]+\}/g, credentialValue);
      }
    } else if (authentication.location === 'query') {
      const credentialValue = this.getCredentialValue(credentials, field_mappings, authentication);
      if (credentialValue) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}${authentication.parameter_name}=${credentialValue}`;
      }
    }

    // Add query parameters if specified
    if (test_endpoint.query_params) {
      const queryString = new URLSearchParams(test_endpoint.query_params).toString();
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}${queryString}`;
    }

    return {
      url,
      options: {
        method: test_endpoint.method,
        headers
      }
    };
  }

  /**
   * Get credential value using AI field mappings
   */
  private static getCredentialValue(
    credentials: Record<string, string>,
    fieldMappings: Record<string, string>,
    authentication: any
  ): string | null {
    // Try exact field mapping first
    for (const [platformField, userField] of Object.entries(fieldMappings)) {
      if (credentials[userField]) {
        return credentials[userField];
      }
      if (credentials[platformField]) {
        return credentials[platformField];
      }
    }

    // Try common patterns
    const commonPatterns = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token', 'personal_access_token'];
    for (const pattern of commonPatterns) {
      if (credentials[pattern]) {
        return credentials[pattern];
      }
    }

    return null;
  }

  /**
   * AI-powered success detection using success indicators
   */
  private static detectSuccessWithAI(
    response: Response,
    responseData: any,
    testConfig: TestConfig
  ): boolean {
    // Check status codes
    if (testConfig.success_indicators.status_codes.includes(response.status)) {
      // Check response patterns
      if (typeof responseData === 'object' && responseData !== null) {
        return testConfig.success_indicators.response_patterns.some(pattern => {
          const keys = pattern.split('.');
          let current = responseData;
          
          for (const key of keys) {
            if (current && typeof current === 'object' && current.hasOwnProperty(key)) {
              current = current[key];
            } else {
              return false;
            }
          }
          
          return current !== undefined && current !== null;
        });
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Generate AI-powered error messages
   */
  private static generateAIErrorMessage(
    platformName: string,
    status: number,
    testConfig: TestConfig
  ): string {
    const configSource = testConfig.ai_generated ? 'AI-generated' : 'fallback';
    const statusMessage = testConfig.error_patterns[status.toString()] || `Unexpected response (${status})`;
    
    return `${platformName} credential test failed using ${configSource} configuration. ${statusMessage}`;
  }

  /**
   * Generate AI-powered troubleshooting steps
   */
  private static generateAITroubleshooting(
    platformName: string,
    status: number,
    testConfig: TestConfig
  ): string[] {
    const base = [
      `Check ${platformName} service status and documentation`,
      'Verify all credentials are correct and active',
      'Ensure your account has the required permissions'
    ];

    if (testConfig.ai_generated) {
      base.push('AI-generated configuration validated against real API');
    } else {
      base.push('Using fallback configuration - AI generation may have failed');
    }

    // Status-specific troubleshooting
    switch (status) {
      case 401:
        return [...base, 'Check if API keys or tokens have expired', 'Verify authentication method is correct'];
      case 403:
        return [...base, 'Check API scopes and permissions', 'Verify account subscription level'];
      case 404:
        return [...base, 'Verify API endpoint URL is correct', 'Check API version compatibility'];
      case 429:
        return [...base, 'Wait for rate limit reset', 'Consider upgrading API plan'];
      default:
        return base;
    }
  }

  /**
   * Sanitize response data for safe display
   */
  private static sanitizeResponse(responseData: any): any {
    if (typeof responseData === 'string') {
      return responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '');
    }
    
    if (typeof responseData === 'object' && responseData !== null) {
      const keys = Object.keys(responseData).slice(0, 5);
      const preview: any = {};
      keys.forEach(key => {
        preview[key] = responseData[key];
      });
      return preview;
    }
    
    return responseData;
  }

  /**
   * Categorize errors for better handling
   */
  private static categorizeError(status: number): string {
    if (status === 401) return 'authentication_error';
    if (status === 403) return 'permission_error';
    if (status === 404) return 'endpoint_not_found';
    if (status === 429) return 'rate_limit_error';
    if (status >= 500) return 'server_error';
    return 'api_error';
  }
}

console.log('✅ Enhanced Test Credential Manager loaded with AI integration');
