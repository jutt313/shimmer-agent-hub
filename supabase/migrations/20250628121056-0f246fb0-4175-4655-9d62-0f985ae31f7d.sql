
-- Create enum for integration types
CREATE TYPE public.integration_type AS ENUM ('oauth', 'api_key', 'webhook');

-- Create enum for API token types
CREATE TYPE public.api_token_type AS ENUM ('developer', 'user', 'automation');

-- Create enum for developer subscription tiers
CREATE TYPE public.developer_tier AS ENUM ('free', 'pro', 'enterprise');

-- Table for developer integrations (developers who want to integrate with YusrAI)
CREATE TABLE public.developer_integrations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL,
    app_description TEXT,
    client_id TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    client_secret TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    redirect_uris TEXT[] NOT NULL DEFAULT '{}',
    webhook_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tier public.developer_tier NOT NULL DEFAULT 'free',
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user API tokens (personal tokens for users)
CREATE TABLE public.user_api_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_name TEXT NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    token_type public.api_token_type NOT NULL DEFAULT 'user',
    permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false, "webhook": false}',
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for automation webhooks
CREATE TABLE public.automation_webhooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    webhook_url TEXT UNIQUE NOT NULL,
    webhook_secret TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for OAuth connections (when users connect their accounts to developer apps)
CREATE TABLE public.oauth_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    developer_integration_id UUID NOT NULL REFERENCES public.developer_integrations(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Table for API usage tracking
CREATE TABLE public.api_usage_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    developer_integration_id UUID REFERENCES public.developer_integrations(id) ON DELETE CASCADE,
    api_token_id UUID REFERENCES public.user_api_tokens(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for webhook delivery logs
CREATE TABLE public.webhook_delivery_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_webhook_id UUID NOT NULL REFERENCES public.automation_webhooks(id) ON DELETE CASCADE,
    automation_run_id UUID REFERENCES public.automation_runs(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    delivery_attempts INTEGER NOT NULL DEFAULT 1,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.developer_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for developer_integrations
CREATE POLICY "Users can view their own developer integrations" 
  ON public.developer_integrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own developer integrations" 
  ON public.developer_integrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own developer integrations" 
  ON public.developer_integrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own developer integrations" 
  ON public.developer_integrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for user_api_tokens
CREATE POLICY "Users can view their own API tokens" 
  ON public.user_api_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API tokens" 
  ON public.user_api_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API tokens" 
  ON public.user_api_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API tokens" 
  ON public.user_api_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for automation_webhooks
CREATE POLICY "Users can view webhooks for their automations" 
  ON public.automation_webhooks 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_webhooks.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create webhooks for their automations" 
  ON public.automation_webhooks 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_webhooks.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can update webhooks for their automations" 
  ON public.automation_webhooks 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_webhooks.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete webhooks for their automations" 
  ON public.automation_webhooks 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_webhooks.automation_id 
    AND automations.user_id = auth.uid()
  ));

-- RLS Policies for oauth_connections
CREATE POLICY "Users can view their own OAuth connections" 
  ON public.oauth_connections 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own OAuth connections" 
  ON public.oauth_connections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own OAuth connections" 
  ON public.oauth_connections 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own OAuth connections" 
  ON public.oauth_connections 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for api_usage_logs (read-only for users)
CREATE POLICY "Users can view their own API usage logs" 
  ON public.api_usage_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policies for webhook_delivery_logs (read-only for automation owners)
CREATE POLICY "Users can view webhook logs for their automations" 
  ON public.webhook_delivery_logs 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.automation_webhooks 
    JOIN public.automations ON automations.id = automation_webhooks.automation_id
    WHERE automation_webhooks.id = webhook_delivery_logs.automation_webhook_id 
    AND automations.user_id = auth.uid()
  ));

-- Database functions for token management
CREATE OR REPLACE FUNCTION public.generate_api_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a secure random token
  token := 'ysr_' || encode(gen_random_bytes(32), 'hex');
  RETURN token;
END;
$$;

CREATE OR REPLACE FUNCTION public.hash_api_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hash the token for secure storage
  RETURN encode(digest(token, 'sha256'), 'hex');
END;
$$;

-- Function to validate API tokens
CREATE OR REPLACE FUNCTION public.validate_api_token(token_hash TEXT)
RETURNS TABLE (
  user_id UUID,
  token_type api_token_type,
  permissions JSONB,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uat.user_id,
    uat.token_type,
    uat.permissions,
    (uat.is_active AND (uat.expires_at IS NULL OR uat.expires_at > now())) as is_valid
  FROM public.user_api_tokens uat
  WHERE uat.token_hash = validate_api_token.token_hash;
END;
$$;

-- Function to generate webhook URLs
CREATE OR REPLACE FUNCTION public.generate_webhook_url(automation_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_id TEXT;
  base_url TEXT := 'https://zorwtyijosgdcckljmqd.supabase.co/functions/v1/webhook-trigger/';
BEGIN
  webhook_id := encode(gen_random_bytes(16), 'hex');
  RETURN base_url || webhook_id || '?automation_id=' || automation_id::text;
END;
$$;

-- Trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION public.update_developer_integration_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER update_developer_integration_timestamp
  BEFORE UPDATE ON public.developer_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_developer_integration_timestamp();

-- Indexes for performance
CREATE INDEX idx_developer_integrations_user_id ON public.developer_integrations(user_id);
CREATE INDEX idx_developer_integrations_client_id ON public.developer_integrations(client_id);
CREATE INDEX idx_user_api_tokens_user_id ON public.user_api_tokens(user_id);
CREATE INDEX idx_user_api_tokens_hash ON public.user_api_tokens(token_hash);
CREATE INDEX idx_automation_webhooks_automation_id ON public.automation_webhooks(automation_id);
CREATE INDEX idx_oauth_connections_user_id ON public.oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_developer_id ON public.oauth_connections(developer_integration_id);
CREATE INDEX idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX idx_webhook_delivery_logs_webhook_id ON public.webhook_delivery_logs(automation_webhook_id);
