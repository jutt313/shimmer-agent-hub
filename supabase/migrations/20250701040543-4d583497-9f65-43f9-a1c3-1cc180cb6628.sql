
-- Create enum for API credential types
CREATE TYPE public.api_credential_type AS ENUM ('personal', 'project', 'service');

-- Create enum for billing status
CREATE TYPE public.billing_status AS ENUM ('active', 'suspended', 'cancelled');

-- Create developer projects table
CREATE TABLE public.developer_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_description TEXT,
  use_case TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create enhanced API credentials table (replacing the existing one)
DROP TABLE IF EXISTS public.api_credentials CASCADE;
CREATE TABLE public.api_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.developer_projects(id) ON DELETE CASCADE,
  credential_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  credential_type api_credential_type NOT NULL DEFAULT 'personal',
  permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false, "automations": true, "webhooks": false, "ai_agents": false}',
  is_private_only BOOLEAN DEFAULT false,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing accounts table
CREATE TABLE public.billing_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  billing_email TEXT NOT NULL,
  primary_business_address JSONB,
  credits_balance DECIMAL(10,2) DEFAULT 0.00,
  auto_recharge_enabled BOOLEAN DEFAULT false,
  auto_recharge_threshold DECIMAL(10,2) DEFAULT 10.00,
  auto_recharge_amount DECIMAL(10,2) DEFAULT 50.00,
  billing_status billing_status DEFAULT 'active',
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing transactions table
CREATE TABLE public.billing_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_account_id UUID NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'credit_purchase', 'usage_charge', 'refund'
  amount DECIMAL(10,2) NOT NULL,
  credits_amount DECIMAL(10,2), -- credits added/deducted
  description TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create usage tracking table (fixed the generated column issue)
CREATE TABLE public.api_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_credential_id UUID NOT NULL REFERENCES public.api_credentials(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.developer_projects(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_amount DECIMAL(8,4) DEFAULT 0.0000,
  response_time_ms INTEGER,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create budget limits table
CREATE TABLE public.budget_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.developer_projects(id) ON DELETE CASCADE,
  budget_name TEXT NOT NULL,
  budget_amount DECIMAL(10,2) NOT NULL,
  budget_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  start_date DATE NOT NULL,
  end_date DATE,
  current_spend DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.developer_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for developer_projects
CREATE POLICY "Users can view their own projects" ON public.developer_projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.developer_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.developer_projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.developer_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for api_credentials
CREATE POLICY "Users can view their own API credentials" ON public.api_credentials
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own API credentials" ON public.api_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own API credentials" ON public.api_credentials
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own API credentials" ON public.api_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for billing_accounts
CREATE POLICY "Users can view their own billing account" ON public.billing_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own billing account" ON public.billing_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own billing account" ON public.billing_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for billing_transactions
CREATE POLICY "Users can view their own billing transactions" ON public.billing_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own billing transactions" ON public.billing_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for api_usage_tracking
CREATE POLICY "Users can view their own API usage" ON public.api_usage_tracking
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own API usage records" ON public.api_usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for budget_limits
CREATE POLICY "Users can view their own budget limits" ON public.budget_limits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budget limits" ON public.budget_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budget limits" ON public.budget_limits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budget limits" ON public.budget_limits
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_developer_projects_user_id ON public.developer_projects(user_id);
CREATE INDEX idx_api_credentials_user_id ON public.api_credentials(user_id);
CREATE INDEX idx_api_credentials_api_key ON public.api_credentials(api_key);
CREATE INDEX idx_billing_accounts_user_id ON public.billing_accounts(user_id);
CREATE INDEX idx_billing_transactions_user_id ON public.billing_transactions(user_id);
CREATE INDEX idx_api_usage_tracking_user_id ON public.api_usage_tracking(user_id);
CREATE INDEX idx_api_usage_tracking_date ON public.api_usage_tracking(usage_date);
CREATE INDEX idx_budget_limits_user_id ON public.budget_limits(user_id);

-- Create function to generate API keys
CREATE OR REPLACE FUNCTION public.generate_yusrai_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'ysr_' || encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Create function to validate API keys
CREATE OR REPLACE FUNCTION public.validate_yusrai_api_key(api_key TEXT)
RETURNS TABLE(user_id UUID, project_id UUID, permissions JSONB, is_valid BOOLEAN, rate_limit_per_hour INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.user_id,
    ac.project_id,
    ac.permissions,
    ac.is_active as is_valid,
    ac.rate_limit_per_hour
  FROM public.api_credentials ac
  WHERE ac.api_key = validate_yusrai_api_key.api_key
    AND ac.is_active = true;
END;
$$;

-- Create function to track API usage
CREATE OR REPLACE FUNCTION public.track_api_usage(
  p_user_id UUID,
  p_api_credential_id UUID,
  p_project_id UUID,
  p_endpoint TEXT,
  p_method TEXT,
  p_tokens_used INTEGER DEFAULT 0,
  p_cost_amount DECIMAL DEFAULT 0.0000,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_status_code INTEGER DEFAULT 200
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.api_usage_tracking (
    user_id, api_credential_id, project_id, endpoint, method,
    tokens_used, cost_amount, response_time_ms, status_code
  ) VALUES (
    p_user_id, p_api_credential_id, p_project_id, p_endpoint, p_method,
    p_tokens_used, p_cost_amount, p_response_time_ms, p_status_code
  );
  
  -- Update usage count on API credential
  UPDATE public.api_credentials 
  SET usage_count = usage_count + 1, last_used_at = now()
  WHERE id = p_api_credential_id;
END;
$$;

-- Create function to auto-create billing account
CREATE OR REPLACE FUNCTION public.create_billing_account_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.billing_accounts (user_id, billing_email, credits_balance)
  VALUES (NEW.id, NEW.email, 10.00); -- Give 10 free credits to start
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create billing account
CREATE TRIGGER on_auth_user_created_billing
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_billing_account_for_user();
