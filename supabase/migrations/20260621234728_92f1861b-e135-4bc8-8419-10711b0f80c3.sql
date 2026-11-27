
-- 1. Table
CREATE TABLE public.campus_matric_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id uuid NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  pattern_regex text NOT NULL,
  example text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campus_id)
);

GRANT SELECT ON public.campus_matric_patterns TO anon, authenticated;
GRANT ALL ON public.campus_matric_patterns TO service_role;

ALTER TABLE public.campus_matric_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read matric patterns"
  ON public.campus_matric_patterns FOR SELECT
  USING (true);

CREATE POLICY "Admins manage matric patterns"
  ON public.campus_matric_patterns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_campus_matric_patterns_touch
  BEFORE UPDATE ON public.campus_matric_patterns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Seed FUOYE + UNIOSUN patterns (only if those campuses exist)
INSERT INTO public.campus_matric_patterns (campus_id, pattern_regex, example)
SELECT c.id, '^[A-Z]{2,3}/[0-9]{4}/[0-9]{1,4}$', 'SEN/2024/1085'
FROM public.campuses c
WHERE lower(c.name) LIKE '%fuoye%'
   OR lower(c.name) LIKE '%federal university%oye%'
   OR EXISTS (SELECT 1 FROM unnest(c.aliases) a WHERE lower(a) LIKE '%fuoye%')
ON CONFLICT (campus_id) DO NOTHING;

INSERT INTO public.campus_matric_patterns (campus_id, pattern_regex, example)
SELECT c.id, '^[0-9]{4}/[0-9]{5}$', '2024/58702'
FROM public.campuses c
WHERE lower(c.name) LIKE '%uniosun%'
   OR lower(c.name) LIKE '%osun state university%'
   OR EXISTS (SELECT 1 FROM unnest(c.aliases) a WHERE lower(a) LIKE '%uniosun%')
ON CONFLICT (campus_id) DO NOTHING;

-- 3. Replace handle_new_user to also evaluate matric pattern
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_phone text := COALESCE(NEW.raw_user_meta_data->>'phone_number', '');
  v_university text := COALESCE(NEW.raw_user_meta_data->>'university', '');
  v_matric text := COALESCE(NEW.raw_user_meta_data->>'matric_number', '');
  v_campus_id uuid;
  v_pattern text;
  v_kyc_level int := 1;
  v_kyc_status text := 'unverified';
BEGIN
  SELECT c.id INTO v_campus_id
  FROM public.campuses c
  WHERE c.is_active = true
    AND (
      lower(c.name) = lower(trim(v_university))
      OR EXISTS (SELECT 1 FROM unnest(c.aliases) a WHERE lower(a) = lower(trim(v_university)))
    )
  LIMIT 1;

  IF v_campus_id IS NOT NULL THEN
    SELECT pattern_regex INTO v_pattern
    FROM public.campus_matric_patterns
    WHERE campus_id = v_campus_id;

    IF v_pattern IS NOT NULL THEN
      IF trim(v_matric) ~ v_pattern THEN
        v_kyc_level := 1;
        v_kyc_status := 'unverified';
      ELSE
        v_kyc_level := 0;
        v_kyc_status := 'pending_docs';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone_number, university, matric_number, kyc_level, kyc_status)
  VALUES (NEW.id, v_full_name, v_phone, v_university, v_matric, v_kyc_level, v_kyc_status);

  RETURN NEW;
END;
$function$;
