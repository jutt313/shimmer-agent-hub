
// Security validation utilities
export class SecurityValidator {
  private static readonly FORBIDDEN_KEYWORDS = [
    'eval', 'function', 'constructor', 'prototype', '__proto__',
    'window', 'document', 'process', 'require', 'import', 'export',
    'global', 'globalThis', 'this', 'localStorage', 'sessionStorage'
  ];

  private static readonly SAFE_OPERATORS = [
    '==', '!=', '===', '!==', '>', '<', '>=', '<=',
    '&&', '||', '!', '+', '-', '*', '/', '%'
  ];

  static validateExpression(expression: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for forbidden keywords
    const lowerExpression = expression.toLowerCase();
    for (const keyword of this.FORBIDDEN_KEYWORDS) {
      if (lowerExpression.includes(keyword)) {
        errors.push(`Forbidden keyword detected: ${keyword}`);
      }
    }

    // Check for suspicious patterns
    if (expression.includes('..')) {
      errors.push('Path traversal attempt detected');
    }

    if (expression.includes('javascript:')) {
      errors.push('JavaScript protocol detected');
    }

    if (expression.includes('<script')) {
      errors.push('Script tag detected');
    }

    // Validate characters (allow alphanumeric, spaces, and safe operators)
    const allowedPattern = /^[a-zA-Z0-9\s\.\[\]"'<>=!&|()_+\-*/%]+$/;
    if (!allowedPattern.test(expression)) {
      errors.push('Expression contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static validateAPIKey(apiKey: string, platform: string): { isValid: boolean; error?: string } {
    if (!apiKey || typeof apiKey !== 'string') {
      return { isValid: false, error: 'API key is required' };
    }

    // Platform-specific validation
    switch (platform.toLowerCase()) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { isValid: false, error: 'OpenAI API key must start with "sk-"' };
        }
        break;
      case 'slack':
        if (!apiKey.startsWith('xoxb-') && !apiKey.startsWith('xoxp-')) {
          return { isValid: false, error: 'Slack bot token must start with "xoxb-" or "xoxp-"' };
        }
        break;
      case 'trello':
        if (apiKey.length !== 32) {
          return { isValid: false, error: 'Trello API key must be 32 characters long' };
        }
        break;
    }

    // General length validation
    if (apiKey.length < 10) {
      return { isValid: false, error: 'API key is too short' };
    }

    if (apiKey.length > 200) {
      return { isValid: false, error: 'API key is too long' };
    }

    return { isValid: true };
  }

  static validateWebhookPayload(payload: any): { isValid: boolean; error?: string } {
    if (!payload) {
      return { isValid: false, error: 'Payload is required' };
    }

    // Check payload size (max 1MB)
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > 1024 * 1024) {
      return { isValid: false, error: 'Payload size exceeds 1MB limit' };
    }

    // Check for deeply nested objects (max 10 levels)
    const checkDepth = (obj: any, depth = 0): boolean => {
      if (depth > 10) return false;
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (!checkDepth(obj[key], depth + 1)) return false;
        }
      }
      return true;
    };

    if (!checkDepth(payload)) {
      return { isValid: false, error: 'Payload nesting exceeds maximum depth' };
    }

    return { isValid: true };
  }
}
