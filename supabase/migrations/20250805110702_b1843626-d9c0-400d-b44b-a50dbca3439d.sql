
-- Step 1: Drop old constraint (only checks automation_id + platform_name)
ALTER TABLE automation_platform_credentials 
DROP CONSTRAINT IF EXISTS automation_platform_credentials_automation_id_platform_name_key;

-- Step 2: Add new constraint (checks automation_id + platform_name + user_id)
ALTER TABLE automation_platform_credentials 
ADD CONSTRAINT automation_platform_credentials_automation_id_platform_name_user_id_key 
UNIQUE (automation_id, platform_name, user_id);
