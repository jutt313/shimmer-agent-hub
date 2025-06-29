
import { YusrAIRealTime } from './realTimeWebSocket';

export interface YusrAIConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface Automation {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  webhooks?: Webhook[];
  last_run?: AutomationRun;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  status: string;
  run_timestamp: string;
  duration_ms?: number;
  trigger_data?: any;
  details_log?: any;
}

export interface Webhook {
  id: string;
  automation_id: string;
  webhook_url: string;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at?: string;
  delivery_stats?: {
    total_attempts: number;
    successful_deliveries: number;
    failed_deliveries: number;
    success_rate: number;
    last_delivery?: string;
  };
}

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  usage_stats: {
    api_calls_24h: number;
    automations_total: number;
    runs_24h: number;
    last_activity?: string;
  };
}

export class YusrAI {
  private config: YusrAIConfig;
  private realTime?: YusrAIRealTime;

  constructor(config: YusrAIConfig) {
    this.config = {
      baseUrl: 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1',
      timeout: 30000,
      ...config
    };
  }

  // Initialize real-time connection
  async connectRealTime(events: string[] = ['automation_runs', 'webhook_deliveries', 'api_usage']): Promise<YusrAIRealTime> {
    this.realTime = new YusrAIRealTime(this.config.apiKey, this.config.baseUrl);
    await this.realTime.connect();
    this.realTime.subscribe(events);
    return this.realTime;
  }

  // Automations API
  async getAutomations(): Promise<Automation[]> {
    const response = await this.request('/api-v1/automations');
    return response.data;
  }

  async getAutomation(id: string): Promise<Automation> {
    const response = await this.request(`/api-v1/automations/${id}`);
    return response.data;
  }

  async createAutomation(automation: Partial<Automation> & { create_webhook?: boolean }): Promise<Automation> {
    const response = await this.request('/api-v1/automations', {
      method: 'POST',
      body: JSON.stringify(automation)
    });
    return response.data;
  }

  async updateAutomation(id: string, updates: Partial<Automation>): Promise<Automation> {
    const response = await this.request(`/api-v1/automations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.data;
  }

  async deleteAutomation(id: string): Promise<void> {
    await this.request(`/api-v1/automations/${id}`, {
      method: 'DELETE'
    });
  }

  // Automation Runs API
  async getRuns(): Promise<AutomationRun[]> {
    const response = await this.request('/api-v1/runs');
    return response.data;
  }

  async getRun(id: string): Promise<AutomationRun> {
    const response = await this.request(`/api-v1/runs/${id}`);
    return response.data;
  }

  async executeAutomation(automationId: string, triggerData?: any): Promise<AutomationRun> {
    const response = await this.request('/api-v1/runs', {
      method: 'POST',
      body: JSON.stringify({
        automation_id: automationId,
        trigger_data: triggerData
      })
    });
    return response.data;
  }

  // Webhooks API
  async getWebhooks(): Promise<Webhook[]> {
    const response = await this.request('/api-v1/webhooks');
    return response.data;
  }

  async createWebhook(automationId: string): Promise<Webhook> {
    const response = await this.request('/api-v1/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        automation_id: automationId
      })
    });
    return response.data;
  }

  // User API
  async getUserProfile(): Promise<UserProfile> {
    const response = await this.request('/api-v1/user/profile');
    return response.data;
  }

  // Platforms API
  async getPlatforms(): Promise<any[]> {
    const response = await this.request('/api-v1/platforms');
    return response.data;
  }

  // Real-time event handlers
  onAutomationUpdate(callback: (run: AutomationRun) => void): void {
    if (!this.realTime) {
      throw new Error('Real-time connection not established. Call connectRealTime() first.');
    }
    this.realTime.on('automation_run_update', callback);
  }

  onWebhookDelivery(callback: (delivery: any) => void): void {
    if (!this.realTime) {
      throw new Error('Real-time connection not established. Call connectRealTime() first.');
    }
    this.realTime.on('webhook_delivery_update', callback);
  }

  onApiUsage(callback: (usage: any) => void): void {
    if (!this.realTime) {
      throw new Error('Real-time connection not established. Call connectRealTime() first.');
    }
    this.realTime.on('api_usage_update', callback);
  }

  // Private helper methods
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: AbortSignal.timeout(this.config.timeout!)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  disconnect(): void {
    if (this.realTime) {
      this.realTime.disconnect();
    }
  }
}

// Export for easy usage
export default YusrAI;
