
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admins can manage AI section configurations" ON public.ai_section_configurations;

-- Create a new policy that uses auth.uid() and auth.jwt() instead of querying auth.users directly
CREATE POLICY "Admins can manage AI section configurations" 
  ON public.ai_section_configurations 
  FOR ALL 
  USING (
    auth.uid() IS NOT NULL 
    AND (
      auth.jwt() ->> 'email' IN ('chaffanjutt313@gmail.com', 'admin@yusrai.com', 'support@yusrai.com')
      OR 
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.email IN ('chaffanjutt313@gmail.com', 'admin@yusrai.com', 'support@yusrai.com')
      )
    )
  );
