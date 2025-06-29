
import { supabase } from '@/integrations/supabase/client';
import { globalErrorLogger } from '@/utils/errorLogger';

interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
  tier: 'free' | 'pro' | 'enterprise';
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private static readonly RATE_LIMITS: Record<string, RateLimitConfig> = {
    free: { requests: 100, window: 3600, tier: 'free' }, // 100/hour
    pro: { requests: 1000, window: 3600, tier: 'pro' }, // 1000/hour
    enterprise: { requests: 10000, window: 3600, tier: 'enterprise' } // 10k/hour
  };

  /**
   * Check if request is within rate limits
   */
  static async checkRateLimit(
    identifier: string, // user_id or api_token_id
    endpoint: string,
    tier: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<RateLimitResult> {
    try {
      const config = this.RATE_LIMITS[tier];
      const windowStart = Math.floor(Date.now() / 1000) - config.window;
      const key = `${identifier}:${endpoint}`;

      // Get recent usage
      const { data: usage, error } = await supabase
        .from('api_usage_logs')
        .select('created_at')
        .eq('user_id', identifier)
        .eq('endpoint', endpoint)
        .gte('created_at', new Date(windowStart * 1000).toISOString());

      if (error) throw error;

      const currentUsage = usage?.length || 0;
      const remaining = Math.max(0, config.requests - currentUsage);
      const resetTime = Math.floor(Date.now() / 1000) + config.window;

      if (currentUsage >= config.requests) {
        const retryAfter = config.window - (Math.floor(Date.now() / 1000) - windowStart);
        
        globalErrorLogger.log('WARN', 'Rate limit exceeded', {
          identifier,
          endpoint,
          currentUsage,
          limit: config.requests,
          tier
        });

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.max(1, retryAfter)
        };
      }

      return {
        allowed: true,
        remaining,
        resetTime
      };
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Rate limit check failed', {
        identifier,
        endpoint,
        error: error.message
      });

      // Allow request on error to avoid blocking users
      return {
        allowed: true,
        remaining: 100,
        resetTime: Math.floor(Date.now() / 1000) + 3600
      };
    }
  }

  /**
   * Record API usage for rate limiting
   */
  static async recordUsage(
    userId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime?: number,
    apiTokenId?: string,
    developerIntegrationId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: userId,
          endpoint,
          method,
          status_code: statusCode,
          response_time_ms: responseTime,
          api_token_id: apiTokenId,
          developer_integration_id: developerIntegrationId
        });
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to record API usage', {
        userId,
        endpoint,
        method,
        error: error.message
      });
    }
  }

  /**
   * Get rate limit headers for response
   */
  static getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': '100', // Will be dynamic based on tier
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetTime.toString(),
      ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {})
    };
  }

  /**
   * Clean old usage logs (should be run periodically)
   */
  static async cleanOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      await supabase
        .from('api_usage_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      globalErrorLogger.log('INFO', 'Cleaned old usage logs', {
        cutoffDate: cutoffDate.toISOString()
      });
    } catch (error: any) {
      globalErrorLogger.log('ERROR', 'Failed to clean old logs', {
        error: error.message
      });
    }
  }

  /**
   * Check for abuse patterns
   */
  checkAbusePattern(identifier: string, endpoint: string): boolean {
    // Simple abuse detection logic
    // In production, this would be more sophisticated
    console.log(`Checking abuse pattern for ${identifier} on ${endpoint}`);
    return false; // No abuse detected for now
  }
}

// Export global instance for backwards compatibility
export const globalRateLimiter = new RateLimiter();
