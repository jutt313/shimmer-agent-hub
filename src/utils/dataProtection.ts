
import { globalErrorLogger } from './errorLogger';

export class DataProtectionService {
  private static instance: DataProtectionService;

  private constructor() {}

  static getInstance(): DataProtectionService {
    if (!DataProtectionService.instance) {
      DataProtectionService.instance = new DataProtectionService();
    }
    return DataProtectionService.instance;
  }

  /**
   * Encrypt sensitive data using Web Crypto API
   */
  async encryptSensitiveData(data: string, keyMaterial?: string): Promise<string> {
    try {
      const key = await this.deriveKey(keyMaterial);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Data encryption failed', {
        error: error.message
      });
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data using Web Crypto API
   */
  async decryptSensitiveData(encryptedData: string, keyMaterial?: string): Promise<string> {
    try {
      const key = await this.deriveKey(keyMaterial);
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Data decryption failed', {
        error: error.message
      });
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  private async deriveKey(keyMaterial?: string): Promise<CryptoKey> {
    const material = keyMaterial || 'default-encryption-key-32-bytes!';
    
    const keyMaterialBuffer = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(material),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('secure-salt-16-bytes'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterialBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Mask sensitive information for display
   */
  maskSensitiveInfo(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(data?.length || 0);
    }
    
    const visible = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + visible;
  }

  /**
   * Validate data integrity and check for malicious content
   */
  validateDataIntegrity(data: any): boolean {
    if (!data) return false;
    
    // Check for common injection patterns
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /data:application\/x-javascript/gi
    ];

    const dataString = JSON.stringify(data);
    return !dangerousPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Sanitize user input to prevent XSS and injection attacks
   */
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Generate secure random tokens
   */
  generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data for comparison without storing plaintext
   */
  async hashSensitiveData(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Data hashing failed', {
        error: error.message
      });
      throw new Error('Failed to hash sensitive data');
    }
  }

  /**
   * Validate API keys and tokens format
   */
  validateCredentialFormat(credential: string, type: string): boolean {
    const patterns: Record<string, RegExp> = {
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
      slack: /^xoxp-[a-zA-Z0-9-]{72}$|^xoxb-[a-zA-Z0-9-]{56}$/,
      google: /^AIza[0-9A-Za-z-_]{35}$/,
      stripe: /^sk_(test|live)_[a-zA-Z0-9]{99}$/,
      trello: /^[a-f0-9]{32}$/,
      github: /^ghp_[a-zA-Z0-9]{36}$/
    };

    const pattern = patterns[type.toLowerCase()];
    if (!pattern) {
      // Generic validation for unknown types
      return credential.length >= 16 && /^[a-zA-Z0-9\-_]+$/.test(credential);
    }

    return pattern.test(credential);
  }

  /**
   * Check if data contains potential secrets
   */
  containsSecrets(data: string): boolean {
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{48,}/g, // OpenAI API keys
      /xoxp-[a-zA-Z0-9-]{72}/g, // Slack tokens
      /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
      /sk_(test|live)_[a-zA-Z0-9]{99}/g, // Stripe keys
      /ghp_[a-zA-Z0-9]{36}/g, // GitHub tokens
      /[a-f0-9]{32}/g, // Generic API keys
    ];

    return secretPatterns.some(pattern => pattern.test(data));
  }

  /**
   * Redact secrets from logs and error messages
   */
  redactSecrets(data: string): string {
    const secretPatterns = [
      { pattern: /sk-[a-zA-Z0-9]{48,}/g, replacement: 'sk-***REDACTED***' },
      { pattern: /xoxp-[a-zA-Z0-9-]{72}/g, replacement: 'xoxp-***REDACTED***' },
      { pattern: /AIza[0-9A-Za-z-_]{35}/g, replacement: 'AIza***REDACTED***' },
      { pattern: /sk_(test|live)_[a-zA-Z0-9]{99}/g, replacement: 'sk_***REDACTED***' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/g, replacement: 'ghp_***REDACTED***' }
    ];

    let redactedData = data;
    secretPatterns.forEach(({ pattern, replacement }) => {
      redactedData = redactedData.replace(pattern, replacement);
    });

    return redactedData;
  }
}

export const globalDataProtection = DataProtectionService.getInstance();
