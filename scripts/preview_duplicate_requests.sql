-- Preview duplicate requests that have identical user_id + start_date + end_date
-- Run this first to review affected rows before deleting anything.

SELECT
  user_id,
  start_date,
  end_date,
  COUNT(*) AS count,
  array_agg(id ORDER BY created_at) AS ids,
  array_agg(status ORDER BY created_at) AS statuses,
  array_agg(created_at ORDER BY created_at) AS created_at_list
FROM public.requests
WHERE status <> 'cancelled'
GROUP BY user_id, start_date, end_date
HAVING COUNT(*) > 1
ORDER BY count DESC;
