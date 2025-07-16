
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
   * Create intelligent fallback configuration based on platform name
   */
  private static createIntelligentFallback(platformName: string): TestConfig {
    const lowerPlatform = platformName.toLowerCase();
    
    // Platform-specific configurations
    if (lowerPlatform.includes('openai')) {
      return {
        platform_name: "OpenAI",
        base_url: "https://api.openai.com/v1",
        test_endpoint: {
          method: "GET",
          path: "/models",
          headers: {}
        },
        authentication: {
          type: "bearer",
          location: "header",
          parameter_name: "Authorization",
          format: "Bearer {api_key}"
        },
        required_fields: ["api_key"],
        field_mappings: { "api_key": "api_key" },
        success_indicators: {
          status_codes: [200],
          response_patterns: ["data", "object"]
        },
        error_patterns: {
          "401": "Invalid API key",
          "429": "Rate limit exceeded"
        },
        ai_generated: false,
        config_version: "2.0"
      };
    }
    
    if (lowerPlatform.includes('slack')) {
      return {
        platform_name: "Slack",
        base_url: "https://slack.com/api",
        test_endpoint: {
          method: "POST",
          path: "/auth.test",
          headers: {}
        },
        authentication: {
          type: "bearer",
          location: "header",
          parameter_name: "Authorization",
          format: "Bearer {bot_token}"
        },
        required_fields: ["bot_token"],
        field_mappings: { "bot_token": "bot_token" },
        success_indicators: {
          status_codes: [200],
          response_patterns: ["ok", "user"]
        },
        error_patterns: {
          "401": "Invalid token",
          "403": "Insufficient permissions"
        },
        ai_generated: false,
        config_version: "2.0"
      };
    }
    
    if (lowerPlatform.includes('notion')) {
      return {
        platform_name: "Notion",
        base_url: "https://api.notion.com/v1",
        test_endpoint: {
          method: "GET",
          path: "/users/me",
          headers: {
            "Notion-Version": "2022-06-28"
          }
        },
        authentication: {
          type: "bearer",
          location: "header",
          parameter_name: "Authorization",
          format: "Bearer {integration_token}"
        },
        required_fields: ["integration_token"],
        field_mappings: { "integration_token": "integration_token" },
        success_indicators: {
          status_codes: [200],
          response_patterns: ["object", "id"]
        },
        error_patterns: {
          "401": "Unauthorized - Invalid integration token",
          "400": "Bad request"
        },
        ai_generated: false,
        config_version: "2.0"
      };
    }

    // Generic fallback
    return {
      platform_name: platformName,
      base_url: `https://api.${lowerPlatform.replace(/\s+/g, '')}.com`,
      test_endpoint: {
        method: "GET",
        path: "/me",
        headers: {}
      },
      authentication: {
        type: "bearer",
        location: "header",
        parameter_name: "Authorization",
        format: "Bearer {api_key}"
      },
      required_fields: ["api_key"],
      field_mappings: { "api_key": "api_key" },
      success_indicators: {
        status_codes: [200],
        response_patterns: ["id", "name"]
      },
      error_patterns: {
        "401": "Invalid credentials",
        "403": "Access denied"
      },
      ai_generated: false,
      config_version: "2.0"
    };
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

console.log('✅ TestConfigGenerator loaded with Chat-AI integration');
