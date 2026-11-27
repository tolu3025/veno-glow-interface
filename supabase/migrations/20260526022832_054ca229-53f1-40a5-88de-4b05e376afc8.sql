-- 1) Patch RPC to recognize trade.successful as a credit-triggering event
CREATE OR REPLACE FUNCTION public.credit_breet_deposit(_trade_id text, _deposit_address text, _crypto_amount numeric, _amount_usd numeric, _rate numeric, _ngn_amount numeric, _tx_hash text, _confirmations integer, _event text, _status text, _payload jsonb)
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
BEGIN
  SELECT * INTO v_dep FROM crypto_deposits
    WHERE deposit_address = _deposit_address
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

  IF v_dep.id IS NULL THEN
    RETURN jsonb_build_object('status','failed','reason','deposit_row_not_found');
  END IF;

  IF v_dep.breet_trade_id = _trade_id AND v_dep.status = 'credited' THEN
    RETURN jsonb_build_object('status','duplicate','reason','already_credited');
  END IF;

  UPDATE crypto_deposits SET
    breet_trade_id = COALESCE(breet_trade_id, _trade_id),
    crypto_amount = _crypto_amount,
    amount_usd = _amount_usd,
    rate_used = _rate,
    tx_hash = _tx_hash,
    confirmations = _confirmations,
    last_event = _event,
    raw_payload = _payload
  WHERE id = v_dep.id;

  v_should_credit := _event IN ('trade.completed','trade.successful','trade.success')
                  OR lower(coalesce(_status,'')) IN ('successful','completed','success');

  IF _event = 'trade.pending' AND NOT v_should_credit THEN
    UPDATE crypto_deposits SET status = 'detected' WHERE id = v_dep.id AND status = 'pending';
    RETURN jsonb_build_object('status','detected');
  ELSIF _event = 'trade.flagged' THEN
    UPDATE crypto_deposits SET status = 'flagged' WHERE id = v_dep.id;
    PERFORM create_notification(
      v_dep.user_id,
      'Crypto Deposit Flagged',
      'Your deposit was below the minimum threshold and is being reviewed.',
      'deposit',
      jsonb_build_object('deposit_id', v_dep.id, 'asset', v_dep.asset_symbol)
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
        'source','breet','asset',v_dep.asset_symbol,'asset_identifier',v_dep.asset_identifier,
        'network',v_dep.network,'crypto_amount',_crypto_amount,'amount_usd',_amount_usd,
        'rate',_rate,'tx_hash',_tx_hash,'trade_id',_trade_id
      )
    );

    UPDATE crypto_deposits SET
      status = 'credited',
      ngn_credited = _ngn_amount,
      credited_at = now()
    WHERE id = v_dep.id;

    PERFORM create_notification(
      v_dep.user_id,
      'Crypto Converted ✅',
      '₦' || _ngn_amount::text || ' credited from ' || _crypto_amount::text || ' ' || v_dep.asset_symbol,
      'deposit',
      jsonb_build_object('deposit_id', v_dep.id, 'amount', _ngn_amount, 'asset', v_dep.asset_symbol)
    );

    RETURN jsonb_build_object('status','credited','amount',_ngn_amount,'reference',v_reference);
  END IF;

  RETURN jsonb_build_object('status','ignored','event',_event);
END;
$function$;

-- 2) Manually credit the stuck ETH deposit (on-chain since yesterday, confirmations=1)
DO $$
DECLARE
  v_payload jsonb;
  v_ngn numeric;
BEGIN
  SELECT raw_payload INTO v_payload FROM crypto_deposits
   WHERE id = 'f7e7e90d-3545-49d9-861a-56b65cd9333e';
  IF v_payload IS NULL THEN RETURN; END IF;

  v_ngn := round((COALESCE((v_payload->>'amountInUSD')::numeric,0) * COALESCE((v_payload->>'rate')::numeric,0))::numeric, 2);

  PERFORM public.credit_breet_deposit(
    _trade_id        => COALESCE(v_payload->>'id',''),
    _deposit_address => COALESCE(v_payload->>'destinationAddress',''),
    _crypto_amount   => COALESCE((v_payload->>'cryptoAmount')::numeric,0),
    _amount_usd      => COALESCE((v_payload->>'amountInUSD')::numeric,0),
    _rate            => COALESCE((v_payload->>'rate')::numeric,0),
    _ngn_amount      => v_ngn,
    _tx_hash         => COALESCE(v_payload->>'txHash',''),
    _confirmations   => COALESCE((v_payload->>'confirmations')::int,0),
    _event           => 'trade.successful',
    _status          => 'successful',
    _payload         => v_payload
  );
END $$;