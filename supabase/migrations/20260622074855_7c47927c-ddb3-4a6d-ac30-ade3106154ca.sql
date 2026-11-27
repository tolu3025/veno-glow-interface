
-- 1. Add flagging columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS matric_flagged_at timestamptz,
  ADD COLUMN IF NOT EXISTS matric_correction_deadline timestamptz;

-- 2. Backfill: flag existing profiles whose matric fails their campus regex
WITH bad AS (
  SELECT p.id
  FROM public.profiles p
  JOIN public.campuses c
    ON c.is_active = true
   AND (lower(c.name) = lower(trim(p.university))
        OR EXISTS (SELECT 1 FROM unnest(c.aliases) a WHERE lower(a) = lower(trim(p.university))))
  JOIN public.campus_matric_patterns cmp ON cmp.campus_id = c.id
  WHERE trim(p.matric_number) !~ cmp.pattern_regex
    AND p.matric_flagged_at IS NULL
)
UPDATE public.profiles p
SET matric_flagged_at = now(),
    matric_correction_deadline = now() + interval '14 days'
FROM bad
WHERE p.id = bad.id;

-- 3. Notify flagged users (in-app)
INSERT INTO public.notifications (user_id, title, message, type, metadata)
SELECT p.id,
       'Action required: verify your matric number',
       'Your matric number doesn''t match your campus format. Email support@kukapay.com.ng within 14 days to correct it, or your account will be suspended on ' || to_char(p.matric_correction_deadline, 'DD Mon YYYY') || '.',
       'matric_correction_required',
       jsonb_build_object('deadline', p.matric_correction_deadline, 'support_email', 'support@kukapay.com.ng')
FROM public.profiles p
WHERE p.matric_flagged_at IS NOT NULL
  AND p.matric_correction_deadline > now()
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = p.id AND n.type = 'matric_correction_required'
  );

-- 4. Replace validate_profile_matric trigger fn to clear flags when matric becomes valid
CREATE OR REPLACE FUNCTION public.validate_profile_matric()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  IF v_pattern IS NOT NULL THEN
    IF trim(NEW.matric_number) !~ v_pattern THEN
      RAISE EXCEPTION 'invalid_matric_format'
        USING HINT = COALESCE('Expected format like ' || v_example, 'Matric number does not match your campus format.');
    ELSE
      -- Valid matric: clear any prior flag and lift matric-related suspension
      NEW.matric_flagged_at := NULL;
      NEW.matric_correction_deadline := NULL;
      IF NEW.is_suspended IS TRUE AND NEW.suspended_reason = 'matric_correction_overdue' THEN
        NEW.is_suspended := false;
        NEW.suspended_reason := NULL;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5. Auto-suspend function for expired deadlines
CREATE OR REPLACE FUNCTION public.auto_suspend_expired_matric_flags()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH suspended AS (
    UPDATE public.profiles p
    SET is_suspended = true,
        suspended_reason = 'matric_correction_overdue',
        updated_at = now()
    WHERE p.matric_flagged_at IS NOT NULL
      AND p.matric_correction_deadline <= now()
      AND p.is_suspended = false
    RETURNING p.id
  )
  SELECT count(*) INTO v_count FROM suspended;
  RETURN v_count;
END;
$$;

-- 6. Hourly cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-suspend-matric-flags') THEN
    PERFORM cron.unschedule('auto-suspend-matric-flags');
  END IF;
END $$;
SELECT cron.schedule('auto-suspend-matric-flags', '0 * * * *',
  $$ SELECT public.auto_suspend_expired_matric_flags(); $$);
