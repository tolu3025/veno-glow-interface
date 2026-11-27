-- Phase 2: Korapay virtual accounts table and ledger RPCs
-- Mirrors the Monnify schema; Monnify table remains untouched for 48-hour grace period.

CREATE TABLE IF NOT EXISTS public.korapay_virtual_accounts (
  user_id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  account_reference text        NOT NULL UNIQUE,
  account_number   text,
  bank_name        text,
  bank_code        text,
  account_name     text,
  status           text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','rejected')),
  attempted_at     timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS korapay_virtual_accounts_account_number_idx
  ON public.korapay_virtual_accounts (account_number)
  WHERE account_number IS NOT NULL;

GRANT SELECT ON public.korapay_virtual_accounts TO authenticated;
GRANT ALL   ON public.korapay_virtual_accounts TO service_role;

ALTER TABLE public.korapay_virtual_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their Korapay account" ON public.korapay_virtual_accounts;
CREATE POLICY "Owners read their Korapay account"
  ON public.korapay_virtual_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Idempotent claim with a 30-second throttle between provider attempts.
CREATE OR REPLACE FUNCTION public.claim_korapay_account(
  _user_id          uuid,
  _account_reference text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.korapay_virtual_accounts;
BEGIN
  INSERT INTO public.korapay_virtual_accounts(user_id, account_reference)
    VALUES(_user_id, _account_reference)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO r FROM public.korapay_virtual_accounts WHERE user_id = _user_id FOR UPDATE;
  IF r.account_reference <> _account_reference THEN
    RAISE EXCEPTION 'Reference mismatch';
  END IF;
  IF r.status = 'ready' THEN RETURN jsonb_build_object('action','ready'); END IF;
  IF r.attempted_at > now() - interval '30 seconds' AND r.created_at < r.attempted_at THEN
    RETURN jsonb_build_object('action','wait');
  END IF;
  UPDATE public.korapay_virtual_accounts
    SET attempted_at = now(), updated_at = now()
    WHERE user_id = _user_id;
  RETURN jsonb_build_object('action','create');
END $$;
REVOKE ALL ON FUNCTION public.claim_korapay_account(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_korapay_account(uuid,text) TO service_role;

-- Idempotent, provider-verified deposit crediting.
CREATE OR REPLACE FUNCTION public.credit_korapay_deposit(
  _account_reference    text,
  _transaction_reference text,
  _amount_kobo          bigint
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user      uuid;
  v_event     text := 'korapay:' || _transaction_reference;
  v_ref       text := 'KORA-' || _transaction_reference;
  v_post      jsonb;
  v_existing  jsonb;
  v_provider  text;
  v_processed boolean;
BEGIN
  IF _amount_kobo IS NULL OR _amount_kobo <= 0
     OR length(_transaction_reference) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Invalid deposit';
  END IF;
  SELECT user_id INTO v_user
    FROM public.korapay_virtual_accounts
    WHERE account_reference = _account_reference AND status = 'ready';
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Korapay account mapping not found';
  END IF;
  -- Advisory lock prevents concurrent double-credit for the same transaction.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_event, 0));
  SELECT payload, provider, processed
    INTO v_existing, v_provider, v_processed
    FROM public.webhook_events
    WHERE event_id = v_event FOR UPDATE;
  IF FOUND THEN
    -- Idempotent replay: exactly-matching duplicate is fine; any mismatch is an error.
    IF v_provider IS DISTINCT FROM 'korapay'
       OR v_processed IS DISTINCT FROM true
       OR v_existing->>'account_reference' IS DISTINCT FROM _account_reference
       OR (v_existing->>'amount_kobo')::bigint IS DISTINCT FROM _amount_kobo THEN
      RAISE EXCEPTION 'Conflicting duplicate deposit';
    END IF;
    RETURN jsonb_build_object('status','duplicate');
  END IF;
  IF EXISTS(SELECT 1 FROM public.transactions WHERE reference = v_ref) THEN
    RAISE EXCEPTION 'Deposit reference conflict';
  END IF;
  v_post := public.post_ledger_entry(
    NULL, v_user, _amount_kobo, 'deposit', v_ref,
    jsonb_build_object('provider','korapay','provider_reference',_transaction_reference)
  );
  IF NOT COALESCE((v_post->>'success')::boolean, false) THEN
    RAISE EXCEPTION 'Deposit posting failed';
  END IF;
  INSERT INTO public.transactions(user_id, type, amount, fee_amount, status, reference, metadata)
    VALUES(v_user, 'deposit', _amount_kobo::numeric / 100, 0, 'completed', v_ref,
           jsonb_build_object('provider','korapay','provider_reference',_transaction_reference,
                              'entry_group_id', v_post->>'entry_group_id'));
  INSERT INTO public.webhook_events(provider, event_id, processed, signature_valid, payload)
    VALUES('korapay', v_event, true, true,
           jsonb_build_object('user_id',v_user,'transaction_reference',_transaction_reference,
                              'account_reference',_account_reference,'amount_kobo',_amount_kobo));
  PERFORM public.publish_event('wallet.credited', v_user,
    jsonb_build_object('reference', v_ref, 'amount', _amount_kobo::numeric / 100));
  RETURN jsonb_build_object('status','success');
END $$;
REVOKE ALL ON FUNCTION public.credit_korapay_deposit(text,text,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_korapay_deposit(text,text,bigint) TO service_role;

-- Allow 'korapay' as a provider value in the withdrawals table.
DO $$
BEGIN
  -- Only alter if the check constraint exists and does not already include korapay.
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name LIKE '%withdrawals%provider%'
  ) THEN
    -- The constraint name varies; we drop and recreate to be safe.
    ALTER TABLE public.withdrawals
      DROP CONSTRAINT IF EXISTS withdrawals_provider_check;
    ALTER TABLE public.withdrawals
      ADD CONSTRAINT withdrawals_provider_check
        CHECK (provider IN ('monnify','squad','korapay','manual'));
  END IF;
END $$;
