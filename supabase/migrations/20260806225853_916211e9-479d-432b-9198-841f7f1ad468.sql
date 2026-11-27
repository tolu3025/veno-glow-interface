-- ============================================================
-- Guarantee: no balance change escapes the ledger
-- ============================================================

CREATE OR REPLACE FUNCTION public.post_ledger_entry(
  _debit_user_id  UUID,
  _credit_user_id UUID,
  _amount_kobo    BIGINT,
  _purpose        TEXT,
  _reference      TEXT DEFAULT NULL,
  _metadata       JSONB DEFAULT '{}'::jsonb,
  _external_kind  public.ledger_account_kind DEFAULT 'external',
  _allow_overdraft BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group   UUID := gen_random_uuid();
  v_first   UUID;
  v_second  UUID;
  v_dw      public.wallets%ROWTYPE;
  v_cw      public.wallets%ROWTYPE;
BEGIN
  IF _amount_kobo IS NULL OR _amount_kobo <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be greater than zero');
  END IF;
  IF _debit_user_id IS NULL AND _credit_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'A posting needs at least one internal wallet');
  END IF;

  PERFORM set_config('kukapay.posting_engine', '1', true);

  IF _debit_user_id IS NOT NULL AND _credit_user_id IS NOT NULL THEN
    v_first  := LEAST(_debit_user_id, _credit_user_id);
    v_second := GREATEST(_debit_user_id, _credit_user_id);
    PERFORM 1 FROM public.wallets WHERE user_id = v_first FOR UPDATE;
    PERFORM 1 FROM public.wallets WHERE user_id = v_second FOR UPDATE;
  END IF;

  IF _debit_user_id IS NOT NULL THEN
    SELECT * INTO v_dw FROM public.wallets WHERE user_id = _debit_user_id FOR UPDATE;
    IF NOT FOUND THEN
      PERFORM set_config('kukapay.posting_engine', '0', true);
      RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
    END IF;
    IF NOT _allow_overdraft AND (v_dw.ledger_balance_kobo - v_dw.hold_balance_kobo) < _amount_kobo THEN
      PERFORM set_config('kukapay.posting_engine', '0', true);
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
  END IF;

  IF _credit_user_id IS NOT NULL THEN
    SELECT * INTO v_cw FROM public.wallets WHERE user_id = _credit_user_id FOR UPDATE;
    IF NOT FOUND THEN
      PERFORM set_config('kukapay.posting_engine', '0', true);
      RETURN jsonb_build_object('success', false, 'error', 'Recipient wallet not found');
    END IF;
  END IF;

  IF _debit_user_id IS NOT NULL THEN
    UPDATE public.wallets
      SET ledger_balance_kobo = ledger_balance_kobo - _amount_kobo, updated_at = now()
      WHERE user_id = _debit_user_id RETURNING * INTO v_dw;
    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, wallet_id, user_id, direction, amount_kobo,
       balance_after_kobo, purpose, reference, metadata)
    VALUES (v_group, 'user_wallet', v_dw.id, _debit_user_id, 'debit', _amount_kobo,
       v_dw.ledger_balance_kobo, _purpose, _reference, _metadata);
  ELSE
    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, direction, amount_kobo, purpose, reference, metadata)
    VALUES (v_group, _external_kind, 'debit', _amount_kobo, _purpose, _reference, _metadata);
  END IF;

  IF _credit_user_id IS NOT NULL THEN
    UPDATE public.wallets
      SET ledger_balance_kobo = ledger_balance_kobo + _amount_kobo, updated_at = now()
      WHERE user_id = _credit_user_id RETURNING * INTO v_cw;
    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, wallet_id, user_id, direction, amount_kobo,
       balance_after_kobo, purpose, reference, metadata)
    VALUES (v_group, 'user_wallet', v_cw.id, _credit_user_id, 'credit', _amount_kobo,
       v_cw.ledger_balance_kobo, _purpose, _reference, _metadata);
  ELSE
    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, direction, amount_kobo, purpose, reference, metadata)
    VALUES (v_group, _external_kind, 'credit', _amount_kobo, _purpose, _reference, _metadata);
  END IF;

  PERFORM set_config('kukapay.posting_engine', '0', true);

  RETURN jsonb_build_object(
    'success', true,
    'entry_group_id', v_group,
    'debit_balance_kobo', v_dw.ledger_balance_kobo,
    'credit_balance_kobo', v_cw.ledger_balance_kobo
  );
END;
$$;

