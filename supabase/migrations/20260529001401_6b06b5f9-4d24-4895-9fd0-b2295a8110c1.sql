-- Add email_sent_at column to track confirmation email sends (idempotent)
ALTER TABLE public.crypto_deposits
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Allow service-role to write the column from the webhook (admin client already bypasses RLS,
-- this is just to make sure no future locked-down policies block it).

-- Re-create credit_breet_deposit with: broader event matching, better idempotency,
-- and a separate friendlier transaction description.
CREATE OR REPLACE FUNCTION public.credit_breet_deposit(
  _trade_id text, _deposit_address text, _crypto_amount numeric, _amount_usd numeric,
  _rate numeric, _ngn_amount numeric, _tx_hash text, _confirmations integer,
  _event text, _status text, _payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_dep crypto_deposits%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_reference text;
  v_should_credit boolean;
  v_evt text := lower(coalesce(_event,''));
  v_sts text := lower(coalesce(_status,''));
BEGIN
  SELECT * INTO v_dep FROM crypto_deposits
    WHERE deposit_address = _deposit_address
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

  IF v_dep.id IS NULL THEN
    RETURN jsonb_build_object('status','failed','reason','deposit_row_not_found');
  END IF;

  -- Idempotency by trade id
  IF v_dep.breet_trade_id = _trade_id AND v_dep.status = 'credited' THEN
    RETURN jsonb_build_object('status','duplicate','reason','already_credited');
  END IF;

  UPDATE crypto_deposits SET
    breet_trade_id = COALESCE(breet_trade_id, _trade_id),
    crypto_amount  = COALESCE(_crypto_amount, crypto_amount),
    amount_usd     = COALESCE(_amount_usd, amount_usd),
    rate_used      = COALESCE(_rate, rate_used),
    tx_hash        = COALESCE(NULLIF(_tx_hash,''), tx_hash),
    confirmations  = COALESCE(_confirmations, confirmations),
    last_event     = _event,
    raw_payload    = _payload
  WHERE id = v_dep.id;

  v_should_credit :=
       v_evt IN ('trade.completed','trade.successful','trade.success','trade.credited','deposit.success','deposit.completed')
    OR v_sts IN ('successful','completed','success','credited','complete');

  IF v_evt = 'trade.flagged' OR v_sts = 'flagged' THEN
    UPDATE crypto_deposits SET status = 'flagged' WHERE id = v_dep.id;
    PERFORM create_notification(
      v_dep.user_id, 'Crypto Deposit Flagged',
      'Your deposit was below the minimum or under review.',
      'deposit', jsonb_build_object('deposit_id', v_dep.id, 'asset', v_dep.asset_symbol)
    );
    RETURN jsonb_build_object('status','flagged');
  ELSIF v_should_credit THEN
    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_dep.user_id FOR UPDATE;
    IF v_wallet.id IS NULL THEN
      RETURN jsonb_build_object('status','failed','reason','wallet_not_found');
    END IF;

    v_reference := 'CRYPTO-' || _trade_id;

    IF EXISTS (SELECT 1 FROM transactions WHERE reference = v_reference) THEN
      UPDATE crypto_deposits SET status = 'credited',
        credited_at = COALESCE(credited_at, now()),
        ngn_credited = COALESCE(ngn_credited, _ngn_amount)
        WHERE id = v_dep.id;
      RETURN jsonb_build_object('status','duplicate','reason','transaction_exists');
    END IF;

    UPDATE wallets SET
      balance = balance + _ngn_amount,
      available_balance = available_balance + _ngn_amount,
      updated_at = now()
    WHERE id = v_wallet.id;

    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (
      v_dep.user_id, 'deposit', _ngn_amount, 'completed', v_reference,
      jsonb_build_object(
        'source','breet',
        'description', 'Crypto conversion · ' || v_dep.asset_symbol || ' → NGN',
        'asset', v_dep.asset_symbol, 'asset_identifier', v_dep.asset_identifier,
        'network', v_dep.network, 'crypto_amount', _crypto_amount,
        'amount_usd', _amount_usd, 'rate', _rate, 'tx_hash', _tx_hash,
        'trade_id', _trade_id
      )
    );

    UPDATE crypto_deposits SET
      status = 'credited',
      ngn_credited = _ngn_amount,
      credited_at  = now()
    WHERE id = v_dep.id;

    PERFORM create_notification(
      v_dep.user_id, 'Crypto Converted',
      '₦' || _ngn_amount::text || ' credited from ' || _crypto_amount::text || ' ' || v_dep.asset_symbol,
      'deposit', jsonb_build_object('deposit_id', v_dep.id, 'amount', _ngn_amount, 'asset', v_dep.asset_symbol)
    );

    RETURN jsonb_build_object('status','credited','amount',_ngn_amount,'reference',v_reference);
  ELSIF v_evt = 'trade.pending' OR v_sts = 'pending' THEN
    UPDATE crypto_deposits SET status = 'detected' WHERE id = v_dep.id AND status = 'pending';
    RETURN jsonb_build_object('status','detected');
  END IF;

  RETURN jsonb_build_object('status','ignored','event',_event,'st',_status);
END;
$function$;