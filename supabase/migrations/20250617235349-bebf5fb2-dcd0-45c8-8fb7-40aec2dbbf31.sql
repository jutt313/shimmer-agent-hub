
-- Create users table for authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automations table (central hub)
CREATE TABLE public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  automation_blueprint JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation_chats table for conversation history
CREATE TABLE public.automation_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  message_content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_agents table for AI agent definitions
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  agent_name TEXT NOT NULL,
  agent_role TEXT,
  agent_goal TEXT,
  agent_rules TEXT,
  agent_memory JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_credentials table for user credentials
CREATE TABLE public.platform_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform_name TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  credentials TEXT NOT NULL, -- Should be encrypted in production
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation_runs table for execution history
CREATE TABLE public.automation_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  run_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'running',
  details_log JSONB,
  duration_ms INTEGER,
  trigger_data JSONB
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for automations table
CREATE POLICY "Users can view their own automations"
  ON public.automations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automations"
  ON public.automations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations"
  ON public.automations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations"
  ON public.automations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for automation_chats table
CREATE POLICY "Users can view chats for their automations"
  ON public.automation_chats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_chats.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create chats for their automations"
  ON public.automation_chats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_chats.automation_id 
    AND automations.user_id = auth.uid()
  ));

-- RLS Policies for ai_agents table
CREATE POLICY "Users can view agents for their automations"
  ON public.ai_agents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = ai_agents.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create agents for their automations"
  ON public.ai_agents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = ai_agents.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update agents for their automations"
  ON public.ai_agents FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = ai_agents.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete agents for their automations"
  ON public.ai_agents FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = ai_agents.automation_id 
    AND automations.user_id = auth.uid()
  ));

-- RLS Policies for platform_credentials table
CREATE POLICY "Users can view their own credentials"
  ON public.platform_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credentials"
  ON public.platform_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON public.platform_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON public.platform_credentials FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for automation_runs table
CREATE POLICY "Users can view runs for their automations"
  ON public.automation_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create runs for their automations"
  ON public.automation_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update runs for their automations"
  ON public.automation_runs FOR UPDATE
  USING (auth.uid() = user_id);
