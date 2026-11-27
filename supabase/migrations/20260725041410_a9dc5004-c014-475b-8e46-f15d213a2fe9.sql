
-- Credit ₦500 manual deposit to Toluwanimi Oyetade (Sterling VA deposit that
-- didn't webhook due to Flutterwave outage + Sterling MFB phase-out).
SELECT public.credit_wallet(
  'b61c9aa2-6f1a-4b3f-96f7-89fef81a630e'::uuid,
  500::numeric
);

INSERT INTO public.transactions (user_id, type, amount, fee_amount, status, reference, metadata)
VALUES (
  '210615b9-593e-431f-a6d9-672dbc9895e7',
  'deposit',
  500,
  0,
  'completed',
  'MANUAL-DEP-TOLU-20260725-500',
  jsonb_build_object(
    'sender_name', 'Toluwanimi Oyetade',
    'bank_name', 'Sterling Bank VA (manual credit)',
    'reason', 'Flutterwave webhook missed during MFB migration outage',
    'credited_by', 'admin'
  )
);

INSERT INTO public.notifications (user_id, title, message, type)
VALUES (
  '210615b9-593e-431f-a6d9-672dbc9895e7',
  'Deposit credited',
  'Your ₦500 deposit has been credited to your wallet. Thanks for your patience.',
  'success'
);
