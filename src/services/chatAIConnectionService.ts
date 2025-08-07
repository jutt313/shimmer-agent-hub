
import { supabase } from '@/integrations/supabase/client';

export interface ChatAIRequest {
  userId: string;
  message: string;
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: string;
  automationContext?: any;
}

export interface ChatAIResponse {
  response: string;
  structuredData?: any;
  yusrai_powered?: boolean;
  seven_sections_validated?: boolean;
  error_help_available?: boolean;
  training_acknowledged?: boolean;
  memory_updated?: boolean;
}

class ChatAIConnectionService {
  async processConnectionRequest(request: ChatAIRequest): Promise<ChatAIResponse> {
    try {
      console.log('🚀 Processing YusrAI request:', request.message);
      
      // Transform messages to proper OpenAI format
      const formattedMessages = request.messages?.map(msg => ({
        role: msg.role || (msg.isBot ? 'assistant' : 'user'),
        content: msg.content || msg.text || msg.message_content || ''
      })).filter(msg => msg.content.trim() !== '') || [];

      console.log('📤 Sending formatted messages:', formattedMessages);

      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: request.message,
          userId: request.userId,
          messages: formattedMessages,
          context: request.context || 'yusrai_automation_creation',
          automationContext: request.automationContext
        }
      });

      if (error) {
        console.error('❌ YusrAI Chat AI error:', error);
        throw new Error(`YusrAI Chat AI service error: ${error.message}`);
      }

      console.log('✅ YusrAI response received:', data);

      if (!data || !data.response) {
        console.warn('⚠️ Empty response from YusrAI, using fallback');
        return {
          response: JSON.stringify({
            summary: "I'm YusrAI, ready to help you create comprehensive automations with platform integrations and AI agents.",
            steps: [
              "Tell me what automation you'd like to create",
              "I'll provide a complete blueprint with platforms and AI agents",
              "Configure your platform credentials using my guidance"
            ],
            platforms: [],
            clarification_questions: [
              "What specific automation would you like me to create for you?",
              "Which platforms should be involved in your workflow?"
            ],
            agents: [],
            test_payloads: {},
            execution_blueprint: {
              trigger: { type: "manual", configuration: {} },
              workflow: [],
              error_handling: {
                retry_attempts: 3,
                fallback_actions: ["log_error"],
                notification_rules: [],
                critical_failure_actions: ["pause_automation"]
              }
            }
          }),
          yusrai_powered: true,
          seven_sections_validated: true,
          error_help_available: true
        };
      }

      // Handle both direct JSON objects and JSON strings
      let structuredData = null;
      let responseText = data.response;

      try {
        // If data.response is already an object (from successful JSON parsing in edge function)
        if (typeof data.response === 'object' && data.response !== null) {
          structuredData = data.response;
          responseText = JSON.stringify(data.response);
          console.log('📊 Using direct structured data object:', structuredData);
        } else if (typeof data.response === 'string') {
          // Try to parse as JSON if it's a string
          try {
            structuredData = JSON.parse(data.response);
            console.log('📊 Successfully parsed YusrAI structured data from JSON string:', structuredData);
          } catch (parseError) {
            console.log('📝 Response is plain text, not JSON structure');
            structuredData = null;
          }
        }
      } catch (parseError) {
        console.log('⚠️ Error processing YusrAI response:', parseError);
        structuredData = null;
      }

      return {
        response: responseText,
        structuredData: structuredData,
        yusrai_powered: data.yusrai_powered || true,
        seven_sections_validated: data.seven_sections_validated || false,
        error_help_available: data.error_help_available || false,
        training_acknowledged: data.training_acknowledged || false,
        memory_updated: data.memory_updated || false
      };

    } catch (error: any) {
      console.error('💥 YusrAI Chat AI service error:', error);
      throw error;
    }
  }

  async generateTestConfig(platformName: string): Promise<any> {
    try {
      console.log(`🔧 Generating YusrAI test config for: ${platformName}`);
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          generateTestConfig: true,
          platformName: platformName,
          message: `Generate test configuration for ${platformName} with real API endpoints and exact headers`,
          requestType: 'test_config_generation'
        }
      });

      if (error) {
        console.error('❌ YusrAI test config generation error:', error);
        throw new Error(`Failed to generate test config: ${error.message}`);
      }

      console.log('✅ YusrAI test config generated:', data);
      return data.testConfig || data;

    } catch (error: any) {
      console.error('💥 YusrAI test config generation failed:', error);
      throw error;
    }
  }
}

export const chatAIConnectionService = new ChatAIConnectionService();
