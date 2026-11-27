
DO $$
DECLARE
  r RECORD;
  v_balance NUMERIC;
  v_admin UUID;
  affected JSONB := '[]'::jsonb;
BEGIN
  SELECT user_id INTO v_admin FROM public.user_roles WHERE role='admin' LIMIT 1;

  FOR r IN
    SELECT t.user_id, t.amount, t.id AS txn_id, t.reference AS withdrawal_id
    FROM public.transactions t
    WHERE t.type = 'REFUND'
      AND t.metadata->>'source' = 'admin_reconciliation_backfill'
  LOOP
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = r.user_id FOR UPDATE;
    IF v_balance IS NULL THEN
      RAISE EXCEPTION 'No wallet for user % (txn %)', r.user_id, r.txn_id;
    END IF;
    IF v_balance < r.amount THEN
      RAISE EXCEPTION 'Insufficient balance to reverse refund for user %: balance=%, refund=%, txn=%',
        r.user_id, v_balance, r.amount, r.txn_id;
    END IF;

    UPDATE public.wallets SET balance = balance - r.amount WHERE user_id = r.user_id;

    affected := affected || jsonb_build_object(
      'user_id', r.user_id,
      'amount', r.amount,
      'transaction_id', r.txn_id,
      'withdrawal_id', r.withdrawal_id
    );
  END LOOP;

  DELETE FROM public.notifications
   WHERE metadata->>'transaction_id' IN (
     SELECT id::text FROM public.transactions
      WHERE type='REFUND' AND metadata->>'source' = 'admin_reconciliation_backfill'
   );

  DELETE FROM public.transactions
   WHERE type='REFUND' AND metadata->>'source' = 'admin_reconciliation_backfill';

  INSERT INTO public.admin_audit_logs (admin_id, action, target_table, metadata)
  VALUES (
    v_admin,
    'refund_backfill_reversal',
    'transactions',
    jsonb_build_object(
      'reason', 'Backfilled refunds were ghost withdrawal attempts; reversing wallet credits. Source withdrawals left at status=refunded.',
      'reversed_count', jsonb_array_length(affected),
      'entries', affected
    )
  );
END $$;
