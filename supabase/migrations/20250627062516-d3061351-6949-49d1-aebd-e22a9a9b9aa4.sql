
-- Add automation_diagram_data column to store AI-generated diagram data
ALTER TABLE public.automations
ADD COLUMN automation_diagram_data JSONB NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.automations.automation_diagram_data IS 'AI-generated React Flow nodes and edges for visualizing the automation blueprint';

-- Create an index on the automation_diagram_data column for better query performance
CREATE INDEX idx_automations_diagram_data ON public.automations USING gin (automation_diagram_data);
