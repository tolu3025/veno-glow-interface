-- Returns true when at least one approved runner application exists whose
-- university maps to the given campus (matches by name or alias, case-insensitive).
CREATE OR REPLACE FUNCTION public.campus_has_active_runner(p_campus_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.runner_applications ra
    JOIN public.profiles p ON p.id = ra.user_id
    JOIN public.campuses c ON c.id = p_campus_id AND c.is_active = true
    WHERE ra.status = 'approved'
      AND (
        lower(c.name) = lower(trim(p.university))
        OR EXISTS (
          SELECT 1 FROM unnest(c.aliases) a
          WHERE lower(a) = lower(trim(p.university))
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.campus_has_active_runner(uuid) TO anon, authenticated, service_role;