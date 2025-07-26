-- Create automation_responses table for data persistence
CREATE TABLE IF NOT EXISTS public.automation_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  automation_id UUID NOT NULL,
  chat_message_id INTEGER,
  response_text TEXT NOT NULL,
  structured_data JSONB,
  yusrai_powered BOOLEAN DEFAULT false,
  seven_sections_validated BOOLEAN DEFAULT false,
  error_help_available BOOLEAN DEFAULT false,
  is_ready_for_execution BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.automation_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own automation responses" 
ON public.automation_responses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automation responses" 
ON public.automation_responses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation responses" 
ON public.automation_responses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation responses" 
ON public.automation_responses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_automation_responses_updated_at
BEFORE UPDATE ON public.automation_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_notifications_timestamp();

-- Create index for better performance
CREATE INDEX idx_automation_responses_user_id ON public.automation_responses(user_id);
CREATE INDEX idx_automation_responses_automation_id ON public.automation_responses(automation_id);