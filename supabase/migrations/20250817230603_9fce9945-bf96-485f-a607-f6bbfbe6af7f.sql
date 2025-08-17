
-- Create automation_executions table for tracking AI-generated code and execution results
CREATE TABLE public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  generated_code TEXT,
  generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  execution_result JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to manage their own automation executions
CREATE POLICY "Users can manage their own automation executions" 
  ON public.automation_executions 
  FOR ALL 
  USING (auth.uid() = user_id);
