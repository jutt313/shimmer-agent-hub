// Rate limiting system for API calls
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  platform: string;
}

export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private configs = new Map<string, RateLimitConfig>();
  private abuseTracking = new Map<string, number[]>();

  constructor() {
    // Default rate limits for common platforms
    this.setRateLimit('slack', { maxRequests: 50, windowMs: 60000, platform: 'slack' });
    this.setRateLimit('gmail', { maxRequests: 100, windowMs: 60000, platform: 'gmail' });
    this.setRateLimit('trello', { maxRequests: 100, windowMs: 10000, platform: 'trello' });
    this.setRateLimit('openai', { maxRequests: 60, windowMs: 60000, platform: 'openai' });
    this.setRateLimit('default', { maxRequests: 30, windowMs: 60000, platform: 'default' });
  }

  setRateLimit(platform: string, config: RateLimitConfig): void {
    this.configs.set(platform, config);
    this.buckets.set(platform, new TokenBucket(config.maxRequests, config.windowMs));
  }

  async checkRateLimit(platform: string, userId?: string): Promise<{ allowed: boolean; resetTime?: number; reason?: string }> {
    const normalizedPlatform = platform.toLowerCase();
    let bucket = this.buckets.get(normalizedPlatform);
    
    if (!bucket) {
      // Use default rate limit if platform not configured
      const defaultConfig = this.configs.get('default')!;
      bucket = new TokenBucket(defaultConfig.maxRequests, defaultConfig.windowMs);
      this.buckets.set(normalizedPlatform, bucket);
    }
    
    const allowed = bucket.consume();
    
    // Log suspicious activity
    if (!allowed && userId) {
      globalErrorLogger.log('WARN', 'Rate limit exceeded', {
        platform,
        userId,
        available: bucket.getAvailableTokens(),
        resetTime: bucket.getResetTime(),
        suspiciousActivity: true
      });
    }
    
    return {
      allowed,
      resetTime: allowed ? undefined : bucket.getResetTime(),
      reason: allowed ? undefined : `Rate limit exceeded for ${platform}`
    };
  }

  async waitForRateLimit(platform: string): Promise<void> {
    const normalizedPlatform = platform.toLowerCase();
    const bucket = this.buckets.get(normalizedPlatform);
    
    if (!bucket) {
      return; // No rate limit configured
    }
    
    const waitTime = bucket.getWaitTime();
    if (waitTime > 0) {
      console.log(`⏳ Rate limit reached for ${platform}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  getRateLimitStatus(platform: string): { available: number; resetTime: number } {
    const normalizedPlatform = platform.toLowerCase();
    const bucket = this.buckets.get(normalizedPlatform);
    
    if (!bucket) {
      return { available: 0, resetTime: 0 };
    }
    
    return {
      available: bucket.getAvailableTokens(),
      resetTime: bucket.getResetTime()
    };
  }

  checkAbusePattern(userId: string, action: string): { isAbusive: boolean; severity: 'low' | 'medium' | 'high' | 'critical' } {
    const userKey = `${userId}-${action}`;
    const now = Date.now();
    const window = 60000; // 1 minute window
    
    if (!this.abuseTracking.has(userKey)) {
      this.abuseTracking.set(userKey, []);
    }
    
    const actions = this.abuseTracking.get(userKey)!;
    
    // Clean old entries
    const recentActions = actions.filter(timestamp => now - timestamp < window);
    this.abuseTracking.set(userKey, recentActions);
    
    // Add current action
    recentActions.push(now);
    
    // Determine abuse severity
    if (recentActions.length > 100) {
      return { isAbusive: true, severity: 'critical' };
    } else if (recentActions.length > 50) {
      return { isAbusive: true, severity: 'high' };
    } else if (recentActions.length > 25) {
      return { isAbusive: true, severity: 'medium' };
    } else if (recentActions.length > 15) {
      return { isAbusive: true, severity: 'low' };
    }
    
    return { isAbusive: false, severity: 'low' };
  }
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private refillRate: number;

  constructor(
    private capacity: number,
    private windowMs: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.refillRate = capacity / windowMs; // tokens per millisecond
  }

  consume(): boolean {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getWaitTime(): number {
    this.refill();
    
    if (this.tokens >= 1) {
      return 0;
    }
    
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }

  getResetTime(): number {
    const tokensNeeded = this.capacity - this.tokens;
    return Date.now() + Math.ceil(tokensNeeded / this.refillRate);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();
