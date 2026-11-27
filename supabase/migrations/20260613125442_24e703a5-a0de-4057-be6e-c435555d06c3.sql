
-- 1. Rewrite execute_p2p_transfer to keep available_balance in sync
CREATE OR REPLACE FUNCTION public.execute_p2p_transfer(p_sender_id uuid, p_recipient_id uuid, p_amount numeric, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_balance numeric;
  v_sender_available numeric;
  v_sender_wallet_id uuid;
  v_recipient_wallet_id uuid;
  v_reference text;
BEGIN
  v_reference := 'P2P-' || gen_random_uuid()::text;

  IF p_sender_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  SELECT id, balance, available_balance INTO v_sender_wallet_id, v_sender_balance, v_sender_available
  FROM wallets WHERE user_id = p_sender_id FOR UPDATE;

  IF v_sender_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  IF COALESCE(v_sender_available, v_sender_balance) < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  SELECT id INTO v_recipient_wallet_id
  FROM wallets WHERE user_id = p_recipient_id FOR UPDATE;

  IF v_recipient_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient wallet not found');
  END IF;

  UPDATE wallets SET balance = balance - p_amount,
                     available_balance = available_balance - p_amount,
                     updated_at = now()
   WHERE id = v_sender_wallet_id;

  UPDATE wallets SET balance = balance + p_amount,
                     available_balance = available_balance + p_amount,
                     updated_at = now()
   WHERE id = v_recipient_wallet_id;

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_sender_id, 'p2p_transfer', p_amount, 'completed', v_reference,
    jsonb_build_object('direction', 'debit', 'counterparty_id', p_recipient_id, 'note', COALESCE(p_note, '')));

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_recipient_id, 'p2p_transfer', p_amount, 'completed', v_reference,
    jsonb_build_object('direction', 'credit', 'counterparty_id', p_sender_id, 'note', COALESCE(p_note, '')));

  RETURN jsonb_build_object('success', true, 'reference', v_reference, 'new_balance', v_sender_balance - p_amount);
END;
$function$;

-- 2. Rewrite pay_collection_from_wallet: keep available_balance in sync; skip wallet legs on self-pay
CREATE OR REPLACE FUNCTION public.pay_collection_from_wallet(p_payer_id uuid, p_collection_id uuid, p_amount numeric, p_payer_name text, p_payer_matric text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_collection collections%ROWTYPE;
  v_payer_balance numeric;
  v_payer_available numeric;
  v_payer_wallet_id uuid;
  v_reference text;
  v_self_pay boolean;
BEGIN
  v_reference := 'COL-' || gen_random_uuid()::text;

  IF EXISTS (
    SELECT 1 FROM collection_payments
    WHERE collection_id = p_collection_id
      AND payer_matric_number = p_payer_matric
      AND status = 'confirmed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already paid for this collection');
  END IF;

  SELECT * INTO v_collection FROM collections WHERE id = p_collection_id FOR UPDATE;
  IF v_collection.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collection not found');
  END IF;
  IF v_collection.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collection is no longer active');
  END IF;

  v_self_pay := (v_collection.creator_id = p_payer_id);

  SELECT id, balance, available_balance INTO v_payer_wallet_id, v_payer_balance, v_payer_available
  FROM wallets WHERE user_id = p_payer_id FOR UPDATE;
  IF v_payer_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  IF NOT v_self_pay THEN
    IF COALESCE(v_payer_available, v_payer_balance) < p_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    UPDATE wallets SET balance = balance - p_amount,
                       available_balance = available_balance - p_amount,
                       updated_at = now()
     WHERE id = v_payer_wallet_id;

    UPDATE wallets SET balance = balance + p_amount,
                       available_balance = available_balance + p_amount,
                       updated_at = now()
     WHERE user_id = v_collection.creator_id;
  END IF;

  UPDATE collections SET
    total_collected = total_collected + p_amount,
    participant_count = participant_count + 1
  WHERE id = p_collection_id;

  INSERT INTO collection_payments (collection_id, amount, payer_name, payer_matric_number, status, transaction_reference, webhook_verified)
  VALUES (p_collection_id, p_amount, p_payer_name, p_payer_matric, 'confirmed', v_reference, true);

  IF v_self_pay THEN
    -- Single audit row, no money moved
    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (p_payer_id, 'collection_payment', p_amount, 'completed', v_reference,
      jsonb_build_object('direction', 'self_pay', 'self_pay', true,
                         'collection_id', p_collection_id,
                         'collection_title', v_collection.title,
                         'payer_name', p_payer_name));
  ELSE
    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (p_payer_id, 'collection_payment', p_amount, 'completed', v_reference,
      jsonb_build_object('direction', 'debit',
                         'collection_id', p_collection_id,
                         'collection_title', v_collection.title));

    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (v_collection.creator_id, 'collection_payment', p_amount, 'completed', v_reference,
      jsonb_build_object('direction', 'credit',
                         'collection_id', p_collection_id,
                         'payer_name', p_payer_name));
  END IF;

  RETURN jsonb_build_object('success', true, 'reference', v_reference, 'self_pay', v_self_pay);
END;
$function$;

-- 3. Backfill direction='debit' on legacy collection_payment payer rows
UPDATE public.transactions
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('direction', 'debit')
WHERE type = 'collection_payment'
  AND (metadata->>'direction') IS NULL;

-- 4. Tag historical self-pay pairs (same user, same time, same amount, opposite direction)
UPDATE public.transactions t
SET metadata = COALESCE(t.metadata, '{}'::jsonb) || jsonb_build_object('self_pay', true)
WHERE t.type = 'collection_payment'
  AND EXISTS (
    SELECT 1 FROM public.transactions t2
    WHERE t2.user_id = t.user_id
      AND t2.type = 'collection_payment'
      AND t2.created_at = t.created_at
      AND t2.amount = t.amount
      AND t2.id <> t.id
      AND (t2.metadata->>'direction') IS DISTINCT FROM (t.metadata->>'direction')
  );

-- 5. Recompute hold_balance and available_balance from outstanding withdrawals
UPDATE public.wallets w
SET hold_balance = COALESCE((
      SELECT SUM(amount + COALESCE(fee_amount, 0))
      FROM public.withdrawals
      WHERE user_id = w.user_id
        AND status IN ('pending','processing')
    ), 0),
    available_balance = w.balance - COALESCE((
      SELECT SUM(amount + COALESCE(fee_amount, 0))
      FROM public.withdrawals
      WHERE user_id = w.user_id
        AND status IN ('pending','processing')
    ), 0),
    updated_at = now();
