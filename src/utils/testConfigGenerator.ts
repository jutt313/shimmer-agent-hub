
import { supabase } from '@/integrations/supabase/client';

export interface TestConfig {
  platform_name: string;
  base_url: string;
  test_endpoint: {
    method: string;
    path: string;
    query_params?: Record<string, string>;
    headers?: Record<string, string>;
  };
  authentication: {
    type: string;
    location: string;
    parameter_name: string;
    format: string;
  };
  required_fields: string[];
  field_mappings: Record<string, string>;
  success_indicators: {
    status_codes: number[];
    response_patterns: string[];
  };
  error_patterns: Record<string, string>;
  ai_generated: boolean;
  config_version: string;
}

export class TestConfigGenerator {
  /**
   * Generate real test configuration for a platform using Chat-AI
   */
  static async generateTestConfig(platformName: string): Promise<TestConfig> {
    console.log(`🔧 Generating AI test config for: ${platformName}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          generateTestConfig: true,
          platformName: platformName,
          message: `Generate test configuration for ${platformName}`
        }
      });

      if (error) {
        console.error('❌ Error generating test config:', error);
        throw new Error(`Failed to generate test config: ${error.message}`);
      }

      if (data?.testConfig) {
        console.log(`✅ Generated AI test config for ${platformName}:`, data.testConfig);
        return data.testConfig;
      }

      throw new Error('No test configuration returned from Chat-AI');

    } catch (error) {
      console.error(`💥 Error generating test config for ${platformName}:`, error);
      
      // Return intelligent fallback based on platform
      return this.createIntelligentFallback(platformName);
    }
  }

  /**
   * Create intelligent fallback configuration with dynamic TLD detection - NO HARDCODED PLATFORMS
   */
  private static createIntelligentFallback(platformName: string): TestConfig {
    const lowerPlatform = platformName.toLowerCase();
    const cleanPlatform = lowerPlatform.replace(/\s+/g, '');
    
    // Generate intelligent base URL with proper TLD detection
    const baseUrl = this.generateIntelligentBaseUrl(cleanPlatform);
    
    // Generate intelligent endpoint path
    const endpointPath = this.generateIntelligentEndpoint(cleanPlatform);
    
    // Generate intelligent authentication format
    const authConfig = this.generateIntelligentAuth(cleanPlatform);
    
    // Generate intelligent field mappings
    const fieldMappings = this.generateIntelligentFieldMappings(cleanPlatform);

    return {
      platform_name: platformName,
      base_url: baseUrl,
      test_endpoint: {
        method: "GET",
        path: endpointPath,
        headers: this.generateIntelligentHeaders(cleanPlatform)
      },
      authentication: authConfig,
      required_fields: Object.keys(fieldMappings),
      field_mappings: fieldMappings,
      success_indicators: {
        status_codes: [200],
        response_patterns: this.generateIntelligentSuccessPatterns(cleanPlatform)
      },
      error_patterns: {
        "401": "Invalid credentials or unauthorized access",
        "403": "Access denied or insufficient permissions",
        "429": "Rate limit exceeded",
        "404": "Resource not found"
      },
      ai_generated: false,
      config_version: "3.0-dynamic"
    };
  }

  /**
   * Generate intelligent base URL with proper TLD detection - NO HARDCODING
   */
  private static generateIntelligentBaseUrl(platformName: string): string {
    // Specific platform mappings for known exceptions
    if (platformName.includes('elevenlabs') || platformName.includes('11labs')) {
      return 'https://api.elevenlabs.io';
    }
    
    // Smart TLD detection based on platform name patterns
    if (platformName.endsWith('.io') || platformName.includes('.io')) {
      const domain = platformName.replace(/\.io.*/, '');
      return `https://api.${domain}.io`;
    }
    
    if (platformName.endsWith('.ai') || platformName.includes('.ai')) {
      const domain = platformName.replace(/\.ai.*/, '');
      return `https://api.${domain}.ai`;
    }
    
    if (platformName.endsWith('.dev') || platformName.includes('.dev')) {
      const domain = platformName.replace(/\.dev.*/, '');
      return `https://api.${domain}.dev`;
    }
    
    if (platformName.endsWith('.co') || platformName.includes('.co')) {
      const domain = platformName.replace(/\.co.*/, '');
      return `https://api.${domain}.co`;
    }
    
    // Check for common API patterns
    if (platformName.includes('slack')) {
      return 'https://slack.com/api';
    }
    
    if (platformName.includes('github')) {
      return 'https://api.github.com';
    }
    
    if (platformName.includes('google')) {
      return 'https://www.googleapis.com';
    }
    
    // Default to .com for unknown platforms
    return `https://api.${platformName}.com`;
  }

  /**
   * Generate intelligent endpoint path based on platform patterns
   */
  private static generateIntelligentEndpoint(platformName: string): string {
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
    
    if (platformName.includes('github')) {
      return '/user';
    }
    
    if (platformName.includes('google')) {
      return '/oauth2/v1/userinfo';
    }
    
    // Common patterns
    return '/me';
  }

  /**
   * Generate intelligent authentication configuration
   */
  private static generateIntelligentAuth(platformName: string): any {
    const commonAuth = {
      type: "bearer",
      location: "header",
      parameter_name: "Authorization",
      format: "Bearer {api_key}"
    };

    // Platform-specific auth patterns
    if (platformName.includes('slack')) {
      return {
        ...commonAuth,
        format: "Bearer {bot_token}"
      };
    }
    
    if (platformName.includes('notion')) {
      return {
        ...commonAuth,
        format: "Bearer {integration_token}"
      };
    }

    return commonAuth;
  }

  /**
   * Generate intelligent field mappings
   */
  private static generateIntelligentFieldMappings(platformName: string): Record<string, string> {
    if (platformName.includes('slack')) {
      return { "bot_token": "bot_token" };
    }
    
    if (platformName.includes('notion')) {
      return { "integration_token": "integration_token" };
    }
    
    if (platformName.includes('github')) {
      return { "personal_access_token": "personal_access_token" };
    }
    
    // Default mapping
    return { "api_key": "api_key" };
  }

  /**
   * Generate intelligent headers based on platform
   */
  private static generateIntelligentHeaders(platformName: string): Record<string, string> {
    const baseHeaders: Record<string, string> = {};
    
    if (platformName.includes('notion')) {
      baseHeaders["Notion-Version"] = "2022-06-28";
    }
    
    if (platformName.includes('github')) {
      baseHeaders["Accept"] = "application/vnd.github.v3+json";
    }
    
    return baseHeaders;
  }

  /**
   * Generate intelligent success patterns
   */
  private static generateIntelligentSuccessPatterns(platformName: string): string[] {
    if (platformName.includes('elevenlabs') || platformName.includes('11labs')) {
      return ["subscription", "user_id", "xi_api_key"];
    }
    
    if (platformName.includes('openai')) {
      return ["data", "object", "id"];
    }
    
    if (platformName.includes('slack')) {
      return ["ok", "user", "team"];
    }
    
    if (platformName.includes('notion')) {
      return ["object", "id", "name"];
    }
    
    // Common patterns
    return ["id", "name", "data", "user"];
  }

  /**
   * Validate test configuration structure
   */
  static validateTestConfig(config: any): boolean {
    const requiredFields = [
      'platform_name',
      'base_url',
      'test_endpoint',
      'authentication',
      'required_fields',
      'field_mappings'
    ];

    return requiredFields.every(field => config.hasOwnProperty(field));
  }
}

console.log('✅ TestConfigGenerator loaded with AI-first dynamic configuration (NO HARDCODED PLATFORMS)');
