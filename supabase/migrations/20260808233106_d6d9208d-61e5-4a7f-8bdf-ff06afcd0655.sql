
-- 1. Reconciliation run log
CREATE TABLE IF NOT EXISTS public.reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job text NOT NULL,
  checked int NOT NULL DEFAULT 0,
  settled int NOT NULL DEFAULT 0,
  refunded int NOT NULL DEFAULT 0,
  flagged int NOT NULL DEFAULT 0,
  errors int NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reconciliation_runs TO authenticated;
GRANT ALL ON public.reconciliation_runs TO service_role;

ALTER TABLE public.reconciliation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reconciliation runs" ON public.reconciliation_runs;
CREATE POLICY "Admins can view reconciliation runs"
  ON public.reconciliation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'auditor'));

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_job_time
  ON public.reconciliation_runs (job, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_reconciliation_run(
  _job text, _checked int, _settled int, _refunded int, _flagged int, _errors int, _details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.reconciliation_runs (job, checked, settled, refunded, flagged, errors, details)
  VALUES (_job, COALESCE(_checked,0), COALESCE(_settled,0), COALESCE(_refunded,0),
          COALESCE(_flagged,0), COALESCE(_errors,0), COALESCE(_details,'{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.record_reconciliation_run(text,int,int,int,int,int,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_reconciliation_run(text,int,int,int,int,int,jsonb) TO service_role;

-- 2. Settle a confirmed withdrawal (atomic claim + engine debit)
CREATE OR REPLACE FUNCTION public.settle_withdrawal_by_id(_withdrawal_id uuid, _source text DEFAULT 'reconciler')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_w withdrawals%ROWTYPE;
BEGIN
  UPDATE public.withdrawals SET status = 'completed', updated_at = now()
   WHERE id = _withdrawal_id AND status IN ('pending','processing')
  RETURNING * INTO v_w;

  IF v_w.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_claimable');
  END IF;

  PERFORM public.finalize_withdrawal(v_w.user_id, v_w.amount);

  UPDATE public.transactions
     SET status = 'completed'
   WHERE user_id = v_w.user_id AND type = 'withdrawal' AND status = 'pending'
     AND reference = COALESCE(v_w.reference, reference)
     AND amount = v_w.amount;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (v_w.user_id, 'Withdrawal Completed',
          '₦' || to_char(v_w.amount, 'FM999,999,999.00') || ' sent to ' || COALESCE(v_w.bank_name, 'your bank'),
          'withdrawal',
          jsonb_build_object('withdrawal_id', v_w.id, 'amount', v_w.amount, 'reconciled_via', _source));

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_w.id);
END; $$;

REVOKE ALL ON FUNCTION public.settle_withdrawal_by_id(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_withdrawal_by_id(uuid,text) TO service_role;

-- 3. Refund a failed withdrawal: release the HOLD only (funds were never debited)
CREATE OR REPLACE FUNCTION public.refund_withdrawal_by_id(_withdrawal_id uuid, _reason text DEFAULT 'provider_failed', _source text DEFAULT 'reconciler')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_w withdrawals%ROWTYPE; v_kobo bigint;
BEGIN
  UPDATE public.withdrawals SET status = 'refunded', updated_at = now()
   WHERE id = _withdrawal_id AND status IN ('pending','processing')
  RETURNING * INTO v_w;

  IF v_w.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_claimable');
  END IF;

  v_kobo := ROUND(v_w.amount * 100)::bigint;

  -- Release the hold placed by safe_withdrawal. No ledger posting: the money
  -- was never debited, so crediting here would create a ghost credit.
  UPDATE public.wallets
     SET hold_balance_kobo = GREATEST(0, hold_balance_kobo - v_kobo), updated_at = now()
   WHERE user_id = v_w.user_id;

  UPDATE public.transactions
     SET status = 'reversed',
         metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('refund_reason', _reason, 'reconciled_via', _source)
   WHERE user_id = v_w.user_id AND type = 'withdrawal' AND status = 'pending'
     AND reference = COALESCE(v_w.reference, reference)
     AND amount = v_w.amount;

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (v_w.user_id, 'Withdrawal Failed - Funds Released',
          'Your withdrawal of ₦' || to_char(v_w.amount, 'FM999,999,999.00') || ' could not be processed. Your funds are available in your wallet again.',
          'withdrawal',
          jsonb_build_object('withdrawal_id', v_w.id, 'amount', v_w.amount, 'reason', _reason, 'reconciled_via', _source));

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_w.id, 'released_kobo', v_kobo);
END; $$;

REVOKE ALL ON FUNCTION public.refund_withdrawal_by_id(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_withdrawal_by_id(uuid,text,text) TO service_role;

-- 4. Ghost-credit reversal now goes through the posting engine
CREATE OR REPLACE FUNCTION public.reverse_ghost_credit(_reference text, _reason text DEFAULT 'ghost_credit')
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_tx transactions%ROWTYPE; v_post jsonb; v_kobo bigint;
BEGIN
  SELECT * INTO v_tx FROM public.transactions
   WHERE reference = _reference AND type = 'deposit' FOR UPDATE;
  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('status','failed','reason','not_found');
  END IF;
  IF v_tx.status = 'reversed' THEN
    RETURN jsonb_build_object('status','failed','reason','already_reversed');
  END IF;

  v_kobo := ROUND(v_tx.amount * 100)::bigint;

  v_post := public.post_ledger_entry(
    v_tx.user_id, NULL, v_kobo, 'deposit_reversal', _reference || '-REV',
    jsonb_build_object('reason', _reason, 'original_tx_id', v_tx.id),
    'external'::public.ledger_account_kind, true
  );
  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('status','failed','reason', v_post->>'error');
  END IF;

  UPDATE public.transactions SET status = 'reversed' WHERE id = v_tx.id;

  INSERT INTO public.transactions (user_id, type, amount, status, reference, metadata)
  VALUES (v_tx.user_id, 'REFUND', v_tx.amount, 'completed', _reference || '-REV',
          jsonb_build_object('provider','internal','reason',_reason,'original_tx_id',v_tx.id))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.reconciliation_flags (user_id, reference, expected_amount, actual_amount, flag_type, auto_reversed)
  VALUES (v_tx.user_id, _reference, 0, v_tx.amount, COALESCE(_reason,'ghost_credit'), true)
  ON CONFLICT (reference, flag_type) DO UPDATE SET auto_reversed = true;

  RETURN jsonb_build_object('status','reversed','amount',v_tx.amount);
END; $$;

REVOKE ALL ON FUNCTION public.reverse_ghost_credit(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_ghost_credit(text,text) TO service_role;
