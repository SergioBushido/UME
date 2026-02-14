-- Recompute daily_availability.approved_count by counting distinct user_id
-- for approved requests per date.
-- Backup `daily_availability` before running.

BEGIN;

-- Create a temp table with recomputed counts
CREATE TEMP TABLE tmp_approved_counts AS
SELECT
  date::date AS day,
  COUNT(DISTINCT user_id) AS approved_count
FROM public.requests
WHERE status = 'approved'
GROUP BY date::date;

-- Update existing rows in daily_availability
UPDATE public.daily_availability da
SET approved_count = COALESCE(t.approved_count, 0)
FROM tmp_approved_counts t
WHERE da.date = t.day;

-- For dates missing in daily_availability, insert rows (if desired)
INSERT INTO public.daily_availability (date, approved_count, created_at, updated_at)
SELECT t.day, t.approved_count, now(), now()
FROM tmp_approved_counts t
LEFT JOIN public.daily_availability da ON da.date = t.day
WHERE da.date IS NULL;

COMMIT;
