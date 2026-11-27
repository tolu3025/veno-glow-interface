
CREATE TABLE IF NOT EXISTS public.phone_otp_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  phone_e164 text,
  ip text,
  action text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_attempts_user_created ON public.phone_otp_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_otp_attempts_phone_created ON public.phone_otp_attempts (phone_e164, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_otp_attempts_ip_created ON public.phone_otp_attempts (ip, created_at DESC);

ALTER TABLE public.phone_otp_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    EXECUTE $p$
      CREATE POLICY "Admins can view otp attempts"
      ON public.phone_otp_attempts FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    $p$;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.check_otp_rate_limits(
  p_user_id uuid,
  p_phone text,
  p_ip text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_send timestamptz;
  v_user_24h int;
  v_phone_1h int;
  v_phone_24h int;
  v_ip_1h int;
  v_user_fail_1h int;
  v_wait int;
BEGIN
  -- Per-user lockout for failed verifies (last 1 hour, max 10)
  SELECT count(*) INTO v_user_fail_1h
  FROM public.phone_otp_attempts
  WHERE user_id = p_user_id AND action = 'verify' AND success = false
    AND created_at > now() - interval '1 hour';
  IF v_user_fail_1h >= 10 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Too many failed attempts. Try again in 1 hour.');
  END IF;

  -- 60s cooldown between sends per user
  SELECT max(created_at) INTO v_last_send
  FROM public.phone_otp_attempts
  WHERE user_id = p_user_id AND action = 'send' AND success = true;
  IF v_last_send IS NOT NULL AND v_last_send > now() - interval '60 seconds' THEN
    v_wait := ceil(extract(epoch FROM (v_last_send + interval '60 seconds' - now())));
    RETURN jsonb_build_object('allowed', false, 'retry_after_seconds', v_wait,
      'reason', 'Please wait ' || v_wait || 's before requesting again.');
  END IF;

  -- Per-user: 5 sends per 24h
  SELECT count(*) INTO v_user_24h
  FROM public.phone_otp_attempts
  WHERE user_id = p_user_id AND action = 'send' AND success = true
    AND created_at > now() - interval '24 hours';
  IF v_user_24h >= 5 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Daily limit reached. Try again tomorrow.');
  END IF;

  -- Per-phone: 3 per hour, 10 per 24h
  SELECT count(*) INTO v_phone_1h
  FROM public.phone_otp_attempts
  WHERE phone_e164 = p_phone AND action = 'send' AND success = true
    AND created_at > now() - interval '1 hour';
  IF v_phone_1h >= 3 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Too many codes sent to this number. Try again in 1 hour.');
  END IF;

  SELECT count(*) INTO v_phone_24h
  FROM public.phone_otp_attempts
  WHERE phone_e164 = p_phone AND action = 'send' AND success = true
    AND created_at > now() - interval '24 hours';
  IF v_phone_24h >= 10 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'This number has reached its daily limit.');
  END IF;

  -- Per-IP: 20 per hour
  IF p_ip IS NOT NULL AND p_ip <> '' THEN
    SELECT count(*) INTO v_ip_1h
    FROM public.phone_otp_attempts
    WHERE ip = p_ip AND action = 'send' AND success = true
      AND created_at > now() - interval '1 hour';
    IF v_ip_1h >= 20 THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'Too many requests from your network. Try again later.');
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;
