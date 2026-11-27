ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS fee_model text NOT NULL DEFAULT 'legacy';

CREATE OR REPLACE FUNCTION public.refund_withdrawal_by_id(_withdrawal_id uuid, _reason text DEFAULT 'provider_failed'::text, _source text DEFAULT 'reconciler'::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_w withdrawals%ROWTYPE; v_kobo bigint; v_post jsonb; v_total numeric;
BEGIN
  SELECT * INTO v_w FROM public.withdrawals WHERE id = _withdrawal_id FOR UPDATE;
  IF v_w.id IS NULL OR v_w.status::text NOT IN ('pending','processing','failed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_claimable');
  END IF;
  IF v_w.wallet_scope = 'merchant' THEN
    RETURN public.reverse_merchant_withdrawal(_withdrawal_id, _reason, _source);
  END IF;

  UPDATE public.withdrawals SET status = 'refunded', failure_reason = _reason WHERE id = _withdrawal_id;
  v_total := v_w.amount + CASE WHEN v_w.fee_model = 'on_top' THEN COALESCE(v_w.fee_amount,0) ELSE 0 END;
  v_kobo := ROUND(v_total * 100)::bigint;

  IF v_w.debit_mode = 'direct' THEN
    v_post := public.post_ledger_entry(NULL, v_w.user_id, v_kobo, 'withdrawal_refund',
      'WDR-RF-' || v_w.id::text,
      jsonb_build_object('withdrawal_id', v_w.id, 'reason', _reason, 'source', _source, 'fee_model', v_w.fee_model),
      'external'::public.ledger_account_kind, false);
    IF NOT (v_post->>'success')::boolean THEN
      RAISE EXCEPTION 'Withdrawal refund failed: %', v_post->>'error';
    END IF;
  ELSE
    UPDATE public.wallets SET hold_balance_kobo = GREATEST(0, hold_balance_kobo - v_kobo), updated_at = now()
     WHERE user_id = v_w.user_id;
  END IF;

  UPDATE public.transactions
     SET status = 'reversed',
         metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('refund_reason', _reason, 'reconciled_via', _source)
   WHERE user_id = v_w.user_id AND type = 'withdrawal' AND status IN ('pending','completed')
     AND reference = COALESCE(v_w.reference, reference)
     AND (v_w.reference IS NOT NULL OR status = 'pending');

  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (v_w.user_id, 'Withdrawal Failed - Funds Returned',
          'Your withdrawal of N' || to_char(v_w.amount, 'FM999,999,999.00') || ' could not be processed. N' || to_char(v_total, 'FM999,999,999.00') || ' is back in your wallet.',
          'withdrawal', jsonb_build_object('withdrawal_id', v_w.id, 'amount', v_w.amount, 'refunded', v_total, 'reason', _reason, 'reconciled_via', _source));

  RETURN jsonb_build_object('success', true, 'withdrawal_id', v_w.id, 'refunded_kobo', v_kobo);
END; $function$;