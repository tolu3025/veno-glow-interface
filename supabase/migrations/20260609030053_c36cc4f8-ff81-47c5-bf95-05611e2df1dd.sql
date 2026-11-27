
-- Rate limiting primitive
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, action, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(key, action, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.rate_limits(window_start);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO authenticated;
GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- service_role bypasses RLS; deny direct authenticated access by adding no policies.

-- Atomic checker. Returns jsonb { allowed: bool, count: int, limit: int, retry_after_seconds: int }.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _action text,
  _max_requests int,
  _window_seconds int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count int;
BEGIN
  v_window_start := date_trunc('second', now()) - ((extract(epoch from now())::bigint % _window_seconds) || ' seconds')::interval;

  INSERT INTO public.rate_limits(key, action, window_start, count)
  VALUES (_key, _action, v_window_start, 1)
  ON CONFLICT (key, action, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO v_count;

  -- best-effort cleanup of old windows (>1 day)
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';

  IF v_count > _max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'count', v_count,
      'limit', _max_requests,
      'retry_after_seconds', _window_seconds - (extract(epoch from now())::bigint % _window_seconds)
    );
  END IF;

  RETURN jsonb_build_object('allowed', true, 'count', v_count, 'limit', _max_requests);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) TO authenticated, anon, service_role;

-- Merchant orders: delivery + printing fields
ALTER TABLE public.merchant_orders
  ADD COLUMN IF NOT EXISTS delivery_method text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_location jsonb,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS print_file_url text,
  ADD COLUMN IF NOT EXISTS print_file_name text,
  ADD COLUMN IF NOT EXISTS print_specs jsonb;
