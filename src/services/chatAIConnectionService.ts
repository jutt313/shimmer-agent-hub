
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
  attempts_required?: number;
  validation_passed?: boolean;
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
        console.warn('⚠️ Empty response from YusrAI Chat AI, using structured fallback');
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
            platforms: [
              {
                name: "Platform Integration Required",
                credentials: [
                  {
                    field: "api_key",
                    why_needed: "Authentication required for platform access",
                    where_to_get: "Platform developer dashboard",
                    link: "#",
                    example: "your_api_key_here"
                  }
                ]
              }
            ],
            clarification_questions: [
              "What specific automation would you like me to create for you?",
              "Which platforms should be integrated in your workflow?"
            ],
            agents: [
              {
                name: "AutomationAssistant",
                role: "Decision Maker",
                rule: "Analyze requirements and recommend optimal solutions",
                goal: "Create efficient automation workflows",
                memory: "User preferences and successful patterns",
                why_needed: "Essential for intelligent automation design",
                custom_config: {},
                test_scenarios: ["Analyze user requirements", "Validate workflow logic"]
              }
            ],
            test_payloads: {
              "example_platform": {
                method: "GET",
                endpoint: "/api/test",
                headers: { "Authorization": "Bearer {api_key}" },
                expected_response: { "status": "success" },
                error_patterns: { "401": "Invalid credentials" }
              }
            },
            execution_blueprint: {
              trigger: { type: "manual", configuration: {} },
              workflow: [
                {
                  step: 1,
                  action: "initialize_automation",
                  platform: "YusrAI",
                  method: "POST",
                  endpoint: "/api/initialize",
                  headers: { "Content-Type": "application/json" },
                  data_mapping: { "user_input": "config" },
                  success_condition: "response.status === 'success'",
                  error_handling: {
                    retry_attempts: 3,
                    fallback_action: "log_error",
                    on_failure: "pause_automation"
                  },
                  next_step: 2,
                  description: "Initialize automation workflow"
                }
              ],
              error_handling: {
                retry_attempts: 3,
                fallback_actions: ["log_error", "notify_user"],
                notification_rules: [{ event: "failure", action: "alert" }],
                critical_failure_actions: ["stop_automation"]
              },
              performance_optimization: {
                rate_limit_handling: "exponential_backoff",
                concurrency_limit: 5,
                timeout_seconds_per_step: 60
              }
            }
          }),
          error_help_available: true,
          validation_passed: false
        };
      }

      // Enhanced: Try to parse structured data from the response
      let structuredData = null;
      try {
        // The response should already be valid JSON from the enhanced chat-ai function
        if (typeof data.response === 'string') {
          structuredData = JSON.parse(data.response);
          console.log('📊 Successfully parsed YusrAI structured data:', {
            hasSummary: !!structuredData.summary,
            stepsCount: structuredData.steps?.length || 0,
            platformsCount: structuredData.platforms?.length || 0,
            agentsCount: structuredData.agents?.length || 0,
            hasTestPayloads: !!structuredData.test_payloads,
            hasExecutionBlueprint: !!structuredData.execution_blueprint
          });
        } else if (typeof data.response === 'object') {
          structuredData = data.response;
          console.log('📊 Using YusrAI structured data from object response');
        }
      } catch (parseError) {
        console.log('⚠️ Failed to parse YusrAI structured JSON response:', parseError);
        // If parsing fails, the response will be treated as plain text
      }

      return {
        response: data.response,
        structuredData: structuredData,
        error_help_available: data.error_help_available || false,
        training_acknowledged: data.training_acknowledged || false,
        memory_updated: data.memory_updated || false,
        attempts_required: data.attempts_required || 1,
        validation_passed: data.validation_passed || false
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
