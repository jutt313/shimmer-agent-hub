-- Force remove the foreign key constraint completely
ALTER TABLE public.platform_credentials 
DROP CONSTRAINT IF EXISTS platform_credentials_user_id_fkey CASCADE;

-- Also remove any other constraints that might be interfering
ALTER TABLE public.platform_credentials 
DROP CONSTRAINT IF EXISTS fk_platform_credentials_user CASCADE;

-- Double check there are no more foreign key constraints on this table
DO $$
DECLARE
    constraint_record record;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'platform_credentials' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE public.platform_credentials DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name || ' CASCADE';
    END LOOP;
END $$;