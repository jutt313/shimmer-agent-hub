
-- Create chat_ai_instructions table for dynamic instructions
CREATE TABLE public.chat_ai_instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_type TEXT NOT NULL CHECK (instruction_type IN ('system_behavior', 'platform_rules', 'problem_solutions', 'user_preferences', 'field_name_mappings')),
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_ai_memory table for agent memory and learning
CREATE TABLE public.chat_ai_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  conversation_context JSONB NOT NULL DEFAULT '{}',
  learned_patterns JSONB NOT NULL DEFAULT '{}',
  successful_solutions JSONB NOT NULL DEFAULT '{}',
  memory_type TEXT NOT NULL DEFAULT 'conversation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_ai_feedback table for user feedback and corrections
CREATE TABLE public.chat_ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'correction', 'improvement')),
  original_output TEXT NOT NULL,
  desired_output TEXT,
  solution_applied TEXT,
  automation_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security policies for chat_ai_instructions
ALTER TABLE public.chat_ai_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active instructions"
  ON public.chat_ai_instructions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create their own instructions"
  ON public.chat_ai_instructions
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own instructions"
  ON public.chat_ai_instructions
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own instructions"
  ON public.chat_ai_instructions
  FOR DELETE
  USING (auth.uid() = created_by);

-- Add Row Level Security policies for chat_ai_memory
ALTER TABLE public.chat_ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memory"
  ON public.chat_ai_memory
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memory"
  ON public.chat_ai_memory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory"
  ON public.chat_ai_memory
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add Row Level Security policies for chat_ai_feedback
ALTER TABLE public.chat_ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.chat_ai_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback"
  ON public.chat_ai_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON public.chat_ai_feedback
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_chat_ai_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_chat_ai_instructions_timestamp
  BEFORE UPDATE ON public.chat_ai_instructions
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_ai_timestamp();

CREATE TRIGGER update_chat_ai_memory_timestamp
  BEFORE UPDATE ON public.chat_ai_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_chat_ai_timestamp();
