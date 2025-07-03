
-- Add missing columns to universal_knowledge_store table for platform knowledge
ALTER TABLE public.universal_knowledge_store 
ADD COLUMN IF NOT EXISTS platform_name TEXT,
ADD COLUMN IF NOT EXISTS credential_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS platform_description TEXT,
ADD COLUMN IF NOT EXISTS use_cases TEXT[] DEFAULT '{}';

-- Update existing platform knowledge entries to have proper platform_name
UPDATE public.universal_knowledge_store 
SET platform_name = COALESCE(
  details->>'platform_name',
  CASE 
    WHEN title LIKE '%Integration' THEN REPLACE(title, ' Integration', '')
    WHEN title LIKE '%Platform' THEN REPLACE(title, ' Platform', '')
    ELSE SPLIT_PART(title, ' ', 1)
  END
)
WHERE category = 'platform_knowledge' AND platform_name IS NULL;

-- Update credential_fields from details if they exist
UPDATE public.universal_knowledge_store 
SET credential_fields = COALESCE(details->'credential_fields', '[]'::jsonb)
WHERE category = 'platform_knowledge' AND credential_fields = '[]'::jsonb;

-- Update platform_description from details if it exists
UPDATE public.universal_knowledge_store 
SET platform_description = COALESCE(details->>'platform_description', summary)
WHERE category = 'platform_knowledge' AND platform_description IS NULL;

-- Update use_cases from details if they exist
UPDATE public.universal_knowledge_store 
SET use_cases = COALESCE(
  ARRAY(SELECT jsonb_array_elements_text(details->'use_cases')),
  ARRAY['automation', 'integration']
)
WHERE category = 'platform_knowledge' AND use_cases = '{}';
