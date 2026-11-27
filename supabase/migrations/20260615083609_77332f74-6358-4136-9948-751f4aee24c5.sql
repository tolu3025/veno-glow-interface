CREATE OR REPLACE FUNCTION public.credit_wallet(p_wallet_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets
     SET balance = balance + p_amount,
         available_balance = COALESCE(available_balance, 0) + p_amount,
         updated_at = now()
   WHERE id = p_wallet_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric) TO service_role;

UPDATE public.wallets
   SET available_balance = balance,
       updated_at = now()
 WHERE available_balance < balance;