
-- Create user subscriptions table to track user plans and limits
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'professional', 'business', 'enterprise', 'special')),
  monthly_price DECIMAL(10,2) NOT NULL,
  max_automations INTEGER NOT NULL,
  max_total_runs INTEGER NOT NULL,
  max_step_runs INTEGER NOT NULL,
  max_ai_agents INTEGER NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  special_offer_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create usage tracking table for real-time monitoring
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  total_runs_used INTEGER DEFAULT 0,
  step_runs_used INTEGER DEFAULT 0,
  active_automations_count INTEGER DEFAULT 0,
  active_ai_agents_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Create special offers tracking table
CREATE TABLE public.special_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_type TEXT NOT NULL DEFAULT 'special_59',
  shown_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
  ON public.user_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
  ON public.user_subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
  ON public.user_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for usage_tracking
CREATE POLICY "Users can view their own usage" 
  ON public.usage_tracking FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" 
  ON public.usage_tracking FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" 
  ON public.usage_tracking FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for special_offers
CREATE POLICY "Users can view their own special offers" 
  ON public.special_offers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own special offers" 
  ON public.special_offers FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own special offers" 
  ON public.special_offers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to initialize user subscription on signup
CREATE OR REPLACE FUNCTION public.initialize_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create 1-day free trial subscription (Professional plan features)
  INSERT INTO public.user_subscriptions (
    user_id, 
    plan_type, 
    monthly_price, 
    max_automations, 
    max_total_runs, 
    max_step_runs, 
    max_ai_agents,
    trial_ends_at
  ) VALUES (
    NEW.id,
    'professional',
    0.00,
    15,
    10000,
    5000,
    15,
    now() + INTERVAL '1 day'
  );

  -- Initialize usage tracking
  INSERT INTO public.usage_tracking (user_id) VALUES (NEW.id);

  -- Create special offer (24 hours after signup)
  INSERT INTO public.special_offers (
    user_id,
    offer_type,
    expires_at
  ) VALUES (
    NEW.id,
    'special_59',
    now() + INTERVAL '24 hours'
  );

  RETURN NEW;
END;
$$;

-- Create trigger to initialize subscription on user signup
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.initialize_user_subscription();

-- Create function to update usage tracking timestamp
CREATE OR REPLACE FUNCTION public.update_usage_tracking_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for usage tracking updates
CREATE TRIGGER update_usage_tracking_timestamp
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_usage_tracking_timestamp();

-- Create function to update subscription timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for subscription updates
CREATE TRIGGER update_subscription_timestamp
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_timestamp();
