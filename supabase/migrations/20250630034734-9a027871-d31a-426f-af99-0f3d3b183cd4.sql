
-- Add missing fields to automation_webhooks table
ALTER TABLE automation_webhooks 
ADD COLUMN IF NOT EXISTS webhook_name text,
ADD COLUMN IF NOT EXISTS webhook_description text,
ADD COLUMN IF NOT EXISTS expected_events text[] DEFAULT '{}';

-- Update existing webhooks to have default names
UPDATE automation_webhooks 
SET webhook_name = 'Webhook ' || SUBSTRING(id::text, 1, 8)
WHERE webhook_name IS NULL;

-- Make webhook_name required going forward
ALTER TABLE automation_webhooks 
ALTER COLUMN webhook_name SET NOT NULL;
