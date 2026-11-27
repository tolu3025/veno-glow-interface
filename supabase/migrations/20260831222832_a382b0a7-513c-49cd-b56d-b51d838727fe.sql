CREATE OR REPLACE FUNCTION public.reverse_ghost_credit(_reference text, _reason text DEFAULT 'ghost_credit')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tx transactions%ROWTYPE; v_post jsonb; v_kobo bigint; v_src text;
BEGIN
  SELECT * INTO v_tx FROM public.transactions
   WHERE reference = _reference AND type = 'deposit' FOR UPDATE;
  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('status','failed','reason','not_found');
  END IF;
  IF v_tx.status = 'reversed' THEN
    RETURN jsonb_build_object('status','failed','reason','already_reversed');
  END IF;

  -- Only provider (Flutterwave bank/card) deposits may be auto-reversed.
  v_src := lower(COALESCE(v_tx.metadata->>'source', v_tx.metadata->>'provider', ''));
  IF _reference LIKE 'CRYPTO-%' OR v_src IN ('breet','crypto','internal') THEN
    RETURN jsonb_build_object('status','skipped','reason','not_provider_deposit');
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
          jsonb_build_object('provider','internal','reason',_reason,'original_tx_id',v_tx.id,
                             'direction','debit','description','Reversal'))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.reconciliation_flags (user_id, reference, expected_amount, actual_amount, flag_type, auto_reversed)
  VALUES (v_tx.user_id, _reference, 0, v_tx.amount, COALESCE(_reason,'ghost_credit'), true)
  ON CONFLICT (reference, flag_type) DO UPDATE SET auto_reversed = true;

  RETURN jsonb_build_object('status','reversed','amount',v_tx.amount);
END; $$;

REVOKE ALL ON FUNCTION public.reverse_ghost_credit(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_ghost_credit(text, text) TO service_role;