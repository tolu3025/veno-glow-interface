
CREATE TABLE public.crypto_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id text NOT NULL,
  asset_identifier text NOT NULL,
  asset_symbol text NOT NULL,
  asset_name text NOT NULL,
  network text NOT NULL,
  breet_wallet_id text NOT NULL,
  deposit_address text NOT NULL,
  label text NOT NULL,
  minimum_ngn numeric,
  rate_ngn_at_creation numeric,
  breet_trade_id text UNIQUE,
  crypto_amount numeric,
  amount_usd numeric,
  rate_used numeric,
  ngn_credited numeric,
  tx_hash text,
  confirmations integer,
  status text NOT NULL DEFAULT 'pending',
  last_event text,
  raw_payload jsonb,
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX crypto_deposits_user_asset_label_uq
  ON public.crypto_deposits (user_id, asset_id, label);
CREATE INDEX crypto_deposits_user_created_idx
  ON public.crypto_deposits (user_id, created_at DESC);
CREATE INDEX crypto_deposits_deposit_address_idx
  ON public.crypto_deposits (deposit_address);

ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own crypto deposits"
  ON public.crypto_deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_crypto_deposits_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER crypto_deposits_updated_at
BEFORE UPDATE ON public.crypto_deposits
FOR EACH ROW EXECUTE FUNCTION public.touch_crypto_deposits_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_deposits;

CREATE OR REPLACE FUNCTION public.credit_breet_deposit(
  _trade_id text,
  _deposit_address text,
  _crypto_amount numeric,
  _amount_usd numeric,
  _rate numeric,
  _ngn_amount numeric,
  _tx_hash text,
  _confirmations integer,
  _event text,
  _status text,
  _payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dep crypto_deposits%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_reference text;
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

  IF _event = 'trade.pending' THEN
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
  ELSIF _event = 'trade.completed' THEN
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
        'source', 'breet',
        'asset', v_dep.asset_symbol,
        'asset_identifier', v_dep.asset_identifier,
        'network', v_dep.network,
        'crypto_amount', _crypto_amount,
        'amount_usd', _amount_usd,
        'rate', _rate,
        'tx_hash', _tx_hash,
        'trade_id', _trade_id
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
$$;
