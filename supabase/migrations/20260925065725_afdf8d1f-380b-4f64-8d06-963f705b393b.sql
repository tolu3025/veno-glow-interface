ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS bonus_paid numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.collection_bonus_for_total(_total numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _total >= 1000000 THEN 10000
    WHEN _total >= 500000 THEN 3500
    WHEN _total >= 250000 THEN 1500
    WHEN _total >= 100000 THEN 500
    ELSE 0
  END::numeric;
$$;

CREATE OR REPLACE FUNCTION public.award_collection_bonus(_collection_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_col collections%ROWTYPE;
  v_tier numeric;
  v_delta numeric;
  v_wallet_id uuid;
BEGIN
  SELECT * INTO v_col FROM collections WHERE id = _collection_id FOR UPDATE;
  IF v_col.id IS NULL THEN
    RETURN jsonb_build_object('awarded', 0, 'reason', 'collection_not_found');
  END IF;

  v_tier := public.collection_bonus_for_total(COALESCE(v_col.total_collected, 0));
  v_delta := v_tier - COALESCE(v_col.bonus_paid, 0);
  IF v_delta <= 0 THEN
    RETURN jsonb_build_object('awarded', 0, 'tier', v_tier);
  END IF;

  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_col.creator_id;
  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object('awarded', 0, 'reason', 'wallet_not_found');
  END IF;

  PERFORM public.credit_wallet(v_wallet_id, v_delta);

  UPDATE collections SET bonus_paid = v_tier WHERE id = _collection_id;

  INSERT INTO transactions (user_id, type, amount, fee_amount, status, reference, metadata)
  VALUES (
    v_col.creator_id,
    'deposit',
    v_delta,
    0,
    'completed',
    'BONUS-' || replace(_collection_id::text, '-', '') || '-' || v_tier::bigint,
    jsonb_build_object(
      'kind', 'collection_bonus',
      'collection_id', v_col.id,
      'collection_title', v_col.title,
      'tier_total', v_tier,
      'total_collected', v_col.total_collected
    )
  );

  PERFORM public.create_notification(
    v_col.creator_id,
    'Collection bonus unlocked!',
    'You earned a ' || to_char(v_delta, 'FM999,999,990') || ' Naira bonus on "' || v_col.title || '". It is already in your wallet.',
    'success'
  );

  RETURN jsonb_build_object('awarded', v_delta, 'tier', v_tier);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('awarded', 0, 'reason', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_collection_bonus(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.collection_bonus_for_total(numeric) TO anon, authenticated, service_role;