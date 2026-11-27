
-- 1. Login attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  email text PRIMARY KEY,
  attempts int NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_attempt_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- No policies; only security-definer functions touch this table.

CREATE OR REPLACE FUNCTION public.check_login_lock(_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.login_attempts%ROWTYPE;
BEGIN
  SELECT * INTO row FROM public.login_attempts WHERE email = lower(_email);
  IF row.locked_until IS NOT NULL AND row.locked_until > now() THEN
    RETURN jsonb_build_object('locked', true, 'locked_until', row.locked_until);
  END IF;
  RETURN jsonb_build_object('locked', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(_email text, _success boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.login_attempts%ROWTYPE;
  e text := lower(_email);
  max_attempts int := 10;
  window_len interval := interval '15 minutes';
  lock_len interval := interval '15 minutes';
BEGIN
  SELECT * INTO row FROM public.login_attempts WHERE email = e FOR UPDATE;

  IF row.locked_until IS NOT NULL AND row.locked_until > now() THEN
    RETURN jsonb_build_object('locked', true, 'locked_until', row.locked_until);
  END IF;

  IF _success THEN
    DELETE FROM public.login_attempts WHERE email = e;
    RETURN jsonb_build_object('locked', false);
  END IF;

  IF NOT FOUND THEN
    INSERT INTO public.login_attempts(email, attempts, window_started_at, last_attempt_at)
    VALUES (e, 1, now(), now());
    RETURN jsonb_build_object('locked', false, 'attempts_left', max_attempts - 1);
  END IF;

  IF row.window_started_at < now() - window_len THEN
    UPDATE public.login_attempts
      SET attempts = 1, window_started_at = now(), last_attempt_at = now(), locked_until = NULL
      WHERE email = e;
    RETURN jsonb_build_object('locked', false, 'attempts_left', max_attempts - 1);
  END IF;

  IF row.attempts + 1 >= max_attempts THEN
    UPDATE public.login_attempts
      SET attempts = row.attempts + 1, last_attempt_at = now(),
          locked_until = now() + lock_len
      WHERE email = e
      RETURNING * INTO row;
    RETURN jsonb_build_object('locked', true, 'locked_until', row.locked_until);
  END IF;

  UPDATE public.login_attempts
    SET attempts = row.attempts + 1, last_attempt_at = now()
    WHERE email = e
    RETURNING * INTO row;
  RETURN jsonb_build_object('locked', false, 'attempts_left', max_attempts - row.attempts);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_login_lock(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(text, boolean) TO anon, authenticated;

-- 2. Merchant orders extensions
ALTER TABLE public.merchant_orders
  ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS delivery_fee int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_location jsonb,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS print_file_url text,
  ADD COLUMN IF NOT EXISTS print_specs jsonb;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_orders_delivery_method_chk') THEN
    ALTER TABLE public.merchant_orders
      ADD CONSTRAINT merchant_orders_delivery_method_chk
      CHECK (delivery_method IN ('pickup','merchant_delivery','runner'));
  END IF;
END $$;

-- 3. Merchant capabilities
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS offers_delivery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_fee int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_print_shop boolean NOT NULL DEFAULT false;
