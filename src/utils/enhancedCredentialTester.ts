
// ENHANCED CREDENTIAL TESTER
// Works with existing test-credential function to improve testing accuracy

import { supabase } from '@/integrations/supabase/client';
import { EnhancedUniversalPlatformDetector } from './enhancedUniversalPlatformDetector';

export interface EnhancedTestResult {
  success: boolean;
  message: string;
  details: {
    status: number;
    endpoint_tested: string;
    detection_method: string;
    platform_confidence: number;
    api_response: any;
    headers_used: Record<string, string>;
    request_details: any;
  };
  error_type?: string;
  troubleshooting?: string[];
}

export class EnhancedCredentialTester {
  /**
   * Enhanced credential testing that works with your existing system
   */
  static async testPlatformCredentials(
    platformName: string,
    credentials: Record<string, string>,
    userId: string
  ): Promise<EnhancedTestResult> {
    console.log(`🧪 Enhanced Testing: ${platformName} for user ${userId}`);
    
    try {
      // Phase 1: Enhanced platform detection using Universal Knowledge Store + AI
      const detectedConfig = await EnhancedUniversalPlatformDetector.detectPlatform(platformName);
      console.log(`🔍 Platform detected with ${detectedConfig.confidence_score * 100}% confidence via ${detectedConfig.detection_method}`);

      // Phase 2: Build enhanced test request
      const testRequest = this.buildEnhancedTestRequest(detectedConfig, credentials);
      console.log(`📡 Enhanced test request built for: ${testRequest.url}`);

      // Phase 3: Execute test with better error handling
      const response = await fetch(testRequest.url, testRequest.options);
      
      // Phase 4: Enhanced response processing
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Phase 5: Intelligent success/failure detection
      const isSuccess = this.isResponseSuccessful(response, responseData, detectedConfig);
      
      if (isSuccess) {
        console.log(`✅ Enhanced test SUCCESS for ${platformName}`);
        
        // Update Universal Knowledge Store usage
        await this.updatePlatformUsage(platformName, 'success');
        
        return {
          success: true,
          message: `${platformName} credentials verified successfully! Enhanced AI-powered testing confirmed connectivity.`,
          details: {
            status: response.status,
            endpoint_tested: testRequest.url,
            detection_method: detectedConfig.detection_method,
            platform_confidence: detectedConfig.confidence_score,
            api_response: this.sanitizeResponse(responseData),
            headers_used: testRequest.options.headers || {},
            request_details: {
              method: testRequest.options.method,
              auth_type: detectedConfig.api_config?.auth_config?.type || 'unknown',
              base_url: detectedConfig.api_config?.base_url || 'inferred'
            }
          }
        };
      } else {
        console.error(`❌ Enhanced test FAILED for ${platformName}:`, response.status, responseData);
        
        await this.updatePlatformUsage(platformName, 'failure');
        
        return {
          success: false,
          message: this.generateEnhancedErrorMessage(platformName, response.status, detectedConfig),
          error_type: this.categorizeError(response.status),
          details: {
            status: response.status,
            endpoint_tested: testRequest.url,
            detection_method: detectedConfig.detection_method,
            platform_confidence: detectedConfig.confidence_score,
            api_response: this.sanitizeResponse(responseData),
            headers_used: testRequest.options.headers || {},
            request_details: {
              method: testRequest.options.method,
              auth_type: detectedConfig.api_config?.auth_config?.type || 'unknown',
              base_url: detectedConfig.api_config?.base_url || 'inferred'
            }
          },
          troubleshooting: this.generateTroubleshooting(platformName, response.status, detectedConfig)
        };
      }

    } catch (error: any) {
      console.error(`💥 Enhanced testing error for ${platformName}:`, error);
      
      return {
        success: false,
        message: `Enhanced testing failed for ${platformName}: ${error.message}`,
        error_type: 'connection_error',
        details: {
          status: 0,
          endpoint_tested: 'connection_failed',
          detection_method: 'error',
          platform_confidence: 0,
          api_response: error.message,
          headers_used: {},
          request_details: { error: error.message }
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
   * Build enhanced test request with better authentication handling
   */
  private static buildEnhancedTestRequest(detectedConfig: any, credentials: Record<string, string>): any {
    const apiConfig = detectedConfig.api_config || {};
    const authConfig = apiConfig.auth_config || {};
    const testEndpoint = apiConfig.test_endpoint || { method: 'GET', path: '/me' };
    
    // Build URL
    const baseUrl = apiConfig.base_url || `https://api.${detectedConfig.platform_name.toLowerCase()}.com`;
    const testPath = testEndpoint.path || '/me';
    let url = `${baseUrl}${testPath}`;
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'YusrAI-Enhanced-Universal-Tester/4.0'
    };

    // Apply authentication based on detected config
    switch (authConfig.type?.toLowerCase()) {
      case 'bearer':
        const token = credentials.access_token || credentials.token || credentials.api_key;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        break;
        
      case 'api_key':
        const apiKey = credentials.api_key || credentials.key;
        if (apiKey) {
          if (authConfig.location === 'header') {
            headers[authConfig.parameter_name || 'X-API-Key'] = apiKey;
          } else if (authConfig.location === 'query') {
            url += `${url.includes('?') ? '&' : '?'}${authConfig.parameter_name || 'api_key'}=${apiKey}`;
          }
        }
        break;
        
      case 'basic':
        const username = credentials.username || credentials.email;
        const password = credentials.password || credentials.api_key;
        if (username && password) {
          const basicAuth = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
        }
        break;
        
      default:
        // Try intelligent fallback
        if (credentials.access_token) {
          headers['Authorization'] = `Bearer ${credentials.access_token}`;
        } else if (credentials.api_key) {
          headers['Authorization'] = `Bearer ${credentials.api_key}`;
          headers['X-API-Key'] = credentials.api_key;
        }
    }

    return {
      url,
      options: {
        method: testEndpoint.method || 'GET',
        headers
      }
    };
  }

  /**
   * Intelligent success detection based on platform patterns
   */
  private static isResponseSuccessful(response: Response, responseData: any, detectedConfig: any): boolean {
    // HTTP status check
    if (response.ok) return true;
    
    // Some platforms return 200 with error in body
    if (response.status === 200) {
      if (typeof responseData === 'object') {
        // Check for common error patterns
        if (responseData.error || responseData.errors || responseData.message?.includes('error')) {
          return false;
        }
        // Check for success indicators
        if (responseData.ok || responseData.success || responseData.id || responseData.user_id) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Generate enhanced error messages with platform-specific guidance
   */
  private static generateEnhancedErrorMessage(platformName: string, status: number, detectedConfig: any): string {
    const confidence = Math.round(detectedConfig.confidence_score * 100);
    const method = detectedConfig.detection_method;
    
    let baseMessage = `${platformName} credential test failed (detected via ${method} with ${confidence}% confidence).`;
    
    switch (status) {
      case 401:
        return `${baseMessage} Authentication failed - please verify your credentials are correct and active.`;
      case 403:
        return `${baseMessage} Access forbidden - check your account permissions and API scopes.`;
      case 404:
        return `${baseMessage} API endpoint not found - the detected configuration may need adjustment.`;
      case 429:
        return `${baseMessage} Rate limit exceeded - please wait before retrying.`;
      case 500:
      case 502:
      case 503:
        return `${baseMessage} Server error - the ${platformName} service may be temporarily unavailable.`;
      default:
        return `${baseMessage} Unexpected response (${status}).`;
    }
  }

  /**
   * Generate platform-specific troubleshooting steps
   */
  private static generateTroubleshooting(platformName: string, status: number, detectedConfig: any): string[] {
    const base = [
      `Check ${platformName} service status and documentation`,
      'Verify all credentials are correct and active',
      'Ensure your account has the required permissions'
    ];

    // Add detection-method specific troubleshooting
    if (detectedConfig.detection_method === 'ai_generated') {
      base.push('AI-generated configuration may need manual adjustment');
    } else if (detectedConfig.detection_method === 'fallback') {
      base.push('Using fallback configuration - consider adding specific platform support');
    }

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
   * Update platform usage statistics in Universal Knowledge Store
   */
  private static async updatePlatformUsage(platformName: string, result: 'success' | 'failure'): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('universal_knowledge_store')
        .select('id, usage_count')
        .eq('category', 'platform_knowledge')
        .ilike('platform_name', `%${platformName}%`)
        .limit(1);

      if (data && data.length > 0) {
        await supabase
          .from('universal_knowledge_store')
          .update({
            usage_count: (data[0].usage_count || 0) + 1,
            last_used: new Date().toISOString()
          })
          .eq('id', data[0].id);
      }
    } catch (error) {
      console.error('Failed to update platform usage:', error);
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
      // Return first few keys for preview
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

console.log('✅ Enhanced Credential Tester loaded with Universal Knowledge Store integration');
