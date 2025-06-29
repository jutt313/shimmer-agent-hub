
import { supabase } from '@/integrations/supabase/client';
import { globalErrorLogger } from '@/utils/errorLogger';
import { useToast } from '@/hooks/use-toast';

export interface ProductionError {
  id: string;
  error_type: 'oauth' | 'webhook' | 'api' | 'system' | 'validation';
  error_code: string;
  error_message: string;
  stack_trace?: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  automation_id?: string;
  resolved: boolean;
  created_at: string;
}

export class ProductionErrorHandler {
  /**
   * Handle and classify production errors
   */
  static async handleError(
    error: Error | string,
    context: {
      type: 'oauth' | 'webhook' | 'api' | 'system' | 'validation';
      userId?: string;
      automationId?: string;
      additionalContext?: Record<string, any>;
    }
  ): Promise<{ errorId: string; shouldNotifyUser: boolean }> {
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const stackTrace = typeof error === 'object' ? error.stack : undefined;
      
      // Classify error severity
      const severity = this.classifyErrorSeverity(errorMessage, context.type);
      const errorCode = this.generateErrorCode(context.type, errorMessage);

      // Store error in database
      const { data: storedError, error: storeError } = await supabase
        .from('error_logs')
        .insert({
          error_type: context.type,
          error_code: errorCode,
          error_message: errorMessage,
          stack_trace: stackTrace,
          context: {
            ...context.additionalContext,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
          },
          severity,
          user_id: context.userId,
          automation_id: context.automationId,
          resolved: false
        })
        .select('id')
        .single();

      const errorId = storedError?.id || 'unknown';

      // Log to global error logger
      globalErrorLogger.log(
        severity === 'critical' ? 'CRITICAL' : 'ERROR',
        `Production error: ${errorMessage}`,
        {
          errorId,
          errorCode,
          type: context.type,
          userId: context.userId,
          automationId: context.automationId
        }
      );

      // Create notification for user if appropriate
      const shouldNotifyUser = severity !== 'low' && context.userId;
      if (shouldNotifyUser && context.userId) {
        await this.createUserNotification(context.userId, {
          errorId,
          errorCode,
          errorMessage,
          severity,
          type: context.type
        });
      }

      // Send to monitoring if critical
      if (severity === 'critical') {
        await this.sendToMonitoring(errorId, errorMessage, context);
      }

      return { errorId, shouldNotifyUser: !!shouldNotifyUser };
    } catch (handlerError: any) {
      console.error('Production error handler failed:', handlerError);
      return { errorId: 'handler-failed', shouldNotifyUser: false };
    }
  }

  /**
   * Classify error severity based on type and message
   */
  private static classifyErrorSeverity(
    message: string,
    type: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const lowerMessage = message.toLowerCase();

    // Critical errors
    if (
      lowerMessage.includes('database') ||
      lowerMessage.includes('connection refused') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('out of memory') ||
      type === 'system'
    ) {
      return 'critical';
    }

    // High priority errors
    if (
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('oauth') ||
      lowerMessage.includes('token') ||
      type === 'oauth'
    ) {
      return 'high';
    }

    // Medium priority errors
    if (
      lowerMessage.includes('webhook') ||
      lowerMessage.includes('api') ||
      lowerMessage.includes('validation') ||
      type === 'webhook' || type === 'api'
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate unique error code
   */
  private static generateErrorCode(type: string, message: string): string {
    const prefix = type.toUpperCase().substring(0, 3);
    const hash = message.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${prefix}-${Math.abs(hash).toString(16).substring(0, 6).toUpperCase()}`;
  }

  /**
   * Create user notification for error
   */
  private static async createUserNotification(
    userId: string,
    errorDetails: {
      errorId: string;
      errorCode: string;
      errorMessage: string;
      severity: string;
      type: string;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'system_error',
          category: 'error',
          title: `${errorDetails.type.toUpperCase()} Error Detected`,
          message: `Error ${errorDetails.errorCode}: ${errorDetails.errorMessage.substring(0, 200)}`,
          metadata: {
            error_id: errorDetails.errorId,
            error_code: errorDetails.errorCode,
            severity: errorDetails.severity,
            error_type: errorDetails.type,
            help_available: true
          },
          is_read: false
        });
    } catch (error) {
      console.error('Failed to create error notification:', error);
    }
  }

  /**
   * Send critical errors to monitoring system
   */
  private static async sendToMonitoring(
    errorId: string,
    message: string,
    context: any
  ): Promise<void> {
    try {
      // This would integrate with external monitoring services
      // For now, we'll log it as a critical event
      await supabase
        .from('monitoring_events')
        .insert({
          event_type: 'critical_error',
          event_data: {
            error_id: errorId,
            message: message,
            context: context,
            timestamp: new Date().toISOString()
          },
          severity: 'critical'
        });
    } catch (error) {
      console.error('Failed to send to monitoring:', error);
    }
  }

  /**
   * Get error analytics for dashboard
   */
  static async getErrorAnalytics(
    userId?: string,
    timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: any[];
  }> {
    try {
      const timeframeMins = {
        '1h': 60,
        '24h': 1440,
        '7d': 10080,
        '30d': 43200
      };

      const since = new Date(Date.now() - timeframeMins[timeframe] * 60 * 1000);

      let query = supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', since.toISOString());

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: errors, error } = await query;

      if (error) throw error;

      const totalErrors = errors?.length || 0;
      const errorsByType = errors?.reduce((acc, err) => {
        acc[err.error_type] = (acc[err.error_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const errorsBySeverity = errors?.reduce((acc, err) => {
        acc[err.severity] = (acc[err.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const recentErrors = errors?.slice(0, 10) || [];

      return {
        totalErrors,
        errorsByType,
        errorsBySeverity,
        recentErrors
      };
    } catch (error) {
      console.error('Failed to get error analytics:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        recentErrors: []
      };
    }
  }
}

// Hook for using production error handler in components
export const useProductionErrorHandler = () => {
  const { toast } = useToast();

  const handleError = async (
    error: Error | string,
    context: {
      type: 'oauth' | 'webhook' | 'api' | 'system' | 'validation';
      userId?: string;
      automationId?: string;
      additionalContext?: Record<string, any>;
      showToast?: boolean;
    }
  ) => {
    const result = await ProductionErrorHandler.handleError(error, context);
    
    if (context.showToast !== false && result.shouldNotifyUser) {
      toast({
        title: "System Error Detected",
        description: "We've logged this error and our team has been notified. Check your notifications for details.",
        variant: "destructive",
      });
    }

    return result;
  };

  return { handleError };
};
