CREATE OR REPLACE FUNCTION public.acquire_convert_crypto_lock(_user uuid, _asset text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_lock(hashtextextended(_user::text || ':' || _asset, 0));
END;
$$;

CREATE OR REPLACE FUNCTION public.release_convert_crypto_lock(_user uuid, _asset text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_unlock(hashtextextended(_user::text || ':' || _asset, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_convert_crypto_lock(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_convert_crypto_lock(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.acquire_convert_crypto_lock(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_convert_crypto_lock(uuid, text) TO service_role;