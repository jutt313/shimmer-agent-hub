
// ENHANCED UNIVERSAL PLATFORM DETECTOR
// Works with existing system to improve platform detection and configuration

import { supabase } from '@/integrations/supabase/client';

export interface DetectedPlatformConfig {
  platform_name: string;
  confidence_score: number;
  api_config: any;
  credential_requirements: any[];
  detection_method: 'knowledge_store' | 'ai_generated' | 'pattern_match' | 'fallback';
}

export class EnhancedUniversalPlatformDetector {
  private static platformPatterns = new Map([
    // API-based detection patterns
    ['openai', { keywords: ['openai', 'gpt', 'chatgpt'], api_indicators: ['api.openai.com'] }],
    ['github', { keywords: ['github', 'git'], api_indicators: ['api.github.com', 'github.com/api'] }],
    ['slack', { keywords: ['slack'], api_indicators: ['slack.com/api', 'api.slack.com'] }],
    ['google', { keywords: ['google', 'gmail', 'sheets'], api_indicators: ['googleapis.com'] }],
    ['facebook', { keywords: ['facebook', 'fb', 'meta'], api_indicators: ['graph.facebook.com'] }],
    ['twitter', { keywords: ['twitter', 'x.com'], api_indicators: ['api.twitter.com'] }],
    ['salesforce', { keywords: ['salesforce', 'sfdc'], api_indicators: ['salesforce.com'] }],
    ['hubspot', { keywords: ['hubspot'], api_indicators: ['api.hubapi.com'] }],
    ['shopify', { keywords: ['shopify'], api_indicators: ['myshopify.com'] }],
    ['stripe', { keywords: ['stripe', 'payment'], api_indicators: ['api.stripe.com'] }],
    ['twilio', { keywords: ['twilio', 'sms'], api_indicators: ['api.twilio.com'] }],
    ['sendgrid', { keywords: ['sendgrid', 'email'], api_indicators: ['api.sendgrid.com'] }],
    ['mailchimp', { keywords: ['mailchimp'], api_indicators: ['api.mailchimp.com'] }],
    ['discord', { keywords: ['discord'], api_indicators: ['discord.com/api'] }],
    ['zoom', { keywords: ['zoom'], api_indicators: ['api.zoom.us'] }],
    ['microsoft', { keywords: ['microsoft', 'outlook', 'teams'], api_indicators: ['graph.microsoft.com'] }],
    ['aws', { keywords: ['aws', 'amazon'], api_indicators: ['amazonaws.com'] }],
    ['azure', { keywords: ['azure'], api_indicators: ['management.azure.com'] }],
    ['trello', { keywords: ['trello'], api_indicators: ['api.trello.com'] }],
    ['asana', { keywords: ['asana'], api_indicators: ['app.asana.com/api'] }],
    ['notion', { keywords: ['notion'], api_indicators: ['api.notion.com'] }]
  ]);

  /**
   * Enhanced platform detection using Universal Knowledge Store + AI + Patterns
   */
  static async detectPlatform(platformName: string): Promise<DetectedPlatformConfig> {
    console.log(`🔍 Enhanced Universal Detection for: ${platformName}`);
    
    const cleanPlatformName = platformName.toLowerCase().trim();
    
    // Phase 1: Check Universal Knowledge Store first
    const knowledgeStoreResult = await this.checkUniversalKnowledgeStore(cleanPlatformName);
    if (knowledgeStoreResult) {
      console.log(`✅ Found in Universal Knowledge Store: ${knowledgeStoreResult.platform_name}`);
      return {
        platform_name: knowledgeStoreResult.platform_name,
        confidence_score: 0.95,
        api_config: knowledgeStoreResult.api_config,
        credential_requirements: knowledgeStoreResult.credential_fields || [],
        detection_method: 'knowledge_store'
      };
    }

    // Phase 2: Use AI generation with your existing chat-ai system
    const aiResult = await this.getAIGeneratedConfig(cleanPlatformName);
    if (aiResult) {
      console.log(`🤖 AI Generated config for: ${platformName}`);
      return {
        platform_name: platformName,
        confidence_score: 0.85,
        api_config: aiResult,
        credential_requirements: this.extractCredentialRequirements(aiResult),
        detection_method: 'ai_generated'
      };
    }

    // Phase 3: Pattern matching fallback
    const patternResult = this.detectByPattern(cleanPlatformName);
    if (patternResult) {
      console.log(`📋 Pattern matched: ${patternResult.platform_name}`);
      return patternResult;
    }

    // Phase 4: Intelligent fallback
    return this.createIntelligentFallback(platformName);
  }

