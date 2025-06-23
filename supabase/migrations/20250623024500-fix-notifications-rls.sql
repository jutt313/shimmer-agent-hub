
-- Add missing INSERT policy for notifications
CREATE POLICY "Users can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add missing policy for the create-notification edge function
CREATE POLICY "Service role can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);
