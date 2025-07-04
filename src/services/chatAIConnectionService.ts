
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
        automationId: request.automationId,
        hasMessages: !!request.messages,
        messagesCount: request.messages?.length || 0
      });

      // Ensure we have the required payload structure
      const payload = {
        message: request.message,
        messages: request.messages || [],
        automationId: request.automationId,
        automationContext: request.automationContext,
        context: request.context || 'general',
        userId: request.userId
      };

      console.log('📋 Calling chat-ai with payload:', {
        hasMessage: !!payload.message,
        messageLength: payload.message?.length || 0,
        messagesCount: payload.messages?.length || 0,
        hasAutomationContext: !!payload.automationContext,
        context: payload.context,
        userId: payload.userId
      });

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: payload
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      console.log('✅ Chat AI response received:', {
        hasData: !!data,
        dataType: typeof data,
        hasSummary: !!data?.summary,
        stepsCount: data?.steps?.length || 0,
        platformsCount: data?.platforms?.length || 0
      });

      // Process the response - handle both structured and simple responses
      let responseText = "I'm here to help you build comprehensive automations.";
      
      if (data && typeof data === 'object') {
        // Handle clarification-only responses
        if (data.clarification_questions && Array.isArray(data.clarification_questions) && data.clarification_questions.length > 0) {
          responseText = "I need some clarification:\n\n" + 
            data.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
        }
        // Handle full responses with summary
        else if (data.summary && typeof data.summary === 'string') {
          responseText = data.summary;
        }
        // Handle direct string responses
        else if (typeof data === 'string') {
          responseText = data;
        }
      } else if (typeof data === 'string') {
        responseText = data;
      }

      return {
        response: responseText,
        requiresAuth: false,
        structuredData: data
      };

    } catch (error) {
      console.error('❌ ChatAIConnectionService: Error processing request:', error);
      return {
        response: "I apologize, but I encountered an error while processing your request. Please try again.",
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
