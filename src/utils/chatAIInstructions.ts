
import { supabase } from '@/integrations/supabase/client';

export interface ChatAIInstruction {
  id: string;
  instruction_type: string;
  content: string;
  priority: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatAIMemory {
  id: string;
  user_id: string;
  conversation_context: any;
  learned_patterns: any;
  successful_solutions: any;
  memory_type: string;
  created_at: string;
  updated_at: string;
}

export interface ChatAIFeedback {
  id: string;
  user_id: string;
  feedback_type: string;
  original_output: string;
  desired_output?: string;
  solution_applied?: string;
  automation_context?: any;
  created_at: string;
}

export const instructionTypes = [
  { value: 'system_behavior', label: 'System Behavior Rules', description: 'How the AI should behave and respond' },
  { value: 'platform_rules', label: 'Platform-Specific Instructions', description: 'Rules for specific platforms and APIs' },
  { value: 'problem_solutions', label: 'Problem Solutions', description: 'Solutions for known issues and problems' },
  { value: 'user_preferences', label: 'User Preferences', description: 'User-specific preferences and customizations' },
  { value: 'field_name_mappings', label: 'Field Name Mappings', description: 'Correct field names for platform configurations' }
];

export const feedbackTypes = [
  { value: 'positive', label: 'Positive', description: 'Good response, AI should continue this behavior' },
  { value: 'negative', label: 'Negative', description: 'Poor response, AI should avoid this behavior' },
  { value: 'correction', label: 'Correction', description: 'Provide the correct response for AI to learn' },
  { value: 'improvement', label: 'Improvement', description: 'Suggestion for how AI can improve' }
];

export class ChatAIInstructionManager {
  static async createInstruction(
    instructionType: string,
    content: string,
    priority: number = 5,
    userId: string
  ): Promise<ChatAIInstruction | null> {
    try {
      const { data, error } = await supabase
        .from('chat_ai_instructions')
        .insert({
          instruction_type: instructionType,
          content: content,
          priority: priority,
          created_by: userId,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating instruction:', error);
      return null;
    }
  }

  static async updateInstruction(
    instructionId: string,
    updates: Partial<ChatAIInstruction>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_ai_instructions')
        .update(updates)
        .eq('id', instructionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating instruction:', error);
      return false;
    }
  }

  static async deleteInstruction(instructionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_ai_instructions')
        .delete()
        .eq('id', instructionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting instruction:', error);
      return false;
    }
  }

  static async getActiveInstructions(): Promise<ChatAIInstruction[]> {
    try {
      const { data, error } = await supabase
        .from('chat_ai_instructions')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching instructions:', error);
      return [];
    }
  }

  static async getUserMemory(userId: string): Promise<ChatAIMemory[]> {
    try {
      const { data, error } = await supabase
        .from('chat_ai_memory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching memory:', error);
      return [];
    }
  }

  static async createMemoryEntry(
    userId: string,
    conversationContext: any,
    learnedPatterns: any = {},
    successfulSolutions: any = {},
    memoryType: string = 'conversation'
  ): Promise<ChatAIMemory | null> {
    try {
      const { data, error } = await supabase
        .from('chat_ai_memory')
        .insert({
          user_id: userId,
          conversation_context: conversationContext,
          learned_patterns: learnedPatterns,
          successful_solutions: successfulSolutions,
          memory_type: memoryType
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating memory entry:', error);
      return null;
    }
  }

  static async provideFeedback(
    userId: string,
    feedbackType: string,
    originalOutput: string,
    desiredOutput?: string,
    solutionApplied?: string,
    automationContext?: any
  ): Promise<ChatAIFeedback | null> {
    try {
      const { data, error } = await supabase
        .from('chat_ai_feedback')
        .insert({
          user_id: userId,
          feedback_type: feedbackType,
          original_output: originalOutput,
          desired_output: desiredOutput || null,
          solution_applied: solutionApplied || null,
          automation_context: automationContext || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error providing feedback:', error);
      return null;
    }
  }

  static async getUserFeedback(userId: string): Promise<ChatAIFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('chat_ai_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }

  static async seedDefaultInstructions(userId: string): Promise<void> {
    const defaultInstructions = [
      {
        instruction_type: 'field_name_mappings',
        content: 'For Google Sheets, always use field name "service_account_json" for authentication credentials, not "credentials" or "api_key".',
        priority: 1
      },
      {
        instruction_type: 'field_name_mappings', 
        content: 'For OpenAI, always use field name "api_key" for authentication credentials.',
        priority: 1
      },
      {
        instruction_type: 'field_name_mappings',
        content: 'For Gmail, always use field name "service_account_json" for authentication credentials.',
        priority: 1
      },
      {
        instruction_type: 'platform_rules',
        content: 'Always generate real API endpoints for testing. Never use fake URLs like "https://api.googlesheets.com". Use actual platform API endpoints.',
        priority: 2
      },
      {
        instruction_type: 'system_behavior',
        content: 'When creating automation configurations, ensure all field names exactly match what the test-credential function expects.',
        priority: 3
      }
    ];

    for (const instruction of defaultInstructions) {
      await this.createInstruction(
        instruction.instruction_type,
        instruction.content,
        instruction.priority,
        userId
      );
    }
  }
}

export default ChatAIInstructionManager;
