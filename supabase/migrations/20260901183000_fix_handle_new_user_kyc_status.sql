-- Migration: Fix handle_new_user kyc_status for newly registered users
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
  v_kyc_status text := 'verified';
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
        v_kyc_status := 'verified';
      ELSE
        v_kyc_level := 0;
        v_kyc_status := 'unverified';
      END IF;
    ELSE
      v_kyc_level := 1;
      v_kyc_status := 'verified';
    END IF;
  ELSE
    v_kyc_level := 1;
    v_kyc_status := 'verified';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone_number, university, matric_number, kyc_level, kyc_status)
  VALUES (NEW.id, v_full_name, v_phone, v_university, v_matric, v_kyc_level, v_kyc_status);

  RETURN NEW;
END;
$function$;
