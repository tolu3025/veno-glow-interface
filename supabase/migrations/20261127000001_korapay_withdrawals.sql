-- Phase 5: Korapay withdrawal RPCs (mirrors begin/finish_monnify_withdrawal)
-- Provider column already widened to include 'korapay' in the Phase 2 migration.

CREATE OR REPLACE FUNCTION public.begin_korapay_withdrawal(
  _user_id         uuid,
  _reference       text,
  _idempotency_key text,
  _bank_name       text,
  _bank_code       text,
  _account_number  text,
  _account_name    text,
  _amount_kobo     bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile       public.profiles%ROWTYPE;
  v_existing      public.withdrawals%ROWTYPE;
  v_fee_kobo      bigint;
  v_total_kobo    bigint;
  v_daily_limit_kobo bigint;
  v_used_today    numeric;
  v_day_start     timestamptz;
  v_post          jsonb;
  v_withdrawal_id uuid;
BEGIN
  IF _amount_kobo IS NULL OR _amount_kobo < 100000 OR _amount_kobo > 100000000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;
  IF length(_reference) NOT BETWEEN 12 AND 100 OR length(_idempotency_key) NOT BETWEEN 8 AND 80
     OR length(_bank_name) NOT BETWEEN 1 AND 120 OR length(_bank_code) NOT BETWEEN 2 AND 12
     OR _account_number !~ '^[0-9]{10}$' OR length(_account_name) NOT BETWEEN 2 AND 160 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_details');
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND OR v_profile.is_suspended THEN
    RETURN jsonb_build_object('success', false, 'error', 'account_unavailable');
  END IF;
  IF v_profile.kyc_level < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'kyc_required');
  END IF;

  -- Idempotency: return existing record if reference or idempotency key already seen.
  SELECT * INTO v_existing FROM public.withdrawals
    WHERE reference = _reference OR idempotency_key = _idempotency_key
    ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF FOUND THEN
    IF v_existing.user_id <> _user_id OR v_existing.provider <> 'korapay'
       OR COALESCE(v_existing.amount_kobo, ROUND(v_existing.amount * 100)::bigint) <> _amount_kobo
       OR v_existing.account_number <> _account_number OR v_existing.account_name <> _account_name
       OR v_existing.bank_code IS DISTINCT FROM _bank_code THEN
      RETURN jsonb_build_object('success', false, 'error', 'idempotency_conflict');
    END IF;
    RETURN jsonb_build_object(
      'success', true, 'idempotent', true, 'withdrawal_id', v_existing.id,
      'reference', v_existing.reference, 'withdrawal_status', v_existing.status,
      'provider_attempted_at', v_existing.provider_attempted_at,
      'amount_kobo', COALESCE(v_existing.amount_kobo, ROUND(v_existing.amount * 100)::bigint),
      'fee_kobo', COALESCE(v_existing.fee_amount_kobo, ROUND(v_existing.fee_amount * 100)::bigint),
      'total_debit_kobo',
        COALESCE(v_existing.amount_kobo, ROUND(v_existing.amount * 100)::bigint)
        + COALESCE(v_existing.fee_amount_kobo, ROUND(v_existing.fee_amount * 100)::bigint)
    );
  END IF;

  -- Fee schedule (same as Monnify): ₦15 / ₦35 / 2%+₦50 capped ₦1,500
  IF _amount_kobo <= 300000 THEN
    v_fee_kobo := 1500;
  ELSIF _amount_kobo < 1000000 THEN
    v_fee_kobo := 3500;
  ELSE
    v_fee_kobo := LEAST(150000, ROUND(_amount_kobo * 0.02)::bigint + 5000);
  END IF;
  v_total_kobo := _amount_kobo + v_fee_kobo;

  -- Daily limit per KYC tier
  v_daily_limit_kobo := CASE v_profile.kyc_level
    WHEN 1 THEN 2000000
    WHEN 2 THEN 15000000
    ELSE 1000000000
  END;
  v_day_start := date_trunc('day', now() AT TIME ZONE 'Africa/Lagos') AT TIME ZONE 'Africa/Lagos';
  SELECT COALESCE(SUM(COALESCE(amount_kobo, ROUND(amount * 100)::bigint)), 0)
    INTO v_used_today
    FROM public.withdrawals
    WHERE user_id = _user_id
      AND status IN ('pending', 'processing', 'completed')
      AND created_at >= v_day_start;
  IF v_used_today + _amount_kobo > v_daily_limit_kobo THEN
    RETURN jsonb_build_object(
      'success', false, 'error', 'daily_limit',
      'daily_limit_kobo', v_daily_limit_kobo,
      'remaining_kobo', GREATEST(0, v_daily_limit_kobo - v_used_today)
    );
  END IF;

  -- Atomic ledger debit before touching Korapay.
  v_post := public.post_ledger_entry(
    _user_id, NULL, v_total_kobo, 'withdrawal', _reference,
    jsonb_build_object('provider', 'korapay', 'amount_kobo', _amount_kobo, 'fee_kobo', v_fee_kobo)
  );
  IF NOT COALESCE((v_post->>'success')::boolean, false) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', CASE WHEN v_post->>'error' = 'Insufficient balance'
                    THEN 'insufficient_balance' ELSE 'wallet_unavailable' END,
      'total_debit_kobo', v_total_kobo,
      'fee_kobo', v_fee_kobo
    );
  END IF;

  INSERT INTO public.withdrawals(
    user_id, amount, bank_name, bank_code, account_number, account_name,
    status, reference, idempotency_key, amount_kobo, fee_amount_kobo, net_amount_kobo,
    fee_amount, fee_reason, is_instant, debit_mode, fee_model, provider, provider_status
  ) VALUES (
    _user_id, _amount_kobo::numeric / 100, _bank_name, _bank_code, _account_number, _account_name,
    'pending', _reference, _idempotency_key, _amount_kobo, v_fee_kobo, _amount_kobo,
    v_fee_kobo::numeric / 100, 'Transfer fee', false, 'direct', 'on_top', 'korapay', 'INITIATING'
  ) RETURNING id INTO v_withdrawal_id;

  INSERT INTO public.transactions(
    user_id, type, amount, fee_amount, fee_reason, status, reference, metadata
  ) VALUES (
    _user_id, 'withdrawal', v_total_kobo::numeric / 100, v_fee_kobo::numeric / 100,
    'Transfer fee', 'pending', _reference,
    jsonb_build_object(
      'provider', 'korapay', 'bank_name', _bank_name, 'bank_code', _bank_code,
      'account_number', _account_number, 'account_name', _account_name,
      'net_payout', _amount_kobo::numeric / 100, 'total_debit', v_total_kobo::numeric / 100,
      'fee', v_fee_kobo::numeric / 100, 'fee_model', 'on_top',
      'entry_group_id', v_post->>'entry_group_id'
    )
  );

  RETURN jsonb_build_object(
    'success', true, 'idempotent', false, 'withdrawal_id', v_withdrawal_id,
    'reference', _reference, 'withdrawal_status', 'pending',
    'amount_kobo', _amount_kobo, 'fee_kobo', v_fee_kobo, 'total_debit_kobo', v_total_kobo
  );
