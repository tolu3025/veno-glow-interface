CREATE OR REPLACE FUNCTION public.collections_award_bonus_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.total_collected IS DISTINCT FROM OLD.total_collected
     AND public.collection_bonus_for_total(COALESCE(NEW.total_collected, 0)) > COALESCE(NEW.bonus_paid, 0) THEN
    PERFORM public.award_collection_bonus(NEW.id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_collections_award_bonus ON public.collections;
CREATE TRIGGER trg_collections_award_bonus
AFTER UPDATE OF total_collected ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.collections_award_bonus_trigger();