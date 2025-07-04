
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
        platformsCount: data?.platforms?.length || 0,
        rawDataPreview: JSON.stringify(data).substring(0, 200)
      });

      // Enhanced response processing with comprehensive null prevention
      let responseText = "I'm here to help you build comprehensive automations with the right platforms.";
      let structuredData = null;
      
      if (data && typeof data === 'object') {
        // Store the entire structured data
        structuredData = data;
        
        // Handle clarification-only responses
        if (data.clarification_questions && Array.isArray(data.clarification_questions) && data.clarification_questions.length > 0) {
          responseText = "I need some clarification to provide the best solution:\n\n" + 
            data.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
        }
        // Handle full responses with summary - prioritize summary
        else if (data.summary && typeof data.summary === 'string' && data.summary.trim() !== '' && data.summary.trim() !== 'null') {
          responseText = data.summary;
        }
        // Handle case where data exists but no summary - create from steps
        else if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
          responseText = "I've created a comprehensive automation plan with " + data.steps.length + " detailed steps to achieve your goal.";
        }
        // Handle case where we have platforms but no summary
        else if (data.platforms && Array.isArray(data.platforms) && data.platforms.length > 0) {
          const platformNames = data.platforms.map(p => p.name).join(', ');
          responseText = `I've identified the platforms you'll need: ${platformNames}. Let me set up the complete automation workflow.`;
        }
        // Final fallback if data exists but is incomplete
        else {
          responseText = "I'm analyzing your automation requirements and will provide a complete solution with all necessary platforms and credentials.";
        }
      } else if (typeof data === 'string' && data.trim() !== '' && data.trim() !== 'null') {
        responseText = data;
      }

      // Final comprehensive validation - ensure response is never null/empty
      if (!responseText || 
          responseText.trim() === '' || 
          responseText.toLowerCase().includes('null') || 
          responseText === 'null' ||
          responseText === 'undefined') {
        console.warn('⚠️ Detected null/empty response, using comprehensive fallback');
        responseText = "I'm ready to help you create a comprehensive automation. Please let me know which specific platforms you'd like to integrate, and I'll provide complete setup instructions with all necessary credentials.";
      }

      console.log('📤 Final response processing:', {
        responseTextLength: responseText.length,
        responsePreview: responseText.substring(0, 100),
        hasStructuredData: !!structuredData,
        structuredDataKeys: structuredData ? Object.keys(structuredData) : []
      });

      return {
        response: responseText,
        requiresAuth: false,
        structuredData: structuredData
      };

    } catch (error) {
      console.error('❌ ChatAIConnectionService: Error processing request:', error);
      
      // Enhanced error response
      return {
        response: "I encountered a technical issue, but I'm ready to help you create your automation. Please rephrase your request with specific platform names (like Gmail, Slack, HubSpot, etc.) and I'll provide a complete solution.",
        requiresAuth: false,
        structuredData: {
          summary: "Technical issue resolved - ready to build your automation",
          steps: [
            "Step 1: Specify the exact platforms you want to integrate",
            "Step 2: I'll provide complete credential requirements for each platform",
            "Step 3: Build the automation workflow with proper error handling",
            "Step 4: Test and deploy your automation"
          ],
          clarification_questions: [
            "Which specific platforms would you like to integrate? (e.g., Gmail, Slack, HubSpot, Salesforce)",
            "What specific outcome are you trying to achieve?"
          ]
        }
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
