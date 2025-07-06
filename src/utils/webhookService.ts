
import { supabase } from '@/integrations/supabase/client';
import { AutomationBlueprint } from '@/types/automation';

// Webhook service for handling incoming webhook triggers
export interface WebhookConfig {
  automationId: string;
  webhookUrl: string;
  secret?: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export class WebhookManager {
  private webhooks = new Map<string, WebhookConfig>();
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1';
    console.log('🔗 WebhookManager initialized');
  }

  generateWebhookUrl(automationId: string): string {
    const webhookId = crypto.randomUUID();
    // FIXED: Use consistent Supabase URL format 
    return `https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/webhook-trigger/${webhookId}?automation_id=${automationId}`;
  }

  registerWebhook(automationId: string, secret?: string): WebhookConfig {
    const webhookUrl = this.generateWebhookUrl(automationId);
    
    const config: WebhookConfig = {
      automationId,
      webhookUrl,
      secret,
      isActive: true,
      createdAt: new Date()
    };

    this.webhooks.set(automationId, config);
    console.log(`🔗 Registered webhook for automation ${automationId}: ${webhookUrl}`);
    
    return config;
  }

  async validateWebhookPayload(payload: any, signature?: string, secret?: string): Promise<boolean> {
    if (!secret || !signature) {
      return true; // No signature validation required
    }

    try {
      // Implement HMAC-SHA256 signature validation
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const expectedSignature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(JSON.stringify(payload))
      );

      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return signature === `sha256=${expectedHex}`;
    } catch (error) {
      console.error('Webhook signature validation failed:', error);
      return false;
    }
  }

  getWebhookConfig(automationId: string): WebhookConfig | null {
    return this.webhooks.get(automationId) || null;
  }

  removeWebhook(automationId: string): boolean {
    const removed = this.webhooks.delete(automationId);
    if (removed) {
      console.log(`🗑️ Removed webhook for automation ${automationId}`);
    }
    return removed;
  }

  async loadWebhooksFromDatabase(): Promise<void> {
    try {
      const { data: automations, error } = await supabase
        .from('automations')
        .select('id, automation_blueprint')
        .eq('status', 'active');

      if (error) {
        console.error('Failed to load webhooks from database:', error);
        return;
      }

      automations?.forEach(automation => {
        try {
          const blueprint = automation.automation_blueprint as AutomationBlueprint;
          
          if (blueprint?.trigger?.type === 'webhook') {
            const config: WebhookConfig = {
              automationId: automation.id,
              webhookUrl: blueprint.trigger.webhook_endpoint || this.generateWebhookUrl(automation.id),
              secret: blueprint.trigger.webhook_secret,
              isActive: true,
              createdAt: new Date()
            };
            
            this.webhooks.set(automation.id, config);
          }
        } catch (parseError) {
          console.error(`Failed to parse webhook blueprint for automation ${automation.id}:`, parseError);
        }
      });

      console.log(`🔗 Loaded ${this.webhooks.size} webhook configurations`);
    } catch (error) {
      console.error('Error loading webhooks from database:', error);
    }
  }
}

// Global webhook manager instance
export const globalWebhookManager = new WebhookManager();

// Auto-load webhooks when the module is imported
if (typeof window !== 'undefined') {
  globalWebhookManager.loadWebhooksFromDatabase();
}
