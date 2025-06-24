
// Advanced error handling with exponential backoff and circuit breaker
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    console.log('✅ Circuit breaker reset to CLOSED');
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      console.log(`🚨 Circuit breaker OPENED after ${this.failures} failures`);
    }
  }

  getState(): string {
    return this.state;
  }
}

export class RetryHandler {
  constructor(private config: RetryConfig) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    circuitBreaker?: CircuitBreaker
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${this.config.maxAttempts} for ${operationName}`);
        
        if (circuitBreaker) {
          return await circuitBreaker.execute(operation);
        } else {
          return await operation();
        }
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed for ${operationName}:`, error.message);
        
        if (attempt === this.config.maxAttempts) {
          console.error(`💥 All ${this.config.maxAttempts} attempts failed for ${operationName}`);
          break;
        }
        
        // Calculate delay with exponential backoff and optional jitter
        const delay = this.calculateDelay(attempt);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }
    
    throw new Error(`Operation failed after ${this.config.maxAttempts} attempts: ${lastError.message}`);
  }

  private calculateDelay(attempt: number): number {
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelay);
    
    if (this.config.jitter) {
      // Add jitter to prevent thundering herd problem
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.round(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ErrorLogger {
  private logs: Array<{
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
    message: string;
    context?: any;
    stepId?: string;
    automationId?: string;
    runId?: string;
  }> = [];

  log(
    level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    message: string,
    context?: any,
    stepId?: string,
    automationId?: string,
    runId?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      stepId,
      automationId,
      runId
    };
    
    this.logs.push(logEntry);
    
    // Console logging with appropriate level
    const logMethod = level === 'CRITICAL' || level === 'ERROR' ? console.error :
                     level === 'WARN' ? console.warn : console.log;
    
    logMethod(`[${level}] ${message}`, context || '');
    
    // In a production environment, you would send critical errors to external monitoring
    if (level === 'CRITICAL') {
      this.sendToMonitoring(logEntry);
    }
  }

  private async sendToMonitoring(logEntry: any): Promise<void> {
    // In production, integrate with services like Sentry, DataDog, etc.
    console.error('🚨 CRITICAL ERROR - Would send to monitoring service:', logEntry);
  }

  getLogs(): any[] {
    return [...this.logs];
  }

  getLogsForRun(runId: string): any[] {
    return this.logs.filter(log => log.runId === runId);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

// Global instances
export const globalErrorLogger = new ErrorLogger();

// Default configurations
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000 // 1 minute
};
