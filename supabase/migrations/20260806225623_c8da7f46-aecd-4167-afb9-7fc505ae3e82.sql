-- ============================================================
-- STAGE 1: Integer-kobo double-entry ledger foundation
-- ============================================================

-- ---------- 1. Kobo columns on wallets ----------
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS ledger_balance_kobo BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hold_balance_kobo   BIGINT NOT NULL DEFAULT 0;

UPDATE public.wallets
SET ledger_balance_kobo = ROUND(COALESCE(balance, 0) * 100)::BIGINT,
    hold_balance_kobo   = ROUND(COALESCE(hold_balance, 0) * 100)::BIGINT;

-- Spendable balance is derived, so it can never drift again.
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS available_balance_kobo BIGINT
  GENERATED ALWAYS AS (ledger_balance_kobo - hold_balance_kobo) STORED;

-- Repair legacy decimal drift (balance is the authoritative figure today).
UPDATE public.wallets
SET available_balance = ROUND((ledger_balance_kobo - hold_balance_kobo)::numeric / 100, 2)
WHERE available_balance IS DISTINCT FROM ROUND((ledger_balance_kobo - hold_balance_kobo)::numeric / 100, 2);

ALTER TABLE public.merchant_wallets
  ADD COLUMN IF NOT EXISTS ledger_balance_kobo BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hold_balance_kobo   BIGINT NOT NULL DEFAULT 0;

UPDATE public.merchant_wallets
SET ledger_balance_kobo = ROUND(COALESCE(balance, 0) * 100)::BIGINT,
    hold_balance_kobo   = ROUND(COALESCE(hold_balance, 0) * 100)::BIGINT;

ALTER TABLE public.merchant_wallets
  ADD COLUMN IF NOT EXISTS available_balance_kobo BIGINT
  GENERATED ALWAYS AS (ledger_balance_kobo - hold_balance_kobo) STORED;

-- ---------- 2. Two-way sync so legacy functions keep working ----------
CREATE OR REPLACE FUNCTION public.sync_wallet_kobo()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  dec_changed BOOLEAN;
  kobo_changed BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ledger_balance_kobo = 0 AND COALESCE(NEW.balance, 0) <> 0 THEN
      NEW.ledger_balance_kobo := ROUND(NEW.balance * 100)::BIGINT;
    END IF;
    IF NEW.hold_balance_kobo = 0 AND COALESCE(NEW.hold_balance, 0) <> 0 THEN
      NEW.hold_balance_kobo := ROUND(NEW.hold_balance * 100)::BIGINT;
    END IF;
  ELSE
    dec_changed  := (NEW.balance IS DISTINCT FROM OLD.balance)
                 OR (NEW.hold_balance IS DISTINCT FROM OLD.hold_balance);
    kobo_changed := (NEW.ledger_balance_kobo IS DISTINCT FROM OLD.ledger_balance_kobo)
                 OR (NEW.hold_balance_kobo IS DISTINCT FROM OLD.hold_balance_kobo);

    IF kobo_changed THEN
      -- Kobo is the source of truth when the posting engine wrote it.
      NULL;
    ELSIF dec_changed THEN
      NEW.ledger_balance_kobo := ROUND(COALESCE(NEW.balance, 0) * 100)::BIGINT;
      NEW.hold_balance_kobo   := ROUND(COALESCE(NEW.hold_balance, 0) * 100)::BIGINT;
    END IF;
  END IF;

  -- Decimal mirrors always follow kobo.
  NEW.balance           := ROUND(NEW.ledger_balance_kobo::numeric / 100, 2);
  NEW.hold_balance      := ROUND(NEW.hold_balance_kobo::numeric / 100, 2);
  NEW.available_balance := ROUND((NEW.ledger_balance_kobo - NEW.hold_balance_kobo)::numeric / 100, 2);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wallet_kobo ON public.wallets;
CREATE TRIGGER trg_sync_wallet_kobo
BEFORE INSERT OR UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_kobo();

DROP TRIGGER IF EXISTS trg_sync_merchant_wallet_kobo ON public.merchant_wallets;
CREATE TRIGGER trg_sync_merchant_wallet_kobo
BEFORE INSERT OR UPDATE ON public.merchant_wallets
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_kobo();

