
-- 1. Registration pre-check available to signed-out visitors
CREATE OR REPLACE FUNCTION public.check_registration_identity(
  p_phone text,
  p_matric text,
  p_university text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_hit uuid;
  v_campus_id uuid;
  v_pattern text;
  v_example text;
BEGIN
  IF p_phone IS NOT NULL AND btrim(p_phone) <> '' THEN
    v_norm := right(regexp_replace(p_phone, '\D', '', 'g'), 10);
    IF length(v_norm) = 10 THEN
      SELECT id INTO v_hit FROM public.profiles
      WHERE phone_number IS NOT NULL
        AND right(regexp_replace(phone_number, '\D', '', 'g'), 10) = v_norm
      LIMIT 1;
      IF v_hit IS NOT NULL THEN RETURN 'phone_taken'; END IF;
    END IF;
  END IF;

  IF p_matric IS NOT NULL AND btrim(p_matric) <> '' THEN
    v_norm := upper(regexp_replace(p_matric, '[^A-Za-z0-9]', '', 'g'));
    SELECT id INTO v_hit FROM public.profiles
    WHERE matric_number IS NOT NULL
      AND upper(regexp_replace(matric_number, '[^A-Za-z0-9]', '', 'g')) = v_norm
    LIMIT 1;
    IF v_hit IS NOT NULL THEN RETURN 'matric_taken'; END IF;

    SELECT c.id INTO v_campus_id FROM public.campuses c
    WHERE c.is_active = true
      AND (lower(c.name) = lower(btrim(coalesce(p_university,'')))
           OR EXISTS (SELECT 1 FROM unnest(c.aliases) a WHERE lower(a) = lower(btrim(coalesce(p_university,'')))))
    LIMIT 1;

    IF v_campus_id IS NOT NULL THEN
      SELECT pattern_regex, example INTO v_pattern, v_example
      FROM public.campus_matric_patterns WHERE campus_id = v_campus_id;
      IF v_pattern IS NOT NULL AND btrim(p_matric) !~ v_pattern THEN
        RETURN 'matric_format:' || coalesce(v_example, '');
      END IF;
    END IF;
  END IF;

  RETURN 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_registration_identity(text, text, text) TO anon, authenticated;

-- 2. Bank-transfer payer claims for collections
ALTER TABLE public.collection_payments
  ADD COLUMN IF NOT EXISTS payer_phone text,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS matched_at timestamptz;

CREATE INDEX IF NOT EXISTS collection_payments_pending_idx
  ON public.collection_payments (collection_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.claim_collection_payment(
  p_collection_id uuid,
  p_amount numeric,
  p_payer_name text,
  p_payer_matric text DEFAULT NULL,
  p_payer_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  IF p_payer_name IS NULL OR btrim(p_payer_name) = '' THEN
    RAISE EXCEPTION 'name_required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.collections WHERE id = p_collection_id AND status = 'active') THEN
    RAISE EXCEPTION 'collection_not_active';
  END IF;

  -- Reuse an identical unmatched claim instead of piling up duplicates
  SELECT id INTO v_id FROM public.collection_payments
  WHERE collection_id = p_collection_id
    AND status = 'pending'
    AND amount = p_amount
    AND lower(payer_name) = lower(btrim(p_payer_name))
    AND created_at > now() - interval '24 hours'
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE public.collection_payments
    SET payer_matric_number = COALESCE(NULLIF(btrim(p_payer_matric), ''), payer_matric_number),
        payer_phone = COALESCE(NULLIF(btrim(p_payer_phone), ''), payer_phone),
        claimed_at = now()
    WHERE id = v_id;
    RETURN v_id;
  END IF;

  INSERT INTO public.collection_payments
    (collection_id, amount, payer_name, payer_matric_number, payer_phone, status, webhook_verified, claimed_at)
  VALUES
    (p_collection_id, p_amount, btrim(p_payer_name), NULLIF(btrim(p_payer_matric), ''),
     NULLIF(btrim(p_payer_phone), ''), 'pending', false, now())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_collection_payment(uuid, numeric, text, text, text) TO anon, authenticated;

-- 3. Webhook helper: match an incoming transfer to a waiting claim
CREATE OR REPLACE FUNCTION public.match_collection_claim(
  p_collection_id uuid,
  p_amount numeric,
  p_payer_name text,
  p_reference text
)
RETURNS TABLE (id uuid, payer_name text, payer_matric_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT cp.id INTO v_id
  FROM public.collection_payments cp
  WHERE cp.collection_id = p_collection_id
    AND cp.status = 'pending'
    AND cp.amount = p_amount
    AND cp.created_at > now() - interval '48 hours'
  ORDER BY
    CASE WHEN p_payer_name IS NOT NULL
          AND lower(cp.payer_name) = lower(btrim(p_payer_name)) THEN 0 ELSE 1 END,
    cp.created_at ASC
  LIMIT 1;

  IF v_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.collection_payments cp
  SET status = 'confirmed',
      webhook_verified = true,
      transaction_reference = p_reference,
      matched_at = now(),
      payer_name = COALESCE(NULLIF(btrim(p_payer_name), ''), cp.payer_name)
  WHERE cp.id = v_id;

  RETURN QUERY
  SELECT cp.id, cp.payer_name, cp.payer_matric_number
  FROM public.collection_payments cp WHERE cp.id = v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_collection_claim(uuid, numeric, text, text) TO service_role;
