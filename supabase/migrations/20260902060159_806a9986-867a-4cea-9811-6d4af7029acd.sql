DO $$
DECLARE v jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.wallet_ledger WHERE reference = 'FLW-2086849520-RESTORE') THEN
    v := public.post_ledger_entry(
      NULL,
      'c1af5b61-14c5-45a6-8fe1-a4eb1a469951'::uuid,
      100000::bigint,
      'deposit_correction',
      'FLW-2086849520-RESTORE',
      jsonb_build_object('reason','wrongly_reversed_genuine_deposit','original_reference','FLW-2086849520'),
      'external'::public.ledger_account_kind,
      false
    );
    RAISE NOTICE 'restore result: %', v;
  END IF;
END $$;

UPDATE public.transactions
SET status = 'completed'
WHERE reference = 'FLW-2086849520' AND type = 'deposit';

DELETE FROM public.transactions
WHERE reference = 'FLW-2086849520-REV';