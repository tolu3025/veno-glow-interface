CREATE OR REPLACE FUNCTION public.flag_over_balance_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_max numeric;
BEGIN
  IF COALESCE(NEW.balance,0) <= COALESCE(OLD.balance,0) OR NEW.user_id IS NULL THEN RETURN NULL; END IF;
  v_max := COALESCE(public.kyc_max_balance(NEW.user_id), 0);
  IF NEW.balance > v_max AND COALESCE(OLD.balance,0) <= v_max OR
     (NEW.balance > v_max AND NOT EXISTS (SELECT 1 FROM fraud_flags WHERE user_id=NEW.user_id AND flag_type='kyc_balance_limit_exceeded' AND resolved=false)) THEN
    IF NOT EXISTS (SELECT 1 FROM fraud_flags WHERE user_id=NEW.user_id AND flag_type='kyc_balance_limit_exceeded' AND resolved=false) THEN
      INSERT INTO fraud_flags (user_id, flag_type, description, metadata)
      VALUES (NEW.user_id, 'kyc_balance_limit_exceeded',
        'Wallet balance ₦' || to_char(NEW.balance,'FM999,999,990.00') || ' is over the KYC limit of ₦' || to_char(v_max,'FM999,999,990'),
        jsonb_build_object('balance', NEW.balance, 'previous_balance', OLD.balance, 'limit', v_max));
    END IF;
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;
REVOKE EXECUTE ON FUNCTION public.flag_over_balance_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_flag_over_balance_limit ON public.wallets;
CREATE TRIGGER trg_flag_over_balance_limit AFTER UPDATE OF balance ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.flag_over_balance_limit();