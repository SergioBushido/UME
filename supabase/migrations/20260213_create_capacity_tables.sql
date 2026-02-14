-- Create staff_levels table
CREATE TABLE public.staff_levels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date date NOT NULL,
  end_date date, -- null means indefinite
  total_staff integer NOT NULL CHECK (total_staff > 0),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_overlap_staff EXCLUDE USING gist (
    daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]') WITH &&
  )
);

-- Create presence_rules table
CREATE TABLE public.presence_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date date NOT NULL,
  end_date date, -- null means indefinite
  min_presence_percent integer NOT NULL CHECK (min_presence_percent BETWEEN 0 AND 100),
  description text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_overlap_rules EXCLUDE USING gist (
    daterange(start_date, COALESCE(end_date, 'infinity'::date), '[]') WITH &&
  )
);

-- Create daily_availability table
CREATE TABLE public.daily_availability (
  date date PRIMARY KEY,
  total_staff integer NOT NULL,
  min_required integer NOT NULL,
  max_absence integer NOT NULL,
  approved_count integer DEFAULT 0,
  is_locked boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_availability ENABLE ROW LEVEL SECURITY;

-- Policies for staff_levels
CREATE POLICY "Admins can manage staff_levels" ON public.staff_levels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view staff_levels" ON public.staff_levels
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for presence_rules
CREATE POLICY "Admins can manage presence_rules" ON public.presence_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view presence_rules" ON public.presence_rules
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for daily_availability
CREATE POLICY "Admins can manage daily_availability" ON public.daily_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can view daily_availability" ON public.daily_availability
  FOR SELECT USING (auth.role() = 'authenticated');
