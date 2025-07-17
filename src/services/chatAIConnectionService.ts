
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
  error_help_available?: boolean;
  training_acknowledged?: boolean;
  memory_updated?: boolean;
}

class ChatAIConnectionService {
  async processConnectionRequest(request: ChatAIRequest): Promise<ChatAIResponse> {
    try {
      console.log('🚀 Processing YusrAI chat request:', request.message);
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: request.message,
          userId: request.userId,
          messages: request.messages || [],
          context: request.context || 'yusrai_automation_creation',
          automationContext: request.automationContext,
          isTrainingMode: false
        }
      });

      if (error) {
        console.error('❌ YusrAI Chat AI error:', error);
        throw new Error(`YusrAI Chat AI service error: ${error.message}`);
      }

      console.log('✅ YusrAI Chat AI response received:', data);

      // Ensure we have a proper response
      if (!data || !data.response) {
        console.warn('⚠️ Empty response from YusrAI Chat AI, using fallback');
        return {
          response: JSON.stringify({
            summary: "I'm YusrAI, ready to help you create comprehensive automations with platform integrations and AI agents.",
            steps: [
              "Tell me what automation you'd like to create",
              "I'll provide a complete blueprint with platforms, credentials, and AI agents",
              "Configure your platform credentials using the provided guidance",
              "Test your integrations with real API calls",
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
          error_help_available: true
        };
      }

      // Try to parse structured data from the response - improved for GPT-4o-mini
      let structuredData = null;
      try {
        // Since we're enforcing JSON structure with response_format in the OpenAI request,
        // the entire response should be valid JSON already
        structuredData = JSON.parse(data.response);
        console.log('📊 Successfully parsed structured data from YusrAI response:', structuredData);
      } catch (parseError) {
        console.log('⚠️ Error parsing structured JSON response:', parseError);
        // Fallback to regex pattern extraction if JSON parsing fails
        try {
          const jsonMatch = data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            structuredData = JSON.parse(jsonMatch[0]);
            console.log('📊 Extracted valid JSON using regex:', structuredData);
          }
        } catch (fallbackError) {
          console.log('❌ All JSON parsing attempts failed, treating as text');
        }
      }

      return {
        response: data.response,
        structuredData: structuredData,
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
      console.log(`🔧 Generating test config for: ${platformName}`);
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          generateTestConfig: true,
          platformName: platformName,
          message: `Generate test configuration for ${platformName}`
        }
      });

      if (error) {
        console.error('❌ Test config generation error:', error);
        throw new Error(`Failed to generate test config: ${error.message}`);
      }

      console.log('✅ Test config generated:', data);
      return data.testConfig || null;

    } catch (error: any) {
      console.error('💥 Test config generation failed:', error);
      throw error;
    }
  }
}

export const chatAIConnectionService = new ChatAIConnectionService();
