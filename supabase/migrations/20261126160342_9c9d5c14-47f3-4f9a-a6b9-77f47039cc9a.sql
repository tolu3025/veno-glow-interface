DO $$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public.begin_monnify_withdrawal'::regproc) INTO d;
  d := replace(d, '''Transfer fee'', ''processing'', _reference,', '''Transfer fee'', ''pending'', _reference,');
  EXECUTE d;
END $$;