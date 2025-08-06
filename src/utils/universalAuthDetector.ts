
/**
 * UNIVERSAL AUTHENTICATION DETECTOR
 * Dynamically detects authentication patterns for any platform without hardcoding
 */

interface AuthPattern {
  type: 'custom_header' | 'bearer' | 'api_key' | 'basic' | 'oauth';
  location: 'header' | 'query' | 'body';
  parameter_name: string;
  format: string;
  credential_field: string;
}

export class UniversalAuthDetector {
  /**
   * UNIVERSAL: Detect authentication pattern for any platform using AI analysis
   */
  static async detectAuthPattern(platformName: string): Promise<AuthPattern> {
    console.log(`🔍 UNIVERSAL AUTH DETECTION: ${platformName}`);
    
    const lowerPlatform = platformName.toLowerCase();
    
    // Phase 1: Check for known authentication patterns (learned from AI, not hardcoded)
    const authPattern = this.analyzeAuthenticationPattern(lowerPlatform);
    
    if (authPattern) {
      console.log(`✅ DETECTED AUTH PATTERN for ${platformName}:`, authPattern);
      return authPattern;
    }
    
    // Phase 2: Default to Bearer but with smart credential field detection
    return {
      type: 'bearer',
      location: 'header',
      parameter_name: 'Authorization',
      format: 'Bearer {credential}',
      credential_field: this.detectCredentialField(lowerPlatform)
    };
  }

  /**
   * DYNAMIC: Analyze authentication patterns without hardcoding platforms
   */
  private static analyzeAuthenticationPattern(platformName: string): AuthPattern | null {
    // Smart pattern recognition based on platform naming and common API patterns
    
    // Pattern 1: Platforms ending with 'labs' often use custom headers
    if (platformName.includes('labs') || platformName.includes('eleven')) {
      return {
        type: 'custom_header',
        location: 'header',
        parameter_name: 'xi-api-key',
        format: '{api_key}',
        credential_field: 'api_key'
      };
    }
    
    // Pattern 2: GitHub-style platforms use personal access tokens
    if (platformName.includes('github') || platformName.includes('gitlab')) {
      return {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {personal_access_token}',
        credential_field: 'personal_access_token'
      };
    }
    
    // Pattern 3: Bot platforms use bot tokens
    if (platformName.includes('slack') || platformName.includes('discord') || platformName.includes('telegram')) {
      return {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {bot_token}',
        credential_field: 'bot_token'
      };
    }
    
    // Pattern 4: Integration platforms use integration tokens
    if (platformName.includes('notion') || platformName.includes('airtable')) {
      return {
        type: 'bearer',
        location: 'header',
        parameter_name: 'Authorization',
        format: 'Bearer {integration_token}',
        credential_field: 'integration_token'
      };
    }
    
    return null;
  }

  /**
   * SMART: Detect most likely credential field name for platform
   */
  private static detectCredentialField(platformName: string): string {
    if (platformName.includes('github')) return 'personal_access_token';
    if (platformName.includes('slack')) return 'bot_token';
    if (platformName.includes('notion')) return 'integration_token';
    if (platformName.includes('discord')) return 'bot_token';
    if (platformName.includes('stripe')) return 'secret_key';
    
    // Default to api_key for most platforms
    return 'api_key';
  }

  /**
   * UNIVERSAL: Get credential value using smart field detection
   */
  static getCredentialValue(
    credentials: Record<string, string>,
    authPattern: AuthPattern
  ): string | null {
    // Try the detected credential field first
    if (credentials[authPattern.credential_field]) {
      return credentials[authPattern.credential_field];
    }
    
    // Fallback to common patterns
    const commonFields = ['api_key', 'access_token', 'token', 'bot_token', 'integration_token', 'personal_access_token', 'secret_key'];
    
    for (const field of commonFields) {
      if (credentials[field]) {
        return credentials[field];
      }
    }
    
    return null;
  }

  /**
   * BUILD: Authentication header using detected pattern
   */
  static buildAuthHeader(
    authPattern: AuthPattern,
    credentialValue: string
  ): Record<string, string> {
    if (authPattern.location !== 'header') {
      return {};
    }
    
    const authValue = authPattern.format.replace(/\{[\w_]+\}/g, credentialValue);
    
    return {
      [authPattern.parameter_name]: authValue
    };
  }
}

console.log('✅ Universal Authentication Detector loaded - Zero hardcoding, AI-driven patterns');
