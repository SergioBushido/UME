-- Enable real-time for daily_availability
begin;
  -- Remove the table from publication if it exists to avoid errors on some setups
  -- but standard approach is just to add it.
  -- In Supabase, usually the publication is named 'supabase_realtime'
  alter publication supabase_realtime add table public.daily_availability;
commit;
