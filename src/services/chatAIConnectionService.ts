
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
      console.log('🚀 Processing chat AI request:', request.message);
      
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: request.message,
          userId: request.userId,
          messages: request.messages || [],
          context: request.context || 'automation_creation',
          automationContext: request.automationContext,
          isTrainingMode: false
        }
      });

      if (error) {
        console.error('❌ Chat AI error:', error);
        throw new Error(`Chat AI service error: ${error.message}`);
      }

      console.log('✅ Chat AI response received:', data);

      // Ensure we have a proper response
      if (!data || !data.response) {
        console.warn('⚠️ Empty response from Chat AI, using fallback');
        return {
          response: "I'm ready to help you create comprehensive automations. Please specify the platforms you'd like to integrate and I'll provide complete setup instructions.",
          error_help_available: true
        };
      }

      // Try to parse structured data from the response
      let structuredData = null;
      try {
        // Look for JSON-like content in the response
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          structuredData = JSON.parse(jsonMatch[0]);
          console.log('📊 Parsed structured data:', structuredData);
        }
      } catch (parseError) {
        console.log('ℹ️ No structured data found in response');
      }

      return {
        response: data.response,
        structuredData: structuredData,
        error_help_available: data.error_help_available || false,
        training_acknowledged: data.training_acknowledged || false,
        memory_updated: data.memory_updated || false
      };

    } catch (error: any) {
      console.error('💥 Chat AI service error:', error);
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
