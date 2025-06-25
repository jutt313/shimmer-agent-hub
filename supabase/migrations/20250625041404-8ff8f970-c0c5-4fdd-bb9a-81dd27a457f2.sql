
-- Create a table to store diagram layouts and positions
CREATE TABLE public.automation_diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  diagram_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(automation_id, user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.automation_diagrams ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own diagrams"
  ON public.automation_diagrams
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diagrams"
  ON public.automation_diagrams
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagrams"
  ON public.automation_diagrams
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagrams"
  ON public.automation_diagrams
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION public.update_diagram_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_automation_diagrams_timestamp
  BEFORE UPDATE ON public.automation_diagrams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_diagram_timestamp();