REVOKE ALL ON FUNCTION public.post_ledger_entry(UUID, UUID, BIGINT, TEXT, TEXT, JSONB, public.ledger_account_kind, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_ledger_entry(UUID, UUID, BIGINT, TEXT, TEXT, JSONB, public.ledger_account_kind, BOOLEAN) TO service_role;

-- Safety net: legacy functions that still write balances directly get ledgered automatically.
CREATE OR REPLACE FUNCTION public.autoledger_wallet_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_delta BIGINT;
BEGIN
  IF current_setting('kukapay.posting_engine', true) = '1' THEN
    RETURN NULL;
  END IF;

  v_delta := NEW.ledger_balance_kobo - OLD.ledger_balance_kobo;
  IF v_delta = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.wallet_ledger
    (entry_group_id, account_kind, wallet_id, user_id, direction, amount_kobo,
     balance_after_kobo, purpose, reference, metadata)
  VALUES (
    gen_random_uuid(), 'user_wallet', NEW.id, NEW.user_id,
    CASE WHEN v_delta > 0 THEN 'credit'::public.ledger_direction ELSE 'debit'::public.ledger_direction END,
    ABS(v_delta), NEW.ledger_balance_kobo, 'legacy_balance_change', NULL,
    jsonb_build_object('auto', true)
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_autoledger_wallet ON public.wallets;
CREATE TRIGGER trg_autoledger_wallet
AFTER UPDATE OF ledger_balance_kobo ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.autoledger_wallet_change();

-- ============================================================
-- Migrate the two highest-volume flows onto the engine
-- ============================================================

CREATE OR REPLACE FUNCTION public.safe_credit(_user_id uuid, _amount numeric, _reference text, _event_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee numeric;
  v_net numeric;
  v_net_kobo bigint;
  v_post jsonb;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('status','failed','reason','invalid_amount');
  END IF;

  v_fee := LEAST(_amount * 0.02, 2000);
  v_net := ROUND(_amount - v_fee, 2);
  v_net_kobo := ROUND(v_net * 100)::bigint;

  IF EXISTS (SELECT 1 FROM webhook_events WHERE event_id = _event_id AND processed = true) THEN
    RETURN jsonb_build_object('status','duplicate','message','Event already processed');
  END IF;
  IF EXISTS (SELECT 1 FROM transactions WHERE reference = _reference AND type = 'deposit' AND status = 'completed') THEN
    RETURN jsonb_build_object('status','duplicate','message','Reference already credited');
  END IF;

  INSERT INTO public.idempotency_keys (user_id, operation, idem_key, status)
  VALUES (_user_id, 'deposit', COALESCE(_event_id, _reference), 'in_progress')
  ON CONFLICT (operation, idem_key) DO NOTHING;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','duplicate','message','Deposit already being processed');
  END IF;

  v_post := public.post_ledger_entry(
    NULL, _user_id, v_net_kobo, 'deposit', _reference,
    jsonb_build_object('provider','flutterwave','event_id',_event_id,'gross_amount',_amount,'fee',v_fee)
  );

  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('status','failed','reason', v_post->>'error');
  END IF;

  INSERT INTO transactions (user_id, type, amount, fee_amount, fee_reason, status, reference, metadata)
  VALUES (
    _user_id, 'deposit', v_net, v_fee,
    'Bank transfer fee (Flutterwave 2%, capped at ₦2,000)',
    'completed', _reference,
    jsonb_build_object('provider','flutterwave','event_id',_event_id,'gross_amount',_amount,
                       'net_credited',v_net,'entry_group_id', v_post->>'entry_group_id')
  );

  INSERT INTO webhook_events (provider, event_id, processed, signature_valid, payload)
  VALUES ('flutterwave', _event_id, true, true,
    jsonb_build_object('reference', _reference, 'gross', _amount, 'fee', v_fee, 'net', v_net))
  ON CONFLICT (event_id) DO UPDATE SET processed = true;

  UPDATE public.idempotency_keys
    SET status = 'completed', response = v_post, entry_group_id = (v_post->>'entry_group_id')::uuid, updated_at = now()
    WHERE operation = 'deposit' AND idem_key = COALESCE(_event_id, _reference);

  PERFORM public.publish_event('wallet.credited', _user_id,
    jsonb_build_object('reference', _reference, 'amount', v_net));

  RETURN jsonb_build_object('status','success','reference',_reference,'gross_amount',_amount,
                            'fee',v_fee,'net_credited',v_net);
END;
$$;

REVOKE ALL ON FUNCTION public.safe_credit(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.safe_credit(uuid, numeric, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.execute_p2p_transfer(p_sender_id uuid, p_recipient_id uuid, p_amount numeric, p_note text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference text;
  v_kobo bigint;
  v_post jsonb;
  v_vel jsonb;
BEGIN
  v_reference := 'P2P-' || gen_random_uuid()::text;

  IF p_sender_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Enter a valid amount');
  END IF;

  v_kobo := ROUND(p_amount * 100)::bigint;

  v_vel := public.bump_velocity(p_sender_id, v_kobo);
  IF NOT (v_vel->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_vel->>'error');
  END IF;

  v_post := public.post_ledger_entry(
    p_sender_id, p_recipient_id, v_kobo, 'p2p_transfer', v_reference,
    jsonb_build_object('note', COALESCE(p_note, ''))
  );

  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
  END IF;

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_sender_id, 'p2p_transfer', p_amount, 'completed', v_reference,
    jsonb_build_object('direction','debit','counterparty_id',p_recipient_id,'note',COALESCE(p_note,''),
                       'entry_group_id', v_post->>'entry_group_id'));

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_recipient_id, 'p2p_transfer', p_amount, 'completed', v_reference,
    jsonb_build_object('direction','credit','counterparty_id',p_sender_id,'note',COALESCE(p_note,''),
                       'entry_group_id', v_post->>'entry_group_id'));

  PERFORM public.publish_event('p2p.completed', p_sender_id,
    jsonb_build_object('reference', v_reference, 'amount', p_amount, 'recipient', p_recipient_id));

  RETURN jsonb_build_object('success', true, 'reference', v_reference,
    'new_balance', ROUND(((v_post->>'debit_balance_kobo')::bigint)::numeric / 100, 2));
END;
$$;

REVOKE ALL ON FUNCTION public.execute_p2p_transfer(uuid, uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_p2p_transfer(uuid, uuid, numeric, text) TO service_role;