  /**
   * Check Universal Knowledge Store for platform configuration
   */
  private static async checkUniversalKnowledgeStore(platformName: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('universal_knowledge_store')
        .select('*')
        .eq('category', 'platform_knowledge')
        .or(`platform_name.ilike.%${platformName}%,title.ilike.%${platformName}%`)
        .order('usage_count', { ascending: false })
        .limit(1);

      if (error) {
        console.error('❌ Error querying Universal Knowledge Store:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('💥 Exception in Universal Knowledge Store query:', error);
      return null;
    }
  }

  /**
   * Get AI-generated configuration using existing chat-ai system
   */
  private static async getAIGeneratedConfig(platformName: string): Promise<any> {
    try {
      console.log(`🤖 Calling existing chat-ai for: ${platformName}`);
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: platformName,
          messages: [],
          requestType: 'api_config_generation'
        }
      });

      if (error) {
        console.error('❌ Error calling chat-ai for config generation:', error);
        return null;
      }

      if (data && typeof data === 'string') {
        const parsedData = JSON.parse(data);
        return parsedData.api_configurations?.[0] || null;
      }

      return data?.api_configurations?.[0] || null;
    } catch (error) {
      console.error('💥 Exception in AI config generation:', error);
      return null;
    }
  }

  /**
   * Enhanced pattern-based detection
   */
  private static detectByPattern(platformName: string): DetectedPlatformConfig | null {
    for (const [key, pattern] of this.platformPatterns.entries()) {
      const keywordMatch = pattern.keywords.some(keyword => 
        platformName.includes(keyword.toLowerCase())
      );
      
      if (keywordMatch) {
        return {
          platform_name: key,
          confidence_score: 0.7,
          api_config: this.generatePatternBasedConfig(key, pattern),
          credential_requirements: this.getStandardCredentials(key),
          detection_method: 'pattern_match'
        };
      }
    }
    return null;
  }

  /**
   * Generate configuration based on pattern recognition
   */
  private static generatePatternBasedConfig(platformKey: string, pattern: any): any {
    const baseUrl = pattern.api_indicators?.[0] ? 
      `https://${pattern.api_indicators[0]}` : 
      `https://api.${platformKey}.com`;

    return {
      base_url: baseUrl,
      auth_config: {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {token}'
      },
      test_endpoint: {
        method: 'GET',
        path: '/me',
        description: `Test ${platformKey} credentials`
      }
    };
  }

  /**
   * Extract credential requirements from AI config
   */
  private static extractCredentialRequirements(aiConfig: any): any[] {
    if (!aiConfig) return [];
    
    // Extract from test_endpoint or common patterns
    const commonCreds = [
      { field: 'api_key', type: 'string', required: true },
      { field: 'access_token', type: 'string', required: false }
    ];

    return commonCreds;
  }

  /**
   * Get standard credentials for known platforms
   */
  private static getStandardCredentials(platformKey: string): any[] {
    const credentialMap: Record<string, any[]> = {
      openai: [{ field: 'api_key', type: 'string', required: true }],
      github: [{ field: 'personal_access_token', type: 'string', required: true }],
      slack: [{ field: 'bot_token', type: 'string', required: true }],
      google: [{ field: 'access_token', type: 'string', required: true }],
      stripe: [{ field: 'secret_key', type: 'string', required: true }]
    };

    return credentialMap[platformKey] || [
      { field: 'api_key', type: 'string', required: true }
    ];
  }

  /**
   * Create intelligent fallback configuration
   */
  private static createIntelligentFallback(platformName: string): DetectedPlatformConfig {
    return {
      platform_name: platformName,
      confidence_score: 0.5,
      api_config: {
        base_url: `https://api.${platformName.toLowerCase().replace(/\s+/g, '')}.com`,
        auth_config: {
          type: 'bearer',
          location: 'header',
          parameter_name: 'Authorization',
          format: 'Bearer {token}'
        },
        test_endpoint: {
          method: 'GET',
          path: '/me',
          description: `Test ${platformName} authentication`
        }
      },
      credential_requirements: [
        { field: 'api_key', type: 'string', required: true },
        { field: 'access_token', type: 'string', required: false }
      ],
      detection_method: 'fallback'
    };
  }
}

console.log('✅ Enhanced Universal Platform Detector loaded with 20+ built-in patterns');
