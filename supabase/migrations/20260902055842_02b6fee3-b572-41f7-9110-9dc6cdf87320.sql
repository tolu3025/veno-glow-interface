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
  v_example text;
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
    SELECT pattern_regex, example INTO v_pattern, v_example
    FROM public.campus_matric_patterns
    WHERE campus_id = v_campus_id;

    IF v_pattern IS NOT NULL AND trim(v_matric) !~ v_pattern THEN
      RAISE EXCEPTION 'invalid_matric_format'
        USING HINT = COALESCE('Expected format like ' || v_example, 'Matric number does not match your campus format.');
    END IF;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone_number, university, matric_number, kyc_level, kyc_status)
  VALUES (NEW.id, v_full_name, v_phone, v_university, v_matric, 0, 'unverified');

  RETURN NEW;
END;
$function$;

-- Reset accounts that were auto-granted a KYC level without any approved document
UPDATE public.profiles p
SET kyc_level = 0,
    kyc_status = 'unverified'
WHERE (p.kyc_level > 0 OR p.kyc_status = 'verified')
  AND NOT EXISTS (
    SELECT 1 FROM public.kyc_documents d
    WHERE d.user_id = p.id AND d.verification_status = 'approved'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.kyc_documents d
    WHERE d.user_id = p.id AND d.verification_status = 'pending'
  );