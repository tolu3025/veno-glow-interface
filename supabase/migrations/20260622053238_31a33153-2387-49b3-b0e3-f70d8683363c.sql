
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
  VALUES (NEW.id, v_full_name, v_phone, v_university, v_matric, 1, 'unverified');

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_profile_matric()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_campus_id uuid;
  v_pattern text;
  v_example text;
BEGIN
  IF NEW.matric_number IS NULL OR trim(NEW.matric_number) = ''
     OR NEW.university IS NULL OR trim(NEW.university) = '' THEN
    RETURN NEW;
  END IF;

  SELECT c.id INTO v_campus_id
  FROM public.campuses c
  WHERE c.is_active = true
    AND (
      lower(c.name) = lower(trim(NEW.university))
      OR EXISTS (SELECT 1 FROM unnest(c.aliases) a WHERE lower(a) = lower(trim(NEW.university)))
    )
  LIMIT 1;

  IF v_campus_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT pattern_regex, example INTO v_pattern, v_example
  FROM public.campus_matric_patterns
  WHERE campus_id = v_campus_id;

  IF v_pattern IS NOT NULL AND trim(NEW.matric_number) !~ v_pattern THEN
    RAISE EXCEPTION 'invalid_matric_format'
      USING HINT = COALESCE('Expected format like ' || v_example, 'Matric number does not match your campus format.');
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS validate_profile_matric_trigger ON public.profiles;
CREATE TRIGGER validate_profile_matric_trigger
BEFORE INSERT OR UPDATE OF matric_number, university ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_matric();
