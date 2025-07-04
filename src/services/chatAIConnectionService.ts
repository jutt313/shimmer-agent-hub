
import { supabase } from '@/integrations/supabase/client';

export interface ChatAIConnectionRequest {
  userId: string;
  message: string;
  requestedPlatforms?: string[];
  context?: string;
  messages?: any[];
  automationId?: string;
  automationContext?: any;
}

export interface ChatAIConnectionResponse {
  response: string;
  requiresAuth?: boolean;
  authMessage?: string;
  structuredData?: any;
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
      console.log('🚀 ChatAIConnectionService: Processing request', {
        hasMessage: !!request.message,
        messageLength: request.message?.length || 0,
        userId: request.userId,
        automationId: request.automationId
      });

      // Direct call to chat AI with enhanced processing
      return await this.callChatAI(request);
      
    } catch (error) {
      console.error('❌ ChatAIConnectionService: Error processing request:', error);
      return {
        response: "I apologize, but I encountered an error while processing your request. Please try again, and I'll make sure to collect all necessary platform credentials for your automation.",
        requiresAuth: false
      };
    }
  }

  private async callChatAI(request: ChatAIConnectionRequest): Promise<ChatAIConnectionResponse> {
    try {
      console.log('📡 ChatAIConnectionService: Calling enhanced chat-ai edge function...');

      const requestBody = {
        message: request.message,
        messages: request.messages || [],
        automationId: request.automationId,
        automationContext: request.automationContext,
        context: request.context || 'general',
        userId: request.userId
      };

      console.log('📋 Enhanced request body:', {
        hasMessage: !!requestBody.message,
        messageLength: requestBody.message?.length || 0,
        messagesCount: requestBody.messages?.length || 0,
        hasAutomationContext: !!requestBody.automationContext
      });

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: requestBody
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      console.log('✅ Enhanced Chat AI response received:', {
        hasSummary: !!data?.summary,
        stepsCount: data?.steps?.length || 0,
        platformsCount: data?.platforms?.length || 0,
        hasUniversalKnowledge: !!data?.conversation_updates?.universal_knowledge_applied,
        credentialFieldsCount: data?.platforms?.reduce((acc: number, p: any) => acc + (p.credentials?.length || 0), 0) || 0
      });

      // Enhanced response processing
      let responseText = data?.summary || "I'm here to help you build comprehensive automations with complete platform credentials.";
      
      // Ensure we have structured data
      if (data && typeof data === 'object') {
        // Add enhanced summary if available
        if (data.summary && typeof data.summary === 'string') {
          responseText = data.summary;
        }
        
        // If we have platforms, mention credential requirements
        if (data.platforms && Array.isArray(data.platforms) && data.platforms.length > 0) {
          const credentialCount = data.platforms.reduce((acc: number, p: any) => acc + (p.credentials?.length || 0), 0);
          if (credentialCount > 0) {
            responseText += ` I've identified ${data.platforms.length} platform(s) requiring ${credentialCount} credential(s) for complete setup.`;
          }
        }
      }

      return {
        response: responseText,
        requiresAuth: false,
        structuredData: data
      };
    } catch (error) {
      console.error('❌ ChatAIConnectionService: Error calling enhanced chat AI:', error);
      return {
        response: "I'm currently unable to process your request. Please try again, and I'll ensure to collect all necessary platform credentials for your automation.",
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
          message: `Redirecting you to connect with ${platform} - I'll collect all necessary credentials for complete integration...`,
          authUrl
        };
      } else {
        // Disconnect
        const { error } = await supabase
          .from('platform_credentials')
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
      console.error(`❌ Error ${action}ing ${platform}:`, error);
      return {
        success: false,
        message: `Failed to ${action} ${platform}. Please try again.`
      };
    }
  }
}

export const chatAIConnectionService = ChatAIConnectionService.getInstance();
