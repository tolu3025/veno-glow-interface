
-- ── NIN verification outcome on KYC docs ──
ALTER TABLE public.kyc_documents
  ADD COLUMN IF NOT EXISTS nin_verified boolean,
  ADD COLUMN IF NOT EXISTS nin_verified_name text,
  ADD COLUMN IF NOT EXISTS nin_check_notes text;

-- ── Uniqueness enforcement (trigger-based so legacy duplicates are not broken) ──
CREATE OR REPLACE FUNCTION public.enforce_unique_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_conflict uuid;
BEGIN
  IF NEW.matric_number IS NOT NULL AND btrim(NEW.matric_number) <> ''
     AND (TG_OP = 'INSERT' OR NEW.matric_number IS DISTINCT FROM OLD.matric_number) THEN
    v_norm := upper(regexp_replace(NEW.matric_number, '[^A-Za-z0-9]', '', 'g'));
    SELECT id INTO v_conflict FROM public.profiles
      WHERE id <> NEW.id
        AND matric_number IS NOT NULL
        AND upper(regexp_replace(matric_number, '[^A-Za-z0-9]', '', 'g')) = v_norm
      LIMIT 1;
    IF v_conflict IS NOT NULL THEN
      RAISE EXCEPTION 'DUPLICATE_MATRIC: This matric number is already registered to another KukaPay account.';
    END IF;
  END IF;

  IF NEW.phone_number IS NOT NULL AND btrim(NEW.phone_number) <> ''
     AND (TG_OP = 'INSERT' OR NEW.phone_number IS DISTINCT FROM OLD.phone_number) THEN
    v_norm := right(regexp_replace(NEW.phone_number, '\D', '', 'g'), 10);
    IF length(v_norm) = 10 THEN
      SELECT id INTO v_conflict FROM public.profiles
        WHERE id <> NEW.id
          AND phone_number IS NOT NULL
          AND right(regexp_replace(phone_number, '\D', '', 'g'), 10) = v_norm
        LIMIT 1;
      IF v_conflict IS NOT NULL THEN
        RAISE EXCEPTION 'DUPLICATE_PHONE: This phone number is already registered to another KukaPay account.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_unique_identity_trg ON public.profiles;
CREATE TRIGGER enforce_unique_identity_trg
  BEFORE INSERT OR UPDATE OF matric_number, phone_number ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_identity();

-- One NIN = one account
CREATE OR REPLACE FUNCTION public.enforce_unique_nin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nin text;
  v_conflict uuid;
BEGIN
  IF NEW.nin_number IS NULL OR btrim(NEW.nin_number) = '' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.nin_number IS NOT DISTINCT FROM OLD.nin_number THEN
    RETURN NEW;
  END IF;

  v_nin := regexp_replace(NEW.nin_number, '\D', '', 'g');
  SELECT user_id INTO v_conflict FROM public.kyc_documents
    WHERE user_id <> NEW.user_id
      AND nin_number IS NOT NULL
      AND regexp_replace(nin_number, '\D', '', 'g') = v_nin
    LIMIT 1;
  IF v_conflict IS NOT NULL THEN
    RAISE EXCEPTION 'DUPLICATE_NIN: This NIN is already linked to another KukaPay account.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_unique_nin_trg ON public.kyc_documents;
CREATE TRIGGER enforce_unique_nin_trg
  BEFORE INSERT OR UPDATE OF nin_number ON public.kyc_documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_nin();
