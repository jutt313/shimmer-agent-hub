
// Environment configuration and validation - UPDATED FOR YUSRAI.COM
export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  webhookBaseUrl: string; // CRITICAL: New webhook base URL
  isDevelopment: boolean;
  isProduction: boolean;
}

export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvironmentConfig;

  private constructor() {
    this.config = this.validateAndLoadConfig();
  }

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private validateAndLoadConfig(): EnvironmentConfig {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zorwtyijosgdcckljmqd.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvcnd0eWlqb3NnZGNja2xqbXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTA4NDksImV4cCI6MjA2NTY4Njg0OX0.R-HltFpAhGNf_U2WEAYurf9LQ1xLgdQyP7C4ez6zRP4';
    const mode = import.meta.env.MODE;

    // CRITICAL FIX: Use yusrai.com for webhook URLs as requested
    const webhookBaseUrl = mode === 'production' 
      ? 'https://yusrai.com/api/webhooks'
      : 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/webhook-trigger';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
    }

    console.log(`🌐 WEBHOOK BASE URL configured: ${webhookBaseUrl}`);

    return {
      supabaseUrl,
      supabaseAnonKey,
      webhookBaseUrl, // CRITICAL: Include webhook base URL
      isDevelopment: mode === 'development',
      isProduction: mode === 'production'
    };
  }

  getConfig(): EnvironmentConfig {
    return this.config;
  }

  getWebhookBaseUrl(): string {
    return this.config.webhookBaseUrl;
  }

  validateSupabaseConfig(): boolean {
    const { supabaseUrl, supabaseAnonKey } = this.config;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing required Supabase configuration');
      return false;
    }

    if (!supabaseUrl.startsWith('https://')) {
      console.error('Supabase URL must use HTTPS');
      return false;
    }

    if (supabaseAnonKey.length < 100) {
      console.error('Supabase anon key appears to be invalid');
      return false;
    }

    return true;
  }

  // CRITICAL: Method to generate proper webhook URLs
  generateWebhookUrl(automationId: string): string {
    const webhookId = crypto.randomUUID();
    const baseUrl = this.getWebhookBaseUrl();
    
    // Use yusrai.com structure or fallback to Supabase functions
    if (baseUrl.includes('yusrai.com')) {
      return `${baseUrl}/${webhookId}?automation_id=${automationId}`;
    } else {
      return `${baseUrl}/${webhookId}?automation_id=${automationId}`;
    }
  }
}

// Export singleton instance
export const environmentConfig = EnvironmentValidator.getInstance();

// CRITICAL: Export webhook URL generator
export const generateYusrAIWebhookUrl = (automationId: string): string => {
  return environmentConfig.generateWebhookUrl(automationId);
};

console.log('🔧 ENVIRONMENT CONFIG LOADED - Webhook URLs will use:', environmentConfig.getWebhookBaseUrl());
