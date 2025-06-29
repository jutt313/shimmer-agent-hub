
import { supabase } from '@/integrations/supabase/client';
import { globalErrorLogger } from '@/utils/errorLogger';
import { ProductionErrorHandler } from './productionErrorHandler';

export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  automation_id?: string;
  user_id?: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  status_code?: number;
  response_body?: string;
  error?: string;
  delivery_time_ms: number;
}

export class WebhookDeliverySystem {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s
  private static readonly TIMEOUT = 30000; // 30 seconds

  /**
   * Deliver webhook with retry logic and monitoring
   */
  static async deliverWebhook(
    webhookUrl: string,
    payload: WebhookPayload,
    options: {
      secret?: string;
      automationId?: string;
      userId?: string;
      maxRetries?: number;
    } = {}
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    const maxRetries = options.maxRetries || this.MAX_RETRIES;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.attemptDelivery(webhookUrl, payload, options.secret);
        
        // Log successful delivery
        await this.logDelivery(
          webhookUrl,
          payload,
          result,
          attempt + 1,
          options.automationId,
          options.userId
        );

        if (result.success) {
          globalErrorLogger.log('INFO', 'Webhook delivered successfully', {
            url: webhookUrl,
            attempts: attempt + 1,
            deliveryTime: result.delivery_time_ms,
            automationId: options.automationId
          });
          return result;
        }

        // If not successful and we have more retries, wait and continue
        if (attempt < maxRetries) {
          await this.delay(this.RETRY_DELAYS[attempt] || 30000);
          continue;
        }

        // All retries exhausted
        await ProductionErrorHandler.handleError(
          `Webhook delivery failed after ${maxRetries + 1} attempts: ${result.error}`,
          {
            type: 'webhook',
            userId: options.userId,
            automationId: options.automationId,
            additionalContext: {
              webhook_url: webhookUrl,
              final_status_code: result.status_code,
              total_attempts: attempt + 1
            }
          }
        );

        return result;

      } catch (error: any) {
        const deliveryTime = Date.now() - startTime;
        const result: WebhookDeliveryResult = {
          success: false,
          error: error.message,
          delivery_time_ms: deliveryTime
        };

        // Log failed attempt
        await this.logDelivery(
          webhookUrl,
          payload,
          result,
          attempt + 1,
          options.automationId,
          options.userId
        );

        if (attempt === maxRetries) {
          await ProductionErrorHandler.handleError(error, {
            type: 'webhook',
            userId: options.userId,
            automationId: options.automationId,
            additionalContext: {
              webhook_url: webhookUrl,
              total_attempts: attempt + 1
            }
          });
          return result;
        }

        // Wait before retry
        if (attempt < maxRetries) {
          await this.delay(this.RETRY_DELAYS[attempt] || 30000);
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: 'Unexpected delivery failure',
      delivery_time_ms: Date.now() - startTime
    };
  }

  /**
   * Attempt single webhook delivery
   */
  private static async attemptDelivery(
    url: string,
    payload: WebhookPayload,
    secret?: string
  ): Promise<WebhookDeliveryResult> {
    const startTime = Date.now();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'YusrAI-Webhook/1.0',
        'X-Webhook-Timestamp': payload.timestamp,
        'X-Webhook-Event': payload.event
      };

      // Add signature if secret provided
      if (secret) {
        const signature = await this.generateSignature(JSON.stringify(payload), secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseBody = await response.text();
      const deliveryTime = Date.now() - startTime;

      return {
        success: response.ok,
        status_code: response.status,
        response_body: responseBody,
        delivery_time_ms: deliveryTime,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

    } catch (error: any) {
      const deliveryTime = Date.now() - startTime;
      return {
        success: false,
        error: error.name === 'AbortError' ? 'Request timeout' : error.message,
        delivery_time_ms: deliveryTime
      };
    }
  }

  /**
   * Generate HMAC signature for webhook security
   */
  private static async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hashArray = Array.from(new Uint8Array(signature));
    return 'sha256=' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Log webhook delivery attempt
   */
  private static async logDelivery(
    url: string,
    payload: WebhookPayload,
    result: WebhookDeliveryResult,
    attempt: number,
    automationId?: string,
    userId?: string
  ): Promise<void> {
    try {
      await supabase
        .from('webhook_delivery_logs')
        .insert({
          webhook_url: url,
          payload: payload,
          status_code: result.status_code,
          response_body: result.response_body,
          delivery_attempts: attempt,
          delivered_at: result.success ? new Date().toISOString() : null,
          error_message: result.error,
          delivery_time_ms: result.delivery_time_ms,
          automation_id: automationId,
          user_id: userId
        });
    } catch (error) {
      console.error('Failed to log webhook delivery:', error);
    }
  }

  /**
   * Delay helper for retries
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get webhook delivery analytics
   */
  static async getDeliveryAnalytics(
    automationId?: string,
    timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTime: number;
    deliveryRate: number;
    recentDeliveries: any[];
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
        .from('webhook_delivery_logs')
        .select('*')
        .gte('created_at', since.toISOString());

      if (automationId) {
        query = query.eq('automation_id', automationId);
      }

      const { data: deliveries, error } = await query;

      if (error) throw error;

      const totalDeliveries = deliveries?.length || 0;
      const successfulDeliveries = deliveries?.filter(d => d.delivered_at !== null).length || 0;
      const failedDeliveries = totalDeliveries - successfulDeliveries;
      
      const deliveryTimes = deliveries?.filter(d => d.delivery_time_ms).map(d => d.delivery_time_ms) || [];
      const averageDeliveryTime = deliveryTimes.length > 0 
        ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
        : 0;

      const deliveryRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;
      const recentDeliveries = deliveries?.slice(0, 20) || [];

      return {
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        averageDeliveryTime,
        deliveryRate,
        recentDeliveries
      };
    } catch (error) {
      console.error('Failed to get webhook analytics:', error);
      return {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        averageDeliveryTime: 0,
        deliveryRate: 0,
        recentDeliveries: []
      };
    }
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhook(
    url: string,
    secret?: string
  ): Promise<{ success: boolean; error?: string; responseTime: number }> {
    const testPayload: WebhookPayload = {
      event: 'test',
      data: {
        message: 'This is a test webhook from YusrAI',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

    const result = await this.attemptDelivery(url, testPayload, secret);
    
    return {
      success: result.success,
      error: result.error,
      responseTime: result.delivery_time_ms
    };
  }
}
