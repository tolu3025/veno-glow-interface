
DO $$
DECLARE
  r RECORD;
  v_refund_total numeric;
BEGIN
  FOR r IN
    SELECT w.id, w.user_id, w.amount, w.fee_amount, w.bank_name, w.account_number
    FROM public.withdrawals w
    WHERE w.status = 'refunded'
      AND NOT EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.type = 'REFUND'
          AND (t.reference = w.id::text OR t.metadata->>'withdrawal_id' = w.id::text)
      )
  LOOP
    v_refund_total := COALESCE(r.amount, 0) + COALESCE(r.fee_amount, 0);

    UPDATE public.wallets
    SET balance = balance + v_refund_total,
        available_balance = COALESCE(available_balance, 0) + v_refund_total,
        updated_at = now()
    WHERE user_id = r.user_id;

    INSERT INTO public.transactions (user_id, type, amount, fee_amount, status, reference, metadata)
    VALUES (
      r.user_id, 'REFUND', v_refund_total, 0, 'completed', r.id::text,
      jsonb_build_object(
        'source', 'admin_reconciliation_backfill',
        'withdrawal_id', r.id,
        'original_amount', r.amount,
        'fee_refunded', r.fee_amount,
        'bank_name', r.bank_name,
        'account_number', r.account_number
      )
    );

    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      r.user_id,
      'Refund credited',
      '₦' || to_char(v_refund_total, 'FM999,999,999.00') || ' has been credited back to your wallet from a failed withdrawal.',
      'refund_credited',
      jsonb_build_object('withdrawal_id', r.id, 'amount', v_refund_total)
    );
  END LOOP;
END $$;
