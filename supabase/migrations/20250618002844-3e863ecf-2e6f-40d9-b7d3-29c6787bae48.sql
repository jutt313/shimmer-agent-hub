
-- Drop the existing foreign key constraint that references the wrong users table
ALTER TABLE public.automations DROP CONSTRAINT IF EXISTS automations_user_id_fkey;

-- Update the user_id column to reference auth.users instead of public.users
ALTER TABLE public.automations 
ADD CONSTRAINT automations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to use auth.uid() instead of user_id matching
DROP POLICY IF EXISTS "Users can view their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can create their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can update their own automations" ON public.automations;
DROP POLICY IF EXISTS "Users can delete their own automations" ON public.automations;

CREATE POLICY "Users can view their own automations"
  ON public.automations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automations"
  ON public.automations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations"
  ON public.automations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations"
  ON public.automations FOR DELETE
  USING (auth.uid() = user_id);

-- Also fix the automation_chats RLS policies
DROP POLICY IF EXISTS "Users can view chats for their automations" ON public.automation_chats;
DROP POLICY IF EXISTS "Users can create chats for their automations" ON public.automation_chats;

CREATE POLICY "Users can view chats for their automations"
  ON public.automation_chats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_chats.automation_id 
    AND automations.user_id = auth.uid()
  ));

CREATE POLICY "Users can create chats for their automations"
  ON public.automation_chats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.automations 
    WHERE automations.id = automation_chats.automation_id 
    AND automations.user_id = auth.uid()
  ));
