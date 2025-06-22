
-- Create table to store error analysis conversations
CREATE TABLE public.error_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  file_name TEXT,
  user_action TEXT,
  conversation_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for error conversations
CREATE POLICY "Users can view their own error conversations" 
  ON public.error_conversations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own error conversations" 
  ON public.error_conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own error conversations" 
  ON public.error_conversations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own error conversations" 
  ON public.error_conversations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_error_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_error_conversation_timestamp
  BEFORE UPDATE ON public.error_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_error_conversation_timestamp();
