
import { supabase } from '@/integrations/supabase/client';

export interface PlatformConnection {
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  credentials?: any;
  lastSync?: string;
}

export interface ConnectionButton {
  platform: string;
  label: string;
  icon: string;
  connected: boolean;
  authUrl?: string;
  disconnectAction?: () => void;
}

export class PlatformConnectionService {
  private static instance: PlatformConnectionService;
  
  public static getInstance(): PlatformConnectionService {
    if (!PlatformConnectionService.instance) {
      PlatformConnectionService.instance = new PlatformConnectionService();
    }
    return PlatformConnectionService.instance;
  }

  async getConnectionStatus(userId: string): Promise<PlatformConnection[]> {
    try {
      const { data, error } = await supabase
        .from('platform_credentials')
        .select('platform_name, credentials, updated_at')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map(item => ({
        platform: item.platform_name,
        status: 'connected' as const,
        credentials: item.credentials,
        lastSync: item.updated_at
      }));
    } catch (error) {
      console.error('Error fetching platform connections:', error);
      return [];
    }
  }

  async generateConnectionButtons(userId: string, requestedPlatforms: string[] = []): Promise<ConnectionButton[]> {
    const connections = await this.getConnectionStatus(userId);
    const connectedPlatforms = new Set(connections.map(c => c.platform));
    
    const supportedPlatforms = [
      'gmail', 'slack', 'discord', 'twitter', 'facebook', 'instagram', 
      'linkedin', 'github', 'notion', 'trello', 'asana', 'monday',
      'hubspot', 'salesforce', 'pipedrive', 'mailchimp', 'sendgrid',
      'stripe', 'paypal', 'shopify', 'woocommerce', 'zapier', 'make'
    ];

    const platformsToShow = requestedPlatforms.length > 0 
      ? requestedPlatforms.filter(p => supportedPlatforms.includes(p))
      : supportedPlatforms;

    return platformsToShow.map(platform => ({
      platform,
      label: this.getPlatformLabel(platform),
      icon: this.getPlatformIcon(platform),
      connected: connectedPlatforms.has(platform),
      authUrl: this.getAuthUrl(platform),
      disconnectAction: connectedPlatforms.has(platform) 
        ? () => this.disconnectPlatform(userId, platform)
        : undefined
    }));
  }

  private getPlatformLabel(platform: string): string {
    const labels: { [key: string]: string } = {
      gmail: 'Gmail',
      slack: 'Slack',
      discord: 'Discord',
      twitter: 'Twitter',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      notion: 'Notion',
      trello: 'Trello',
      asana: 'Asana',
      monday: 'Monday.com',
      hubspot: 'HubSpot',
      salesforce: 'Salesforce',
      pipedrive: 'Pipedrive',
      mailchimp: 'Mailchimp',
      sendgrid: 'SendGrid',
      stripe: 'Stripe',
      paypal: 'PayPal',
      shopify: 'Shopify',
      woocommerce: 'WooCommerce',
      zapier: 'Zapier',
      make: 'Make'
    };
    return labels[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  private getPlatformIcon(platform: string): string {
    // Return icon names that correspond to available icons in your system
    const icons: { [key: string]: string } = {
      gmail: 'mail',
      slack: 'message-square',
      discord: 'message-circle',
      twitter: 'twitter',
      facebook: 'facebook',
      instagram: 'instagram',
      linkedin: 'linkedin',
      github: 'github',
      notion: 'file-text',
      trello: 'trello',
      asana: 'check-square',
      monday: 'calendar',
      hubspot: 'users',
      salesforce: 'briefcase',
      pipedrive: 'trending-up',
      mailchimp: 'mail',
      sendgrid: 'send',
      stripe: 'credit-card',
      paypal: 'dollar-sign',
      shopify: 'shopping-cart',
      woocommerce: 'shopping-bag',
      zapier: 'zap',
      make: 'settings'
    };
    return icons[platform] || 'link';
  }

  private getAuthUrl(platform: string): string {
    // Generate OAuth URLs for each platform
    const baseUrl = 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1';
    return `${baseUrl}/platform-auth?platform=${platform}&redirect=${encodeURIComponent(window.location.origin)}`;
  }

  private async disconnectPlatform(userId: string, platform: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('platform_credentials')
        .delete()
        .eq('user_id', userId)
        .eq('platform_name', platform);

      if (error) throw error;
      
      console.log(`Disconnected from ${platform}`);
    } catch (error) {
      console.error(`Error disconnecting from ${platform}:`, error);
      throw error;
    }
  }

  async requestConnectionButtons(userId: string, platforms: string[], context?: string): Promise<{
    buttons: ConnectionButton[];
    message: string;
  }> {
    const buttons = await this.generateConnectionButtons(userId, platforms);
    
    const connectedCount = buttons.filter(b => b.connected).length;
    const totalCount = buttons.length;
    
    let message = `Here are your platform connections (${connectedCount}/${totalCount} connected):`;
    
    if (context) {
      message = `Based on your request for "${context}", here are the relevant platform connections:`;
    }
    
    return { buttons, message };
  }
}

export const platformConnectionService = PlatformConnectionService.getInstance();
