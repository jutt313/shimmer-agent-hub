
import { supabase } from '@/integrations/supabase/client';

export interface ChatAIRequest {
  userId: string;
  message: string;
  messages?: Array<{
    text: string;
    isBot: boolean;
    message_content: string;
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
      console.log('🚀 Processing YusrAI 7-section request:', request.message);
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: request.message,
          userId: request.userId,
          messages: request.messages || [],
          context: request.context || 'yusrai_automation_creation',
          automationContext: request.automationContext
        }
      });

      if (error) {
        console.error('❌ YusrAI Chat AI error:', error);
        throw new Error(`YusrAI Chat AI service error: ${error.message}`);
      }

      console.log('✅ YusrAI 7-section response received:', data);

      if (!data || !data.response) {
        console.warn('⚠️ Empty response from YusrAI, using fallback');
        return {
          response: JSON.stringify({
            summary: "I'm YusrAI, ready to help you create comprehensive automations with platform integrations and AI agents.",
            steps: [
              "Tell me what automation you'd like to create",
              "I'll provide a complete blueprint with platforms and AI agents",
              "Configure your platform credentials using my guidance",
              "Test your integrations with real API calls",
              "Add recommended AI agents for intelligent decision-making",
              "Execute your automation with full monitoring and error handling"
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
              },
              performance_optimization: {
                rate_limit_handling: "exponential_backoff",
                concurrency_limit: 5,
                timeout_seconds_per_step: 60
              }
            }
          }),
          yusrai_powered: true,
          seven_sections_validated: true,
          error_help_available: true
        };
      }

      // UPDATED: Parse structured data from your consistent chat-ai JSON structure
      let structuredData = null;
      try {
        // FIXED: Your chat-ai function returns JSON string in response field
        if (typeof data.response === 'string') {
          structuredData = JSON.parse(data.response);
          console.log('📊 Successfully parsed YusrAI structured data from your consistent JSON:', structuredData);
        } else {
          // Fallback for direct object (shouldn't happen with your new structure)
          structuredData = data.response;
          console.log('📊 Using direct structured data object:', structuredData);
        }
      } catch (parseError) {
        console.log('⚠️ Error parsing YusrAI JSON response:', parseError);
        
        // Fallback regex extraction
        try {
          const jsonMatch = data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0]);
            console.log('📊 Extracted YusrAI JSON using regex fallback:', structuredData);
          }
        } catch (fallbackError) {
          console.log('❌ All YusrAI JSON parsing attempts failed');
        }
      }

      return {
        response: data.response,
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
          message: `Generate test configuration for ${platformName} with real API endpoints and exact headers`
        }
      });

      if (error) {
        console.error('❌ YusrAI test config generation error:', error);
        throw new Error(`Failed to generate test config: ${error.message}`);
      }

      console.log('✅ YusrAI test config generated:', data);
      return data.testConfig || null;

    } catch (error: any) {
      console.error('💥 YusrAI test config generation failed:', error);
      throw error;
    }
  }
}

export const chatAIConnectionService = new ChatAIConnectionService();
