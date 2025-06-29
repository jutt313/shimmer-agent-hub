
import { RateLimiter } from './rateLimiter';
import { globalErrorLogger } from './errorLogger';

export interface AbusePreventionConfig {
  enableRateLimit: boolean;
  enableAbuseDetection: boolean;
  enableCaptcha: boolean;
  maxRequestsPerMinute: number;
  suspiciousActivityThreshold: number;
}

export class AbusePreventionMiddleware {
  private blockedIPs = new Set<string>();
  private suspiciousUsers = new Map<string, { count: number; lastActivity: number }>();
  private config: AbusePreventionConfig;

  constructor(config: Partial<AbusePreventionConfig> = {}) {
    this.config = {
      enableRateLimit: true,
      enableAbuseDetection: true,
      enableCaptcha: false,
      maxRequestsPerMinute: 60,
      suspiciousActivityThreshold: 10,
      ...config
    };
  }

  async checkRequest(
    userId: string | null,
    action: string,
    ipAddress?: string
  ): Promise<{ allowed: boolean; reason?: string; requiresCaptcha?: boolean }> {
    try {
      // Check if IP is blocked
      if (ipAddress && this.blockedIPs.has(ipAddress)) {
        globalErrorLogger.log('WARN', 'Blocked IP attempted request', {
          ipAddress,
          action,
          userId
        });
        return { allowed: false, reason: 'IP address is temporarily blocked' };
      }

      // Check rate limiting using static method
      if (this.config.enableRateLimit && userId) {
        const rateLimitResult = await RateLimiter.checkRateLimit(userId, action);
        if (!rateLimitResult.allowed) {
          return { 
            allowed: false, 
            reason: 'Rate limit exceeded',
            requiresCaptcha: this.config.enableCaptcha
          };
        }
      }

      // Check abuse patterns for logged-in users
      if (userId && this.config.enableAbuseDetection) {
        const isAbusive = this.checkAbusePattern(userId, action);
        
        if (isAbusive) {
          this.handleAbusiveUser(userId, 'medium', action);
          
          return { 
            allowed: false, 
            reason: 'Suspicious activity detected. Please try again later.',
            requiresCaptcha: true
          };
        }
      }

      return { allowed: true };
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Abuse prevention middleware error', {
        error: error.message,
        userId,
        action,
        ipAddress
      });
      
      // Fail open - allow request if middleware fails
      return { allowed: true };
    }
  }

  private handleAbusiveUser(userId: string, severity: string, action: string): void {
    const userEntry = this.suspiciousUsers.get(userId) || { count: 0, lastActivity: 0 };
    userEntry.count += 1;
    userEntry.lastActivity = Date.now();
    this.suspiciousUsers.set(userId, userEntry);

    globalErrorLogger.log('WARN', 'Abusive user pattern detected', {
      userId,
      severity,
      action,
      totalSuspiciousActivities: userEntry.count
    });

    // Auto-block user temporarily for critical abuse
    if (severity === 'critical' && userEntry.count > 3) {
      this.temporarilyBlockUser(userId);
    }
  }

  private temporarilyBlockUser(userId: string): void {
    globalErrorLogger.log('ERROR', 'User temporarily blocked for abuse', { userId });
    
    // In a real implementation, you'd store this in a database
    // For now, we'll use memory with automatic cleanup
    setTimeout(() => {
      this.suspiciousUsers.delete(userId);
      globalErrorLogger.log('INFO', 'User block expired', { userId });
    }, 15 * 60 * 1000); // 15 minutes
  }

  blockIP(ipAddress: string, duration: number = 30 * 60 * 1000): void {
    this.blockedIPs.add(ipAddress);
    globalErrorLogger.log('WARN', 'IP address blocked', { ipAddress, duration });
    
    setTimeout(() => {
      this.blockedIPs.delete(ipAddress);
      globalErrorLogger.log('INFO', 'IP block expired', { ipAddress });
    }, duration);
  }

  isUserSuspicious(userId: string): boolean {
    const userEntry = this.suspiciousUsers.get(userId);
    if (!userEntry) return false;
    
    // Consider user suspicious if they have recent suspicious activity
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    return userEntry.lastActivity > fiveMinutesAgo && userEntry.count > this.config.suspiciousActivityThreshold;
  }

  getSuspiciousActivityReport(): { userId: string; count: number; lastActivity: number }[] {
    return Array.from(this.suspiciousUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }

  private checkAbusePattern(userId: string, action: string): boolean {
    // Simple abuse detection logic
    // In production, this would be more sophisticated
    console.log(`Checking abuse pattern for ${userId} on ${action}`);
    return false; // No abuse detected for now
  }
}

// Global abuse prevention middleware
export const globalAbusePreventionMiddleware = new AbusePreventionMiddleware();
