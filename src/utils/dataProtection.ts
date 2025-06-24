
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

  encryptSensitiveData(data: string): string {
    // In a real implementation, use proper encryption
    // For now, we'll use base64 encoding as a placeholder
    try {
      return btoa(data);
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Data encryption failed', {
        error: error.message
      });
      return data;
    }
  }

  decryptSensitiveData(encryptedData: string): string {
    try {
      return atob(encryptedData);
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Data decryption failed', {
        error: error.message
      });
      return encryptedData;
    }
  }

  maskSensitiveInfo(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    
    const visible = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + visible;
  }

  validateDataIntegrity(data: any): boolean {
    // Basic validation
    if (!data) return false;
    
    // Check for common injection patterns
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];

    const dataString = JSON.stringify(data);
    return !dangerousPatterns.some(pattern => pattern.test(dataString));
  }

  sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .trim();
  }
}

export const globalDataProtection = DataProtectionService.getInstance();
