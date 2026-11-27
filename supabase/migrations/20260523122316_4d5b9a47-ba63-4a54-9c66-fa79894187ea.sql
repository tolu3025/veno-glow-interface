
-- Add fee tracking columns
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS fee_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_reason text;

ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS fee_reason text;

-- Add free-withdrawal counters to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_withdrawals_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_withdrawals_reset_at timestamptz NOT NULL DEFAULT date_trunc('month', now());

-- Backfill existing profiles so everyone starts fresh this month
UPDATE public.profiles
SET free_withdrawals_used = 0,
    free_withdrawals_reset_at = date_trunc('month', now())
WHERE free_withdrawals_reset_at IS NULL
   OR free_withdrawals_reset_at < date_trunc('month', now());

-- Replace safe_credit to net out Flutterwave's 2% fee (cap ₦2,000)
CREATE OR REPLACE FUNCTION public.safe_credit(
  _user_id uuid,
  _amount numeric,        -- gross amount user sent
  _reference text,
  _event_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_fee numeric;
  v_net numeric;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('status','failed','reason','invalid_amount');
  END IF;

  v_fee := LEAST(_amount * 0.02, 2000);
  v_net := _amount - v_fee;

  IF EXISTS (SELECT 1 FROM webhook_events WHERE event_id = _event_id AND processed = true) THEN
    RETURN jsonb_build_object('status','duplicate','message','Event already processed');
  END IF;
  IF EXISTS (SELECT 1 FROM transactions WHERE reference = _reference AND type = 'deposit' AND status = 'completed') THEN
    RETURN jsonb_build_object('status','duplicate','message','Reference already credited');
  END IF;

  SELECT * INTO v_wallet FROM wallets WHERE user_id = _user_id FOR UPDATE;
  IF v_wallet.id IS NULL THEN
    RETURN jsonb_build_object('status','failed','reason','wallet_not_found');
  END IF;

  UPDATE wallets
  SET balance = balance + v_net,
      available_balance = available_balance + v_net,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO transactions (user_id, type, amount, fee_amount, fee_reason, status, reference, metadata)
  VALUES (
    _user_id, 'deposit', v_net, v_fee,
    'Bank transfer fee (Flutterwave 2%, capped at ₦2,000)',
    'completed', _reference,
    jsonb_build_object('provider','flutterwave','event_id',_event_id,'gross_amount',_amount,'net_credited',v_net)
  );

  INSERT INTO webhook_events (provider, event_id, processed, signature_valid, payload)
  VALUES ('flutterwave', _event_id, true, true,
    jsonb_build_object('reference', _reference, 'gross', _amount, 'fee', v_fee, 'net', v_net))
  ON CONFLICT (event_id) DO UPDATE SET processed = true;

  RETURN jsonb_build_object(
    'status','success',
    'reference',_reference,
    'gross_amount',_amount,
    'fee',v_fee,
    'net_credited',v_net
  );
END;
$function$;

-- Helper: compute the withdrawal fee for a given user/amount/instant flag,
-- WITHOUT mutating state. Returns tiered fee, instant surcharge, free_remaining.
CREATE OR REPLACE FUNCTION public.preview_withdrawal_fee(
  _user_id uuid,
  _amount numeric,
  _is_instant boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_used integer;
  v_reset timestamptz;
  v_effective_used integer;
  v_tiered numeric := 0;
  v_instant numeric := 0;
  v_free_remaining integer;
BEGIN
  SELECT free_withdrawals_used, free_withdrawals_reset_at
    INTO v_used, v_reset
    FROM profiles WHERE id = _user_id;

  -- Treat reset month as 0 used
  v_effective_used := CASE
    WHEN v_reset IS NULL OR v_reset < date_trunc('month', now()) THEN 0
    ELSE COALESCE(v_used, 0)
  END;

  IF v_effective_used < 2 THEN
    v_tiered := 0;
  ELSIF _amount <= 10000 THEN
    v_tiered := 50;
  ELSIF _amount <= 50000 THEN
    v_tiered := 100;
  ELSE
    v_tiered := 200;
  END IF;

  IF _is_instant THEN
    v_instant := 100;
  END IF;

  v_free_remaining := GREATEST(0, 2 - v_effective_used);

  RETURN jsonb_build_object(
    'tiered_fee', v_tiered,
    'instant_surcharge', v_instant,
    'total_fee', v_tiered + v_instant,
    'free_remaining', v_free_remaining,
    'free_used', v_effective_used,
    'is_free_withdrawal', (v_tiered = 0 AND NOT _is_instant)
  );
END;
$function$;

-- Replace safe_withdrawal with free-tier + tiered fee + instant surcharge logic
CREATE OR REPLACE FUNCTION public.safe_withdrawal(
  _user_id uuid,
  _amount numeric,
  _reference text,
  _bank_account text,
  _bank_code text,
  _is_instant boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_single numeric;
  v_daily numeric;
  v_spent numeric;
  v_wallet wallets%ROWTYPE;
  v_kyc text;
  v_velocity int;
  v_used integer;
  v_reset timestamptz;
  v_effective_used integer;
  v_tiered numeric := 0;
  v_instant numeric := 0;
  v_total_fee numeric;
  v_net numeric;
  v_fee_reason text;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('status','failed','reason','invalid_amount');
  END IF;

  -- Existing guards
  SELECT max_amount INTO v_single FROM transaction_limits WHERE limit_type='single' AND is_active ORDER BY effective_date DESC LIMIT 1;
  SELECT max_amount INTO v_daily  FROM transaction_limits WHERE limit_type='daily'  AND is_active ORDER BY effective_date DESC LIMIT 1;
  IF v_single IS NOT NULL AND _amount > v_single THEN
    RETURN jsonb_build_object('status','failed','reason','exceeds_single_limit','limit',v_single);
  END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_spent FROM transactions
    WHERE user_id=_user_id AND type='withdrawal' AND status IN ('pending','completed') AND DATE(created_at)=CURRENT_DATE;
  IF v_daily IS NOT NULL AND v_spent + _amount > v_daily THEN
    RETURN jsonb_build_object('status','failed','reason','exceeds_daily_limit','limit',v_daily,'spent',v_spent);
  END IF;

  -- Reset free counter if month rolled over
  SELECT free_withdrawals_used, free_withdrawals_reset_at
    INTO v_used, v_reset
    FROM profiles WHERE id = _user_id FOR UPDATE;

  IF v_reset IS NULL OR v_reset < date_trunc('month', now()) THEN
    v_effective_used := 0;
    UPDATE profiles
       SET free_withdrawals_used = 0,
           free_withdrawals_reset_at = date_trunc('month', now())
     WHERE id = _user_id;
  ELSE
    v_effective_used := COALESCE(v_used, 0);
  END IF;

  -- Tiered fee
  IF v_effective_used < 2 THEN
    v_tiered := 0;
  ELSIF _amount <= 10000 THEN
    v_tiered := 50;
  ELSIF _amount <= 50000 THEN
    v_tiered := 100;
  ELSE
    v_tiered := 200;
  END IF;

  IF _is_instant THEN
    v_instant := 100;
  END IF;

  v_total_fee := v_tiered + v_instant;
  v_net := _amount - v_total_fee;

  v_fee_reason := CASE
    WHEN v_total_fee = 0 THEN 'Free withdrawal (2 per month)'
    WHEN v_tiered = 0 AND v_instant > 0 THEN 'Instant payout surcharge (₦100)'
    WHEN v_tiered > 0 AND v_instant = 0 THEN 'Withdrawal fee — covers our bank transfer cost. KukaPay does not profit from withdrawals.'
    ELSE 'Withdrawal fee + ₦100 instant payout. KukaPay does not profit from withdrawals.'
  END;

  -- Lock wallet & check
  SELECT * INTO v_wallet FROM wallets WHERE user_id=_user_id FOR UPDATE;
  IF v_wallet.id IS NULL THEN
    RETURN jsonb_build_object('status','failed','reason','wallet_not_found');
  END IF;
  IF v_wallet.available_balance < _amount THEN
    RETURN jsonb_build_object('status','failed','reason','insufficient_available_balance');
  END IF;
  IF EXISTS (SELECT 1 FROM transactions WHERE reference = _reference) THEN
    RETURN jsonb_build_object('status','failed','reason','duplicate_reference');
  END IF;
  SELECT COUNT(*) INTO v_velocity FROM transactions
    WHERE user_id=_user_id AND type='withdrawal' AND created_at > now() - interval '1 hour';
  IF v_velocity >= 3 THEN
    RETURN jsonb_build_object('status','failed','reason','velocity_limit');
  END IF;
  SELECT kyc_status INTO v_kyc FROM profiles WHERE id=_user_id;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RETURN jsonb_build_object('status','failed','reason','kyc_required');
  END IF;

  -- Hold full amount
  UPDATE wallets
     SET available_balance = available_balance - _amount,
         hold_balance = hold_balance + _amount,
         updated_at = now()
   WHERE id = v_wallet.id;

  INSERT INTO transactions (user_id, type, amount, fee_amount, fee_reason, status, reference, metadata)
  VALUES (
    _user_id, 'withdrawal', _amount, v_total_fee, v_fee_reason,
    'pending', _reference,
    jsonb_build_object(
      'provider','flutterwave',
      'bank_account',_bank_account,
      'bank_code',_bank_code,
      'tiered_fee',v_tiered,
      'instant_surcharge',v_instant,
      'net_payout',v_net,
      'is_instant',_is_instant,
      'free_used_before',v_effective_used
    )
  );

  -- Only consume a free slot when it was actually free
  IF v_total_fee = 0 THEN
    UPDATE profiles SET free_withdrawals_used = v_effective_used + 1 WHERE id = _user_id;
  END IF;

  RETURN jsonb_build_object(
    'status','pending',
    'reference',_reference,
    'amount',_amount,
    'tiered_fee',v_tiered,
    'instant_surcharge',v_instant,
    'total_fee',v_total_fee,
    'net_payout',v_net,
    'free_used',v_effective_used + CASE WHEN v_total_fee = 0 THEN 1 ELSE 0 END,
    'free_remaining',GREATEST(0, 2 - (v_effective_used + CASE WHEN v_total_fee = 0 THEN 1 ELSE 0 END)),
    'fee_reason',v_fee_reason
  );
END;
$function$;
