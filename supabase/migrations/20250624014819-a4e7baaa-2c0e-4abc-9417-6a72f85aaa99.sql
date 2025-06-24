
-- Fix RLS policies for universal_knowledge_store to allow authenticated users to insert
DROP POLICY IF EXISTS "Service role can manage knowledge" ON public.universal_knowledge_store;

-- Create new policies that allow authenticated users to manage their own knowledge
CREATE POLICY "Authenticated users can insert knowledge" ON public.universal_knowledge_store
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update knowledge" ON public.universal_knowledge_store
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete knowledge" ON public.universal_knowledge_store
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Keep the existing read policy
-- CREATE POLICY "Anyone can read knowledge" ON public.universal_knowledge_store
--   FOR SELECT USING (true);
