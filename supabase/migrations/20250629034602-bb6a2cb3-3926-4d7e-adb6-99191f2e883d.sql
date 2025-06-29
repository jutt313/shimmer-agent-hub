
-- Enhance developer_integrations table with additional required fields
ALTER TABLE public.developer_integrations 
ADD COLUMN app_logo_url TEXT,
ADD COLUMN privacy_policy_url TEXT,
ADD COLUMN terms_of_service_url TEXT,
ADD COLUMN homepage_url TEXT,
ADD COLUMN developer_email TEXT,
ADD COLUMN tool_description TEXT,
ADD COLUMN use_cases TEXT[],
ADD COLUMN supported_events JSONB DEFAULT '[]'::jsonb,
ADD COLUMN event_descriptions JSONB DEFAULT '{}'::jsonb;

-- Update user_api_tokens table with enhanced permissions
ALTER TABLE public.user_api_tokens 
ADD COLUMN token_description TEXT,
ADD COLUMN connection_purpose TEXT,
ADD COLUMN usage_count INTEGER DEFAULT 0,
ADD COLUMN last_usage_details JSONB;

-- Update permissions to include more granular options
-- The existing permissions jsonb will be expanded to include:
-- {"read": boolean, "write": boolean, "webhook": boolean, "notifications": boolean, "full_control": boolean, "platform_connections": boolean}

-- Create webhook events tracking table
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_description TEXT,
  webhook_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhook_events
CREATE POLICY "Users can view their own webhook events" 
  ON public.webhook_events 
  FOR SELECT 
  USING (
    automation_id IN (
      SELECT id FROM public.automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create webhook events for their automations" 
  ON public.webhook_events 
  FOR INSERT 
  WITH CHECK (
    automation_id IN (
      SELECT id FROM public.automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own webhook events" 
  ON public.webhook_events 
  FOR UPDATE 
  USING (
    automation_id IN (
      SELECT id FROM public.automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own webhook events" 
  ON public.webhook_events 
  FOR DELETE 
  USING (
    automation_id IN (
      SELECT id FROM public.automations WHERE user_id = auth.uid()
    )
  );

-- Add trigger for updating webhook_events timestamps
CREATE OR REPLACE FUNCTION public.update_webhook_events_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_webhook_events_updated_at
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webhook_events_timestamp();
