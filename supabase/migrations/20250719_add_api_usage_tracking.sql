
-- Add API usage tracking table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  platform_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  is_success BOOLEAN NOT NULL DEFAULT false,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API usage logs" 
  ON public.api_usage_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert API usage logs" 
  ON public.api_usage_logs 
  FOR INSERT 
  WITH CHECK (true);
