
-- Create table to store test results for platform credentials
CREATE TABLE public.credential_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_credential_id UUID REFERENCES public.platform_credentials(id) ON DELETE CASCADE,
  test_status TEXT NOT NULL CHECK (test_status IN ('passed', 'failed', 'pending')),
  test_message TEXT,
  technical_details JSONB,
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store test results for AI agents
CREATE TABLE public.agent_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  test_status TEXT NOT NULL CHECK (test_status IN ('passed', 'failed', 'pending')),
  test_message TEXT,
  technical_details JSONB,
  tested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for credential test results
ALTER TABLE public.credential_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credential test results" 
  ON public.credential_test_results 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_credentials pc 
      WHERE pc.id = credential_test_results.platform_credential_id 
      AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own credential test results" 
  ON public.credential_test_results 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_credentials pc 
      WHERE pc.id = credential_test_results.platform_credential_id 
      AND pc.user_id = auth.uid()
    )
  );

-- Add RLS policies for agent test results
ALTER TABLE public.agent_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agent test results" 
  ON public.agent_test_results 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_agents aa
      JOIN public.automations a ON aa.automation_id = a.id
      WHERE aa.id = agent_test_results.ai_agent_id 
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own agent test results" 
  ON public.agent_test_results 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_agents aa
      JOIN public.automations a ON aa.automation_id = a.id
      WHERE aa.id = agent_test_results.ai_agent_id 
      AND a.user_id = auth.uid()
    )
  );
