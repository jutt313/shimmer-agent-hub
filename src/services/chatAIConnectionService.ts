
import { supabase } from '@/integrations/supabase/client';
import { platformConnectionService, ConnectionButton } from './platformConnectionService';

export interface ChatAIConnectionRequest {
  userId: string;
  message: string;
  requestedPlatforms?: string[];
  context?: string;
}

export interface ChatAIConnectionResponse {
  response: string;
  connectionButtons?: ConnectionButton[];
  requiresAuth?: boolean;
  authMessage?: string;
}

export class ChatAIConnectionService {
  private static instance: ChatAIConnectionService;
  
  public static getInstance(): ChatAIConnectionService {
    if (!ChatAIConnectionService.instance) {
      ChatAIConnectionService.instance = new ChatAIConnectionService();
    }
    return ChatAIConnectionService.instance;
  }

  async processConnectionRequest(request: ChatAIConnectionRequest): Promise<ChatAIConnectionResponse> {
    try {
      // Check if the message contains platform connection requests
      const platformKeywords = this.extractPlatformKeywords(request.message);
      
      if (platformKeywords.length > 0 || request.requestedPlatforms?.length) {
        const platforms = request.requestedPlatforms || platformKeywords;
        const connectionData = await platformConnectionService.requestConnectionButtons(
          request.userId, 
          platforms, 
          request.context
        );

        return {
          response: connectionData.message,
          connectionButtons: connectionData.buttons,
          requiresAuth: connectionData.buttons.some(b => !b.connected),
          authMessage: "You'll need to connect to these platforms to use them in your automations."
        };
      }

      // If no platform connections requested, call the regular chat AI
      return await this.callChatAI(request);
      
    } catch (error) {
      console.error('Error processing connection request:', error);
      return {
        response: "I apologize, but I encountered an error while processing your request. Please try again.",
        requiresAuth: false
      };
    }
  }

  private extractPlatformKeywords(message: string): string[] {
    const platformMap: { [key: string]: string[] } = {
      gmail: ['gmail', 'email', 'google mail'],
      slack: ['slack', 'team chat'],
      discord: ['discord'],
      twitter: ['twitter', 'tweet', 'x.com'],
      facebook: ['facebook', 'fb'],
      instagram: ['instagram', 'insta'],
      linkedin: ['linkedin'],
      github: ['github', 'git'],
      notion: ['notion'],
      trello: ['trello', 'boards'],
      asana: ['asana', 'project management'],
      monday: ['monday', 'monday.com'],
      hubspot: ['hubspot', 'crm'],
      salesforce: ['salesforce'],
      pipedrive: ['pipedrive'],
      mailchimp: ['mailchimp'],
      sendgrid: ['sendgrid'],
      stripe: ['stripe', 'payments'],
      paypal: ['paypal'],
      shopify: ['shopify', 'ecommerce'],
      woocommerce: ['woocommerce'],
      zapier: ['zapier', 'automation'],
      make: ['make', 'integromat']
    };

    const lowerMessage = message.toLowerCase();
    const foundPlatforms: string[] = [];

    Object.entries(platformMap).forEach(([platform, keywords]) => {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        foundPlatforms.push(platform);
      }
    });

    return foundPlatforms;
  }

  private async callChatAI(request: ChatAIConnectionRequest): Promise<ChatAIConnectionResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: request.message,
          context: request.context || 'general',
          userId: request.userId
        }
      });

      if (error) throw error;

      return {
        response: data.response || "I'm here to help you with your automations and platform connections.",
        requiresAuth: false
      };
    } catch (error) {
      console.error('Error calling chat AI:', error);
      return {
        response: "I'm currently unable to process your request. Please try again later.",
        requiresAuth: false
      };
    }
  }

  async handlePlatformConnection(userId: string, platform: string, action: 'connect' | 'disconnect'): Promise<{
    success: boolean;
    message: string;
    authUrl?: string;
  }> {
    try {
      if (action === 'connect') {
        const authUrl = `https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/platform-auth?platform=${platform}&user_id=${userId}&redirect=${encodeURIComponent(window.location.origin)}`;
        
        return {
          success: true,
          message: `Redirecting you to connect with ${platform}...`,
          authUrl
        };
      } else {
        // Disconnect
        const { error } = await supabase
          .from('user_platform_credentials')
          .delete()
          .eq('user_id', userId)
          .eq('platform_name', platform);

        if (error) throw error;

        return {
          success: true,
          message: `Successfully disconnected from ${platform}.`
        };
      }
    } catch (error) {
      console.error(`Error ${action}ing ${platform}:`, error);
      return {
        success: false,
        message: `Failed to ${action} ${platform}. Please try again.`
      };
    }
  }
}

export const chatAIConnectionService = ChatAIConnectionService.getInstance();
