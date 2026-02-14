-- Clean duplicate requests that have identical (user_id, start_date, end_date).
-- Strategy:
-- 1) Keep the most recently created row per identical tuple and delete the rest.
-- 2) Wrap in a transaction so you can rollback if needed.
-- IMPORTANT: Run `preview_duplicate_requests.sql` first and backup your DB.

BEGIN;

WITH duplicates AS (
  SELECT
    user_id,
    start_date,
    end_date,
    array_agg(id ORDER BY created_at DESC) AS ids_desc,
    COUNT(*) AS cnt
  FROM public.requests
  WHERE status <> 'cancelled'
  GROUP BY user_id, start_date, end_date
  HAVING COUNT(*) > 1
)
, to_delete AS (
  SELECT unnest(ids_desc[2:])::uuid AS id_to_delete FROM duplicates
)
DELETE FROM public.requests r
USING to_delete t
WHERE r.id = t.id_to_delete;

COMMIT;

-- After running this, you may want to run `scripts/sync_approved_counts.sql` to recompute daily counters.