-- ---------- 3. Immutable double-entry ledger ----------
DO $$ BEGIN
  CREATE TYPE public.ledger_direction AS ENUM ('debit', 'credit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ledger_account_kind AS ENUM ('user_wallet', 'merchant_wallet', 'external', 'platform_fee', 'escrow');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_group_id     UUID NOT NULL,
  account_kind       public.ledger_account_kind NOT NULL,
  wallet_id          UUID,
  user_id            UUID,
  direction          public.ledger_direction NOT NULL,
  amount_kobo        BIGINT NOT NULL CHECK (amount_kobo > 0),
  balance_after_kobo BIGINT,
  currency           TEXT NOT NULL DEFAULT 'NGN',
  purpose            TEXT NOT NULL,
  reference          TEXT,
  transaction_id     UUID,
  metadata           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.wallet_ledger TO authenticated;
GRANT ALL ON public.wallet_ledger TO service_role;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own ledger entries" ON public.wallet_ledger;
CREATE POLICY "Users read own ledger entries"
ON public.wallet_ledger FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all ledger entries" ON public.wallet_ledger;
CREATE POLICY "Admins read all ledger entries"
ON public.wallet_ledger FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_group   ON public.wallet_ledger(entry_group_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user    ON public.wallet_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet  ON public.wallet_ledger(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_ref     ON public.wallet_ledger(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created ON public.wallet_ledger(created_at DESC);

-- Immutability: no updates, no deletes, ever.
CREATE OR REPLACE FUNCTION public.wallet_ledger_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'wallet_ledger is append-only: % is not permitted', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS trg_wallet_ledger_immutable ON public.wallet_ledger;
CREATE TRIGGER trg_wallet_ledger_immutable
BEFORE UPDATE OR DELETE ON public.wallet_ledger
FOR EACH ROW EXECUTE FUNCTION public.wallet_ledger_immutable();

-- ---------- 4. Idempotency keys ----------
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID,
  operation      TEXT NOT NULL,
  idem_key       TEXT NOT NULL,
  request_hash   TEXT,
  status         TEXT NOT NULL DEFAULT 'in_progress',
  response       JSONB,
  entry_group_id UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operation, idem_key)
);

GRANT SELECT ON public.idempotency_keys TO authenticated;
GRANT ALL ON public.idempotency_keys TO service_role;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own idempotency keys" ON public.idempotency_keys;
CREATE POLICY "Users read own idempotency keys"
ON public.idempotency_keys FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_idem_user ON public.idempotency_keys(user_id, created_at DESC);

-- ---------- 5. Event outbox ----------
CREATE TABLE IF NOT EXISTS public.event_outbox (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  aggregate_id  UUID,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        TEXT NOT NULL DEFAULT 'pending',
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT,
  available_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.event_outbox TO service_role;
ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read outbox" ON public.event_outbox;
CREATE POLICY "Admins read outbox"
ON public.event_outbox FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON public.event_outbox(status, available_at) WHERE status = 'pending';

-- ---------- 6. The posting engine: the ONLY sanctioned way to move money ----------
CREATE OR REPLACE FUNCTION public.post_ledger_entry(
  _debit_user_id  UUID,          -- NULL = money originates outside Kukapay
  _credit_user_id UUID,          -- NULL = money leaves Kukapay
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

  -- Deterministic lock order prevents deadlocks between concurrent transfers.
  IF _debit_user_id IS NOT NULL AND _credit_user_id IS NOT NULL THEN
    v_first  := LEAST(_debit_user_id, _credit_user_id);
    v_second := GREATEST(_debit_user_id, _credit_user_id);
    PERFORM 1 FROM public.wallets WHERE user_id = v_first FOR UPDATE;
    PERFORM 1 FROM public.wallets WHERE user_id = v_second FOR UPDATE;
  END IF;

  IF _debit_user_id IS NOT NULL THEN
    SELECT * INTO v_dw FROM public.wallets WHERE user_id = _debit_user_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
    END IF;
    IF NOT _allow_overdraft AND (v_dw.ledger_balance_kobo - v_dw.hold_balance_kobo) < _amount_kobo THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;
  END IF;

  IF _credit_user_id IS NOT NULL THEN
    SELECT * INTO v_cw FROM public.wallets WHERE user_id = _credit_user_id FOR UPDATE;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Recipient wallet not found');
    END IF;
  END IF;

  -- Debit leg
  IF _debit_user_id IS NOT NULL THEN
    UPDATE public.wallets
      SET ledger_balance_kobo = ledger_balance_kobo - _amount_kobo,
          updated_at = now()
      WHERE user_id = _debit_user_id
      RETURNING * INTO v_dw;

    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, wallet_id, user_id, direction, amount_kobo,
       balance_after_kobo, purpose, reference, metadata)
    VALUES
      (v_group, 'user_wallet', v_dw.id, _debit_user_id, 'debit', _amount_kobo,
       v_dw.ledger_balance_kobo, _purpose, _reference, _metadata);
  ELSE
    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, direction, amount_kobo, purpose, reference, metadata)
    VALUES (v_group, _external_kind, 'debit', _amount_kobo, _purpose, _reference, _metadata);
  END IF;

  -- Credit leg
  IF _credit_user_id IS NOT NULL THEN
    UPDATE public.wallets
      SET ledger_balance_kobo = ledger_balance_kobo + _amount_kobo,
          updated_at = now()
      WHERE user_id = _credit_user_id
      RETURNING * INTO v_cw;

    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, wallet_id, user_id, direction, amount_kobo,
       balance_after_kobo, purpose, reference, metadata)
    VALUES
      (v_group, 'user_wallet', v_cw.id, _credit_user_id, 'credit', _amount_kobo,
       v_cw.ledger_balance_kobo, _purpose, _reference, _metadata);
  ELSE
    INSERT INTO public.wallet_ledger
      (entry_group_id, account_kind, direction, amount_kobo, purpose, reference, metadata)
    VALUES (v_group, _external_kind, 'credit', _amount_kobo, _purpose, _reference, _metadata);
  END IF;

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

-- ---------- 7. Outbox publisher used inside money transactions ----------
CREATE OR REPLACE FUNCTION public.publish_event(_event_type TEXT, _aggregate_id UUID, _payload JSONB DEFAULT '{}'::jsonb)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.event_outbox (event_type, aggregate_id, payload)
  VALUES (_event_type, _aggregate_id, COALESCE(_payload, '{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_event(TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_event(TEXT, UUID, JSONB) TO service_role;

-- ---------- 8. Opening balances so the ledger explains every naira held today ----------
INSERT INTO public.wallet_ledger
  (entry_group_id, account_kind, wallet_id, user_id, direction, amount_kobo,
   balance_after_kobo, purpose, reference, metadata)
SELECT gen_random_uuid(), 'user_wallet', w.id, w.user_id, 'credit', w.ledger_balance_kobo,
       w.ledger_balance_kobo, 'opening_balance', 'OPENING-' || w.id::text,
       jsonb_build_object('migrated_at', now(), 'source', 'stage1_cutover')
FROM public.wallets w
WHERE w.ledger_balance_kobo > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.wallet_ledger l
    WHERE l.wallet_id = w.id AND l.purpose = 'opening_balance'
  );

-- ---------- 9. Reconciliation helper ----------
CREATE OR REPLACE FUNCTION public.reconcile_wallet_ledger()
RETURNS TABLE(wallet_id UUID, user_id UUID, wallet_kobo BIGINT, ledger_kobo BIGINT, diff_kobo BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id, w.user_id, w.ledger_balance_kobo,
         COALESCE(SUM(CASE WHEN l.direction = 'credit' THEN l.amount_kobo ELSE -l.amount_kobo END), 0)::BIGINT,
         w.ledger_balance_kobo - COALESCE(SUM(CASE WHEN l.direction = 'credit' THEN l.amount_kobo ELSE -l.amount_kobo END), 0)::BIGINT
  FROM public.wallets w
  LEFT JOIN public.wallet_ledger l ON l.wallet_id = w.id
  GROUP BY w.id, w.user_id, w.ledger_balance_kobo;
$$;

REVOKE ALL ON FUNCTION public.reconcile_wallet_ledger() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reconcile_wallet_ledger() TO service_role;