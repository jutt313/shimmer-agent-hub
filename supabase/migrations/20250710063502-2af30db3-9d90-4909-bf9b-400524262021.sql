
-- Create automation-specific platform credentials table
CREATE TABLE public.automation_platform_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  credential_type TEXT NOT NULL DEFAULT 'api_key',
  credentials TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_tested BOOLEAN NOT NULL DEFAULT false,
  test_status TEXT,
  test_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(automation_id, platform_name)
);

-- Add Row Level Security
ALTER TABLE public.automation_platform_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies for automation-specific credentials
CREATE POLICY "Users can create credentials for their automations" 
  ON public.automation_platform_credentials 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM automations 
      WHERE automations.id = automation_platform_credentials.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view credentials for their automations" 
  ON public.automation_platform_credentials 
  FOR SELECT 
  USING (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM automations 
      WHERE automations.id = automation_platform_credentials.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update credentials for their automations" 
  ON public.automation_platform_credentials 
  FOR UPDATE 
  USING (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM automations 
      WHERE automations.id = automation_platform_credentials.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete credentials for their automations" 
  ON public.automation_platform_credentials 
  FOR DELETE 
  USING (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM automations 
      WHERE automations.id = automation_platform_credentials.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

-- Create table for tracking agent decisions per automation
CREATE TABLE public.automation_agent_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('pending', 'added', 'dismissed')),
  agent_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(automation_id, agent_name)
);

-- Add Row Level Security for agent decisions
ALTER TABLE public.automation_agent_decisions ENABLE ROW LEVEL SECURITY;

-- Create policies for agent decisions
CREATE POLICY "Users can create agent decisions for their automations" 
  ON public.automation_agent_decisions 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM automations 
      WHERE automations.id = automation_agent_decisions.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view agent decisions for their automations" 
  ON public.automation_agent_decisions 
  FOR SELECT 
  USING (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM automations 
      WHERE automations.id = automation_agent_decisions.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agent decisions for their automations" 
  ON public.automation_agent_decisions 
  FOR UPDATE 
  USING (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM automations 
      WHERE automations.id = automation_agent_decisions.automation_id 
      AND automations.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_automation_platform_credentials_automation_id ON public.automation_platform_credentials(automation_id);
CREATE INDEX idx_automation_platform_credentials_user_id ON public.automation_platform_credentials(user_id);
CREATE INDEX idx_automation_agent_decisions_automation_id ON public.automation_agent_decisions(automation_id);
CREATE INDEX idx_automation_agent_decisions_user_id ON public.automation_agent_decisions(user_id);
