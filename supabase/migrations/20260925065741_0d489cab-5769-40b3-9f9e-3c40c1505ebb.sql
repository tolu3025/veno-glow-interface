CREATE OR REPLACE FUNCTION public.collection_bonus_for_total(_total numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _total >= 1000000 THEN 10000
    WHEN _total >= 500000 THEN 3500
    WHEN _total >= 250000 THEN 1500
    WHEN _total >= 100000 THEN 500
    ELSE 0
  END::numeric;
$$;

REVOKE EXECUTE ON FUNCTION public.award_collection_bonus(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_collection_bonus(uuid) TO service_role;