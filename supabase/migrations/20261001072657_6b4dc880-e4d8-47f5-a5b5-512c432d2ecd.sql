ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS bonus_pending numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_status text NOT NULL DEFAULT 'none';

DROP TRIGGER IF EXISTS trg_collections_award_bonus ON public.collections;

CREATE OR REPLACE FUNCTION public.release_collection_bonus(_collection_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_col collections%ROWTYPE; v_wallet uuid;
BEGIN
  SELECT * INTO v_col FROM collections WHERE id=_collection_id FOR UPDATE;
  IF v_col.bonus_status <> 'pending' OR v_col.bonus_pending <= 0 THEN RETURN 0; END IF;
  SELECT id INTO v_wallet FROM wallets WHERE user_id=v_col.creator_id;
  IF v_wallet IS NULL THEN RETURN 0; END IF;
  PERFORM public.credit_wallet(v_wallet, v_col.bonus_pending);
  UPDATE collections SET bonus_status='credited', bonus_paid=COALESCE(bonus_paid,0)+v_col.bonus_pending WHERE id=_collection_id;
  INSERT INTO transactions (user_id,type,amount,fee_amount,status,reference,metadata)
  VALUES (v_col.creator_id,'deposit',v_col.bonus_pending,0,'completed',
    'BONUS-'||replace(_collection_id::text,'-',''),
    jsonb_build_object('kind','collection_bonus','collection_id',v_col.id,'collection_title',v_col.title,'total_collected',v_col.total_collected))
  ON CONFLICT DO NOTHING;
  PERFORM public.create_notification(v_col.creator_id,'Collection bonus credited!',
    'Your '||to_char(v_col.bonus_pending,'FM999,999,990')||' Naira bonus from "'||v_col.title||'" is now in your wallet. Keep the streak going!','success');
  RETURN v_col.bonus_pending;
END $$;

CREATE OR REPLACE FUNCTION public.collections_award_bonus_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_tier numeric; r record;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    v_tier := public.collection_bonus_for_total(COALESCE(NEW.total_collected,0));
    IF v_tier > 0 THEN
      -- this qualifying completion unlocks every earlier pending bonus
      FOR r IN SELECT id FROM collections WHERE creator_id=NEW.creator_id AND id<>NEW.id AND bonus_status='pending' LOOP
        PERFORM public.release_collection_bonus(r.id);
      END LOOP;
      IF NEW.bonus_status = 'none' AND COALESCE(NEW.bonus_paid,0) = 0 THEN
        UPDATE collections SET bonus_pending=v_tier, bonus_status='pending' WHERE id=NEW.id;
        PERFORM public.create_notification(NEW.creator_id,'Bonus waiting for you',
          'You earned a '||to_char(v_tier,'FM999,999,990')||' Naira bonus on "'||NEW.title||'". Complete another collection of 100,000 Naira or more to unlock it.','info');
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_collections_award_bonus AFTER UPDATE OF status ON public.collections
FOR EACH ROW EXECUTE FUNCTION public.collections_award_bonus_trigger();

REVOKE EXECUTE ON FUNCTION public.release_collection_bonus(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.collections_award_bonus_trigger() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.kyc_max_balance(_user_id uuid)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE LEAST(3, GREATEST(0, COALESCE(kyc_level,0)))
    WHEN 1 THEN 50000 WHEN 2 THEN 200000 WHEN 3 THEN 20000000 ELSE 0 END
  FROM profiles WHERE id=_user_id
$$;

CREATE OR REPLACE FUNCTION public.execute_p2p_transfer(p_sender_id uuid, p_recipient_id uuid, p_amount numeric, p_note text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_reference text; v_kobo bigint; v_post jsonb; v_vel jsonb; v_max numeric; v_bal numeric;
BEGIN
  v_reference := 'P2P-' || gen_random_uuid()::text;
  IF p_sender_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enter a valid amount');
  END IF;

  v_max := COALESCE(public.kyc_max_balance(p_recipient_id), 0);
  SELECT COALESCE(balance,0) INTO v_bal FROM wallets WHERE user_id = p_recipient_id;
  IF COALESCE(v_bal,0) + p_amount > v_max THEN
    RETURN jsonb_build_object('success', false, 'error',
      CASE WHEN v_max = 0 THEN 'This recipient has not completed KYC and cannot receive money yet.'
      ELSE 'This transfer would take the recipient over their KYC balance limit of ₦' || to_char(v_max,'FM999,999,990')
        || '. They can receive up to ₦' || to_char(GREATEST(0, v_max - COALESCE(v_bal,0)),'FM999,999,990.00') || ' right now.' END);
  END IF;

  v_kobo := ROUND(p_amount * 100)::bigint;
  v_vel := public.bump_velocity(p_sender_id, v_kobo);
  IF NOT (v_vel->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_vel->>'error');
  END IF;

  v_post := public.post_ledger_entry(p_sender_id, p_recipient_id, v_kobo, 'p2p_transfer', v_reference,
    jsonb_build_object('note', COALESCE(p_note, '')));
  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
  END IF;

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_sender_id, 'p2p_transfer', p_amount, 'completed', v_reference,
    jsonb_build_object('direction','debit','counterparty_id',p_recipient_id,'note',COALESCE(p_note,''),'entry_group_id', v_post->>'entry_group_id'));
  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_recipient_id, 'p2p_transfer', p_amount, 'completed', v_reference,
    jsonb_build_object('direction','credit','counterparty_id',p_sender_id,'note',COALESCE(p_note,''),'entry_group_id', v_post->>'entry_group_id'));

  PERFORM public.publish_event('p2p.completed', p_sender_id,
    jsonb_build_object('reference', v_reference, 'amount', p_amount, 'recipient', p_recipient_id));

  RETURN jsonb_build_object('success', true, 'reference', v_reference,
    'new_balance', ROUND(((v_post->>'debit_balance_kobo')::bigint)::numeric / 100, 2));
END;
$function$;