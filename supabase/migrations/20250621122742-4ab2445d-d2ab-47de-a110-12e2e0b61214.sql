
-- Create universal knowledge store table
CREATE TABLE public.universal_knowledge_store (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN (
    'platform_knowledge', 
    'credential_knowledge', 
    'workflow_patterns', 
    'agent_recommendations', 
    'error_solutions', 
    'automation_patterns',
    'conversation_insights',
    'summary_templates'
  )),
  title TEXT NOT NULL,
  summary TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  source_type TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for fast retrieval
CREATE INDEX idx_knowledge_category ON public.universal_knowledge_store(category);
CREATE INDEX idx_knowledge_tags ON public.universal_knowledge_store USING GIN(tags);
CREATE INDEX idx_knowledge_priority ON public.universal_knowledge_store(priority DESC);
CREATE INDEX idx_knowledge_usage ON public.universal_knowledge_store(usage_count DESC);
CREATE INDEX idx_knowledge_text_search ON public.universal_knowledge_store USING GIN(to_tsvector('english', title || ' ' || summary));

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_knowledge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
CREATE TRIGGER trigger_update_knowledge_timestamp
  BEFORE UPDATE ON public.universal_knowledge_store
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_timestamp();

-- Enable RLS
ALTER TABLE public.universal_knowledge_store ENABLE ROW LEVEL SECURITY;

-- Policy for reading knowledge (all authenticated users)
CREATE POLICY "Anyone can read knowledge" ON public.universal_knowledge_store
  FOR SELECT USING (true);

-- Policy for writing knowledge (service role only)
CREATE POLICY "Service role can manage knowledge" ON public.universal_knowledge_store
  FOR ALL USING (auth.role() = 'service_role');
