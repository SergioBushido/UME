-- Allow users to mark messages as read (receiver only)
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;

CREATE POLICY "Users can mark received messages as read" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
