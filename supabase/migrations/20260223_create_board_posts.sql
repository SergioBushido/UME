-- Create board_posts table
CREATE TABLE public.board_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_id uuid REFERENCES public.board_posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can view posts
CREATE POLICY "Anyone can view board posts" ON public.board_posts
  FOR SELECT USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON public.board_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts (or admins)
CREATE POLICY "Users can delete own posts" ON public.board_posts
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes for performance
CREATE INDEX idx_board_posts_parent_id ON public.board_posts(parent_id);
CREATE INDEX idx_board_posts_created_at ON public.board_posts(created_at DESC);
