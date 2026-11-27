-- ============================================================
-- STAGE 5a (pulled forward): lock down money RPCs
-- ============================================================

-- Money movement + sensitive identity functions: server-side only.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'credit_wallet','execute_p2p_transfer','pay_merchant_from_wallet',
        'pay_bill_from_wallet','pay_collection_from_wallet','purchase_ticket_from_wallet',
        'contribute_to_ajo','credit_breet_deposit','merchant_withdraw_to_bank',
        'safe_withdrawal','safe_credit','finalize_withdrawal','reverse_ghost_credit',
        'accept_errand_escrow','complete_errand','complete_merchant_errand',
        'apply_fx_conversion','create_dollar_lock','break_dollar_lock',
        'mature_due_dollar_locks','remind_upcoming_dollar_locks',
        'merchant_update_order_status','remove_ajo_member','update_limit',
        'rotate_kyc_key','dec_kyc_field','enc_kyc_field','log_admin_action',
        'auto_suspend_expired_matric_flags','resync_flutterwave_withdrawals',
        'acquire_convert_crypto_lock','release_convert_crypto_lock',
        'get_event_payout_details','consume_phone_otp','check_otp_rate_limits',
        'lookup_profile_by_matric','refresh_kyc_level','preview_withdrawal_fee'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;

-- Functions the signed-in app legitimately calls itself: authenticated only, never anon.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_instant_order','release_service_milestone','has_role',
        'campus_has_active_runner','count_active_runners','get_user_campus_id',
        'get_collection_payout_details','check_pin_lockout','record_failed_pin',
        'reset_pin_attempts','create_notification','is_ajo_member','has_bvn_kyc'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn.sig);
  END LOOP;
END $$;

-- Pre-login helpers must stay reachable without a session.
DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('email_exists','check_login_lock','record_login_attempt','check_rate_limit')
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated, service_role', fn.sig);
  END LOOP;
END $$;

-- ---------- Caller-ownership checks on the two client-callable money actions ----------
CREATE OR REPLACE FUNCTION public.assert_caller(_expected UUID)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in to continue';
  END IF;
  IF _expected IS NOT NULL AND auth.uid() <> _expected AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'You are not allowed to perform this action';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assert_caller(UUID) TO authenticated, service_role;

-- ---------- Velocity limits ----------
CREATE TABLE IF NOT EXISTS public.velocity_counters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  window_date DATE NOT NULL DEFAULT CURRENT_DATE,
  outflow_kobo BIGINT NOT NULL DEFAULT 0,
  tx_count    INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, window_date)
);

GRANT SELECT ON public.velocity_counters TO authenticated;
GRANT ALL ON public.velocity_counters TO service_role;
ALTER TABLE public.velocity_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own velocity" ON public.velocity_counters;
CREATE POLICY "Users read own velocity"
ON public.velocity_counters FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read velocity" ON public.velocity_counters;
CREATE POLICY "Admins read velocity"
ON public.velocity_counters FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.bump_velocity(_user_id UUID, _outflow_kobo BIGINT, _daily_cap_kobo BIGINT DEFAULT 100000000, _daily_tx_cap INTEGER DEFAULT 60)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_out BIGINT; v_cnt INTEGER;
BEGIN
  INSERT INTO public.velocity_counters (user_id, window_date, outflow_kobo, tx_count)
  VALUES (_user_id, CURRENT_DATE, GREATEST(_outflow_kobo, 0), 1)
  ON CONFLICT (user_id, window_date) DO UPDATE
    SET outflow_kobo = public.velocity_counters.outflow_kobo + GREATEST(_outflow_kobo, 0),
        tx_count     = public.velocity_counters.tx_count + 1,
        updated_at   = now()
  RETURNING outflow_kobo, tx_count INTO v_out, v_cnt;

  IF v_out > _daily_cap_kobo OR v_cnt > _daily_tx_cap THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily transaction limit reached. Please try again tomorrow or contact support.');
  END IF;
  RETURN jsonb_build_object('success', true, 'outflow_kobo', v_out, 'tx_count', v_cnt);
END;
$$;

REVOKE ALL ON FUNCTION public.bump_velocity(UUID, BIGINT, BIGINT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_velocity(UUID, BIGINT, BIGINT, INTEGER) TO service_role;