-- Ensure RLS is enabled
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Policy for Admins to UPDATE requests (e.g. cancel them)
DROP POLICY IF EXISTS "Admins can update requests" ON public.requests;
CREATE POLICY "Admins can update requests" ON public.requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy for Admins to DELETE requests (if needed)
DROP POLICY IF EXISTS "Admins can delete requests" ON public.requests;
CREATE POLICY "Admins can delete requests" ON public.requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
