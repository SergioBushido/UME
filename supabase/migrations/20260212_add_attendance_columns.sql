-- Add migration to ensure columns exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS balance_po integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_da integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_ap integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS section text DEFAULT '1er Peloton' CHECK (section IN ('1er Peloton', '2 Peloton'));

-- Ensure RLS allows Admin Update (Idempotent check)
-- This is just for reference as policies might already exist.
-- If you need to drop and recreate policies, do it here.
 DO $$
 BEGIN
     IF NOT EXISTS (
         SELECT 1
         FROM pg_policies
         WHERE policyname = 'Admins can update profiles'
     ) THEN
         CREATE POLICY "Admins can update profiles" ON public.profiles
           FOR UPDATE USING (
             EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
           );
     END IF;
 END
 $$;
