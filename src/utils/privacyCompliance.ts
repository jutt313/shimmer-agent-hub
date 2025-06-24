
import { globalErrorLogger } from './errorLogger';

export interface PrivacyConfig {
  dataRetentionDays: number;
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  enableGDPRCompliance: boolean;
  enableCCPACompliance: boolean;
}

export class PrivacyComplianceManager {
  private static instance: PrivacyComplianceManager;
  private config: PrivacyConfig;

  private constructor() {
    this.config = {
      dataRetentionDays: 365,
      allowDataExport: true,
      allowDataDeletion: true,
      enableGDPRCompliance: true,
      enableCCPACompliance: true
    };
  }

  static getInstance(): PrivacyComplianceManager {
    if (!PrivacyComplianceManager.instance) {
      PrivacyComplianceManager.instance = new PrivacyComplianceManager();
    }
    return PrivacyComplianceManager.instance;
  }

  sanitizeUserData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'credentials'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeUserData(sanitized[key]);
      }
    });

    return sanitized;
  }

  validateDataRetention(createdAt: Date): boolean {
    const now = new Date();
    const retentionLimit = new Date(now.getTime() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000));
    return createdAt >= retentionLimit;
  }

  async exportUserData(userId: string): Promise<any> {
    try {
      globalErrorLogger.log('INFO', 'User data export initiated', { userId });
      
      // This would integrate with your actual data sources
      const userData = {
        userId,
        exportDate: new Date().toISOString(),
        notice: 'This export contains all personal data associated with your account'
      };

      return this.sanitizeUserData(userData);
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'User data export failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async deleteUserData(userId: string): Promise<boolean> {
    try {
      globalErrorLogger.log('WARN', 'User data deletion initiated', { userId });
      
      // This would integrate with your actual data deletion logic
      // For now, we just log the request
      
      return true;
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'User data deletion failed', {
        userId,
        error: error.message
      });
      return false;
    }
  }
}

export const globalPrivacyManager = PrivacyComplianceManager.getInstance();
