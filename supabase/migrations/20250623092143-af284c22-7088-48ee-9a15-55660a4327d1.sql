
-- Fix RLS policies for notifications table to ensure proper delete permissions
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Create a comprehensive delete policy
CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Also ensure the service role can delete notifications (for the edge function)
CREATE POLICY "Service role can delete notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (true);

-- Grant necessary permissions
GRANT DELETE ON public.notifications TO authenticated;
GRANT DELETE ON public.notifications TO service_role;
