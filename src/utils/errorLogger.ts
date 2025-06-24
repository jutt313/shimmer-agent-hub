export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  context?: any;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
}

class ErrorLogger {
  private logs: LogEntry[] = [];
  private sessionId: string;
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private isProduction = import.meta.env.PROD;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
    this.setupAppErrorListener();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('CRITICAL', 'Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });

    // Capture global JavaScript errors
    window.addEventListener('error', (event) => {
      this.log('ERROR', 'Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });
  }

  private setupAppErrorListener(): void {
    window.addEventListener('app-error', (event: CustomEvent) => {
      const errorInfo = event.detail;
      this.log(
        errorInfo.severity === 'critical' ? 'CRITICAL' : 
        errorInfo.severity === 'high' ? 'ERROR' :
        errorInfo.severity === 'medium' ? 'WARN' : 'INFO',
        errorInfo.message,
        {
          fileName: errorInfo.fileName,
          userAction: errorInfo.userAction,
          additionalContext: errorInfo.additionalContext,
          stackTrace: errorInfo.stack
        }
      );
    });
  }

  log(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL',
    message: string,
    context?: any,
    userId?: string
  ): void {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: context?.stackTrace || new Error().stack
    };

    this.logs.push(logEntry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging in development
    if (!this.isProduction) {
      const consoleMethod = level === 'CRITICAL' || level === 'ERROR' ? 'error' :
                           level === 'WARN' ? 'warn' : 'log';
      console[consoleMethod](`[${level}] ${message}`, context || '');
    }

    // Send critical errors to monitoring service in production
    if (this.isProduction && level === 'CRITICAL') {
      this.sendToMonitoringService(logEntry);
    }
  }

  private async sendToMonitoringService(logEntry: LogEntry): Promise<void> {
    try {
      // In production, integrate with monitoring service like Sentry
      console.error('🚨 CRITICAL ERROR - Would send to monitoring service:', logEntry);
      
      // Example implementation for future integration:
      // await fetch('/api/monitoring/error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  getLogs(level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  getLogsForSession(sessionId: string): LogEntry[] {
    return this.logs.filter(log => log.sessionId === sessionId);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global singleton instance
export const globalErrorLogger = new ErrorLogger();
