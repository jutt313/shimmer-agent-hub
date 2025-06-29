
-- Add missing columns for test/production environment support
ALTER TABLE public.developer_integrations 
ADD COLUMN environment text DEFAULT 'test' CHECK (environment IN ('test', 'production')),
ADD COLUMN test_client_id text,
ADD COLUMN test_client_secret text;

-- Update existing records to have test credentials
UPDATE public.developer_integrations 
SET 
  test_client_id = 'test_' || SUBSTRING(client_id, 1, 16),
  test_client_secret = 'test_secret_' || SUBSTRING(client_secret, 1, 32)
WHERE test_client_id IS NULL OR test_client_secret IS NULL;
