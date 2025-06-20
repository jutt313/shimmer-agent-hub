
-- Add new columns to ai_agents table for LLM configuration
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS llm_provider text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS api_key text;
