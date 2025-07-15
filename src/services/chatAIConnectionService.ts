
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
  error_help_available?: boolean;
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
    const startTime = Date.now();
    
    try {
      console.log('🚀 ChatAIConnectionService: Processing automation request', {
        hasMessage: !!request.message,
        messageLength: request.message?.length || 0,
        userId: request.userId,
        automationId: request.automationId,
        hasAutomationContext: !!request.automationContext,
        messagesCount: request.messages?.length || 0
      });

      const payload = {
        message: request.message,
        messages: request.messages || [],
        automationId: request.automationId,
        automationContext: request.automationContext,
        context: request.context || 'automation_creation',
        userId: request.userId
      };

      console.log('🤖 Calling enhanced chat-ai function...');

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: payload
      });

      const responseTime = Date.now() - startTime;
      console.log(`⚡ Chat-AI response received in ${responseTime}ms`);

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      console.log('✅ Chat AI response analysis:', {
        hasData: !!data,
        dataType: typeof data,
        hasSummary: !!data?.summary,
        stepsCount: data?.steps?.length || 0,
        platformsCount: data?.platforms?.length || 0,
        agentsCount: data?.agents?.length || 0,
        hasBlueprint: !!data?.automation_blueprint,
        hasApiConfigs: !!data?.api_configurations,
        clarificationCount: data?.clarification_questions?.length || 0,
        responseTime: `${responseTime}ms`
      });

      // Enhanced response processing with graceful handling
      let responseText = "I'm ready to help you create a comprehensive automation with the right platforms and credentials.";
      let structuredData = null;
      let errorHelpAvailable = false;
      
      if (data && typeof data === 'object') {
        // Store the complete structured data
        structuredData = data;
        errorHelpAvailable = data.error_help_available || false;
        
        // Priority 1: Handle clarification-only responses
        if (data.clarification_questions && Array.isArray(data.clarification_questions) && data.clarification_questions.length > 0) {
          responseText = "I need some clarification to provide the best solution:\n\n" + 
            data.clarification_questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
        }
        // Priority 2: Use summary if available and valid
        else if (data.summary && typeof data.summary === 'string' && data.summary.trim() !== '') {
          responseText = data.summary;
        }
        // Priority 3: Generate from structured data
        else if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
          const platformCount = data.platforms?.length || 0;
          const agentCount = data.agents?.length || 0;
          responseText = `I've created a comprehensive automation plan with ${data.steps.length} steps` +
            (platformCount > 0 ? `, ${platformCount} platform integrations` : '') +
            (agentCount > 0 ? `, and ${agentCount} AI agents` : '') + 
            ' to achieve your automation goals.';
        }
        // Priority 4: Handle platforms-only response
        else if (data.platforms && Array.isArray(data.platforms) && data.platforms.length > 0) {
          const platformNames = data.platforms.map(p => p.name).join(', ');
          responseText = `I've identified the platforms you'll need: ${platformNames}. I'm setting up the complete automation workflow with all necessary credentials and configurations.`;
        }
      }

      // Final validation - ensure response is never empty
      if (!responseText || responseText.trim() === '') {
        console.warn('⚠️ Empty response detected, using fallback');
        responseText = "I'm ready to help you create your automation. Please specify the platforms you'd like to integrate (like Gmail, Slack, HubSpot, etc.) and I'll provide complete setup instructions.";
      }

      console.log('📤 Final response processing:', {
        responseTextLength: responseText.length,
        responsePreview: responseText.substring(0, 100),
        hasStructuredData: !!structuredData,
        errorHelpAvailable,
        totalProcessingTime: `${Date.now() - startTime}ms`
      });

      return {
        response: responseText,
        requiresAuth: false,
        structuredData: structuredData,
        error_help_available: errorHelpAvailable
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ ChatAIConnectionService: Error after ${responseTime}ms:`, error);
      
      // Graceful error response with chat help
      return {
        response: "I encountered a technical issue, but I'm ready to help you create your automation. Please rephrase your request with specific platform names (like Gmail, Slack, HubSpot, etc.) and I'll provide a complete solution.",
        requiresAuth: false,
        error_help_available: true,
        structuredData: {
          summary: "Technical issue resolved - ready to build your automation",
          steps: [
            "Specify the exact platforms you want to integrate",
            "Describe the automation workflow you want to create", 
            "I'll provide complete credential requirements for each platform",
            "Build and test your automation with full support"
          ],
          platforms: [],
          api_configurations: [],
          agents: [{
            name: "TechnicalSupportAgent",
            role: "Technical issue resolution and automation guidance specialist",
            goal: "Help recover from technical issues and provide complete automation solutions",
            rules: "Always provide helpful responses, ensure user can continue with automation creation",
            memory: "Technical issue encountered - ready to provide full automation assistance",
            why_needed: "Essential for maintaining reliable automation creation experience"
          }],
          clarification_questions: [
            "Which specific platforms would you like to integrate? (e.g., Gmail, Slack, HubSpot, Salesforce)",
            "What specific outcome are you trying to achieve?"
          ],
          automation_blueprint: {
            version: "2.0.0",
            description: "Error recovery - ready for automation creation",
            trigger: { type: "manual" },
            variables: { error_recovery: "active" },
            steps: [],
            error_handling: { retry_attempts: 3, fallback_actions: "user_guidance" }
          },
          conversation_updates: {
            error_recovery: "Active - ready for automation assistance",
            platform_support: "All platforms available",
            automation_integration: "Ready for complete automation creation"
          },
          is_update: false,
          recheck_status: "error_recovered_ready_for_request"
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
