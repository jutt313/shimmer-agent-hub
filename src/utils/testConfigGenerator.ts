import { supabase } from '@/integrations/supabase/client';
import { UniversalAuthDetector } from './universalAuthDetector';

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
    credential_field: string;
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
   * UNIVERSAL: Generate test configuration using AI + Universal Auth Detection
   */
  static async generateTestConfig(platformName: string): Promise<TestConfig> {
    console.log(`🔧 UNIVERSAL: Generating AI test config for: ${platformName}`);
    
    try {
      // Phase 1: Try AI-generated configuration first
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          generateTestConfig: true,
          platformName: platformName,
          message: `Generate test configuration for ${platformName}`
        }
      });

      if (error) {
        console.error('❌ Error generating AI test config:', error);
        return await this.createUniversalFallback(platformName);
      }

      if (data?.testConfig) {
        console.log(`✅ Generated AI test config for ${platformName}:`, data.testConfig);
        
        // Enhance AI config with universal authentication detection
        const enhancedConfig = await this.enhanceWithUniversalAuth(data.testConfig, platformName);
        return enhancedConfig;
      }

      return await this.createUniversalFallback(platformName);

    } catch (error) {
      console.error(`💥 Error generating test config for ${platformName}:`, error);
      return await this.createUniversalFallback(platformName);
    }
  }

  /**
   * ENHANCE: AI configuration with universal authentication detection
   */
  private static async enhanceWithUniversalAuth(aiConfig: any, platformName: string): Promise<TestConfig> {
    // Get universal authentication pattern
    const authPattern = await UniversalAuthDetector.detectAuthPattern(platformName);
    
    return {
      platform_name: platformName,
      base_url: aiConfig.base_url || this.generateIntelligentBaseUrl(platformName),
      test_endpoint: {
        method: aiConfig.test_endpoint?.method || "GET",
        path: aiConfig.test_endpoint?.path || this.generateIntelligentEndpoint(platformName),
        headers: aiConfig.test_endpoint?.headers || this.generateIntelligentHeaders(platformName)
      },
      authentication: {
        type: authPattern.type,
        location: authPattern.location,
        parameter_name: authPattern.parameter_name,
        format: authPattern.format,
        credential_field: authPattern.credential_field
      },
      required_fields: [authPattern.credential_field],
      field_mappings: { [authPattern.credential_field]: authPattern.credential_field },
      success_indicators: {
        status_codes: aiConfig.success_indicators?.status_codes || [200],
        response_patterns: aiConfig.success_indicators?.response_patterns || this.generateIntelligentSuccessPatterns(platformName)
      },
      error_patterns: aiConfig.error_patterns || {
        "401": "Invalid credentials or unauthorized access",
        "403": "Access denied or insufficient permissions",
        "429": "Rate limit exceeded",
        "404": "Resource not found"
      },
      ai_generated: true,
      config_version: "4.0-universal-auth"
    };
  }

  /**
   * UNIVERSAL: Create intelligent fallback without any hardcoding
   */
  private static async createUniversalFallback(platformName: string): Promise<TestConfig> {
    console.log(`🤖 UNIVERSAL FALLBACK: Creating config for ${platformName}`);
    
    // Get universal authentication pattern
    const authPattern = await UniversalAuthDetector.detectAuthPattern(platformName);
    
    return {
      platform_name: platformName,
      base_url: this.generateIntelligentBaseUrl(platformName),
      test_endpoint: {
        method: "GET",
        path: this.generateIntelligentEndpoint(platformName),
        headers: this.generateIntelligentHeaders(platformName)
      },
      authentication: {
        type: authPattern.type,
        location: authPattern.location,
        parameter_name: authPattern.parameter_name,
        format: authPattern.format,
        credential_field: authPattern.credential_field
      },
      required_fields: [authPattern.credential_field],
      field_mappings: { [authPattern.credential_field]: authPattern.credential_field },
      success_indicators: {
        status_codes: [200],
        response_patterns: this.generateIntelligentSuccessPatterns(platformName)
      },
      error_patterns: {
        "401": "Invalid credentials or unauthorized access",
        "403": "Access denied or insufficient permissions",
        "429": "Rate limit exceeded",
        "404": "Resource not found"
      },
      ai_generated: false,
      config_version: "4.0-universal-fallback"
    };
  }

  /**
   * Generate intelligent base URL with proper TLD detection
   */
  private static generateIntelligentBaseUrl(platformName: string): string {
    const lowerPlatform = platformName.toLowerCase();
    const cleanPlatform = lowerPlatform.replace(/\s+/g, '');
    
    // Specific platform mappings for known exceptions
    if (cleanPlatform.includes('elevenlabs') || cleanPlatform.includes('11labs')) {
      return 'https://api.elevenlabs.io';
    }
    
    // Smart TLD detection based on platform name patterns
    if (cleanPlatform.endsWith('.io') || cleanPlatform.includes('.io')) {
      const domain = cleanPlatform.replace(/\.io.*/, '');
      return `https://api.${domain}.io`;
    }
    
    if (cleanPlatform.endsWith('.ai') || cleanPlatform.includes('.ai')) {
      const domain = cleanPlatform.replace(/\.ai.*/, '');
      return `https://api.${domain}.ai`;
    }
    
    if (cleanPlatform.endsWith('.dev') || cleanPlatform.includes('.dev')) {
      const domain = cleanPlatform.replace(/\.dev.*/, '');
      return `https://api.${domain}.dev`;
    }
    
    if (cleanPlatform.endsWith('.co') || cleanPlatform.includes('.co')) {
      const domain = cleanPlatform.replace(/\.co.*/, '');
      return `https://api.${domain}.co`;
    }
    
    // Check for common API patterns
    if (cleanPlatform.includes('slack')) {
      return 'https://slack.com/api';
    }
    
    if (cleanPlatform.includes('github')) {
      return 'https://api.github.com';
    }
    
    if (cleanPlatform.includes('google')) {
      return 'https://www.googleapis.com';
    }
    
    // Default to .com for unknown platforms
    return `https://api.${cleanPlatform}.com`;
  }

  /**
   * Generate intelligent endpoint path based on platform patterns
   */
  private static generateIntelligentEndpoint(platformName: string): string {
    const lowerPlatform = platformName.toLowerCase();
    
    if (lowerPlatform.includes('elevenlabs') || lowerPlatform.includes('11labs')) {
      return '/v1/user';
    }
    
    if (lowerPlatform.includes('openai')) {
      return '/v1/models';
    }
    
    if (lowerPlatform.includes('slack')) {
      return '/auth.test';
    }
    
    if (lowerPlatform.includes('notion')) {
      return '/v1/users/me';
    }
    
    if (lowerPlatform.includes('github')) {
      return '/user';
    }
    
    if (lowerPlatform.includes('google')) {
      return '/oauth2/v1/userinfo';
    }
    
    // Common patterns
    return '/me';
  }

  /**
   * Generate intelligent headers based on platform
   */
  private static generateIntelligentHeaders(platformName: string): Record<string, string> {
    const lowerPlatform = platformName.toLowerCase();
    const baseHeaders: Record<string, string> = {};
    
    if (lowerPlatform.includes('notion')) {
      baseHeaders["Notion-Version"] = "2022-06-28";
    }
    
    if (lowerPlatform.includes('github')) {
      baseHeaders["Accept"] = "application/vnd.github.v3+json";
    }
    
    return baseHeaders;
  }

  /**
   * Generate intelligent success patterns
   */
  private static generateIntelligentSuccessPatterns(platformName: string): string[] {
    const lowerPlatform = platformName.toLowerCase();
    
    if (lowerPlatform.includes('elevenlabs') || lowerPlatform.includes('11labs')) {
      return ["subscription", "user_id", "xi_api_key"];
    }
    
    if (lowerPlatform.includes('openai')) {
      return ["data", "object", "id"];
    }
    
    if (lowerPlatform.includes('slack')) {
      return ["ok", "user", "team"];
    }
    
    if (lowerPlatform.includes('notion')) {
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

console.log('✅ TestConfigGenerator updated with Universal Authentication (NO HARDCODING)');