END $$;
REVOKE ALL ON FUNCTION public.begin_korapay_withdrawal(uuid,text,text,text,text,text,text,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_korapay_withdrawal(uuid,text,text,text,text,text,text,bigint) TO service_role;

-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finish_korapay_withdrawal(
  _reference        text,
  _outcome          text,
  _provider_reference text,
  _provider_status  text,
  _failure_reason   text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_withdrawal public.withdrawals%ROWTYPE;
  v_total_kobo bigint;
  v_post       jsonb;
BEGIN
  IF _outcome NOT IN ('completed', 'refunded') THEN
    RAISE EXCEPTION 'Invalid withdrawal outcome';
  END IF;
  SELECT * INTO v_withdrawal FROM public.withdrawals
    WHERE reference = _reference AND provider = 'korapay' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Korapay withdrawal not found';
  END IF;
  IF v_withdrawal.status IN ('completed', 'refunded', 'failed', 'reversed') THEN
    RETURN jsonb_build_object('success', true, 'status', v_withdrawal.status, 'duplicate', true);
  END IF;

  IF _outcome = 'completed' THEN
    UPDATE public.withdrawals SET
      status = 'completed',
      provider_reference = COALESCE(_provider_reference, provider_reference),
      provider_status    = COALESCE(_provider_status, 'success'),
      failure_reason     = NULL,
      updated_at         = now()
      WHERE id = v_withdrawal.id;
    UPDATE public.transactions SET status = 'completed'
      WHERE reference = _reference AND user_id = v_withdrawal.user_id;
    PERFORM public.create_notification(
      v_withdrawal.user_id, 'Withdrawal Successful',
      'Your withdrawal of ₦' || trim(to_char(v_withdrawal.amount, 'FM999,999,999,990.00')) || ' has been sent to your bank.',
      'withdrawal', jsonb_build_object('reference', _reference, 'provider', 'korapay')
    );
    RETURN jsonb_build_object('success', true, 'status', 'completed');
  END IF;

  -- Refund path: return amount + fee exactly once.
  v_total_kobo := COALESCE(v_withdrawal.amount_kobo, ROUND(v_withdrawal.amount * 100)::bigint)
    + COALESCE(v_withdrawal.fee_amount_kobo, ROUND(v_withdrawal.fee_amount * 100)::bigint);
  v_post := public.post_ledger_entry(
    NULL, v_withdrawal.user_id, v_total_kobo, 'withdrawal_refund', _reference || '-REFUND',
    jsonb_build_object('provider', 'korapay', 'original_reference', _reference,
                       'reason', COALESCE(_failure_reason, 'Transfer rejected'))
  );
  IF NOT COALESCE((v_post->>'success')::boolean, false) THEN
    RAISE EXCEPTION 'Withdrawal refund failed: %', v_post->>'error';
  END IF;
  UPDATE public.withdrawals SET
    status             = 'refunded',
    provider_reference = COALESCE(_provider_reference, provider_reference),
    provider_status    = COALESCE(_provider_status, 'failed'),
    failure_reason     = _failure_reason,
    updated_at         = now()
    WHERE id = v_withdrawal.id;
  UPDATE public.transactions SET status = 'failed'
    WHERE reference = _reference AND user_id = v_withdrawal.user_id;
  PERFORM public.create_notification(
    v_withdrawal.user_id, 'Withdrawal Failed — Funds Returned',
    '₦' || trim(to_char(v_total_kobo::numeric / 100, 'FM999,999,999,990.00'))
      || ' has been returned to your wallet, including the transfer fee.',
    'withdrawal',
    jsonb_build_object('reference', _reference, 'provider', 'korapay', 'reason', _failure_reason)
  );
  RETURN jsonb_build_object('success', true, 'status', 'refunded');
END $$;
REVOKE ALL ON FUNCTION public.finish_korapay_withdrawal(text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_korapay_withdrawal(text,text,text,text,text) TO service_role;
