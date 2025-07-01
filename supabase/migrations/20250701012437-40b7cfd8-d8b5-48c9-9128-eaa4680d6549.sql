
-- Step 1: Create a unified API credentials table
CREATE TABLE public.api_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_name TEXT NOT NULL,
  credential_description TEXT,
  credential_type TEXT NOT NULL DEFAULT 'personal', -- 'personal', 'developer', 'service'
  api_key TEXT NOT NULL,
  api_secret TEXT,
  permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false, "webhook": false, "notifications": false, "automations": false, "platform_connections": false}'::jsonb,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  allowed_origins TEXT[] DEFAULT '{}',
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 2: Enable RLS
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies
CREATE POLICY "Users can view their own credentials" 
  ON public.api_credentials 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credentials" 
  ON public.api_credentials 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" 
  ON public.api_credentials 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" 
  ON public.api_credentials 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Step 4: Create function to generate API keys
CREATE OR REPLACE FUNCTION public.generate_unified_api_key(key_type TEXT DEFAULT 'personal')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefix TEXT;
  key_body TEXT;
BEGIN
  -- Set prefix based on type
  CASE key_type
    WHEN 'personal' THEN prefix := 'YUSR_';
    WHEN 'developer' THEN prefix := 'YDEV_';
    WHEN 'service' THEN prefix := 'YSVC_';
    ELSE prefix := 'YUSR_';
  END CASE;
  
  -- Generate random key body
  key_body := encode(gen_random_bytes(32), 'hex');
  
  RETURN prefix || key_body;
END;
$$;

-- Step 5: Update api_usage_logs to reference new table
ALTER TABLE public.api_usage_logs 
DROP CONSTRAINT IF EXISTS api_usage_logs_api_token_id_fkey,
ADD COLUMN api_credential_id UUID REFERENCES public.api_credentials(id);

-- Step 6: Create function to validate unified API keys
CREATE OR REPLACE FUNCTION public.validate_unified_api_key(api_key TEXT)
RETURNS TABLE(
  user_id UUID, 
  credential_type TEXT, 
  permissions JSONB, 
  is_valid BOOLEAN,
  rate_limit_per_hour INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.user_id,
    ac.credential_type,
    ac.permissions,
    ac.is_active as is_valid,
    ac.rate_limit_per_hour
  FROM public.api_credentials ac
  WHERE ac.api_key = validate_unified_api_key.api_key;
END;
$$;

-- Step 7: Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_api_credentials_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_api_credentials_timestamp
  BEFORE UPDATE ON public.api_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_api_credentials_timestamp();
