
-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- 1. Campuses table
CREATE TABLE public.campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  aliases text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX campuses_name_lower_idx ON public.campuses (lower(name));

ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active campuses"
  ON public.campuses FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage campuses (insert)"
  ON public.campuses FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage campuses (update)"
  ON public.campuses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage campuses (delete)"
  ON public.campuses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER campuses_updated_at
  BEFORE UPDATE ON public.campuses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Seed campuses from existing profile.university values
INSERT INTO public.campuses (name)
SELECT DISTINCT trim(university)
FROM public.profiles
WHERE university IS NOT NULL AND trim(university) <> ''
ON CONFLICT (lower(name)) DO NOTHING;

-- 3. Helper: resolve a user's campus from their profile.university
CREATE OR REPLACE FUNCTION public.get_user_campus_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.profiles p
  JOIN public.campuses c
    ON c.is_active = true
   AND (
        lower(c.name) = lower(trim(p.university))
        OR EXISTS (
          SELECT 1 FROM unnest(c.aliases) a
          WHERE lower(a) = lower(trim(p.university))
        )
   )
  WHERE p.id = _user_id
  LIMIT 1
$$;

-- 4. Add campus_id
ALTER TABLE public.merchants ADD COLUMN campus_id uuid REFERENCES public.campuses(id);
ALTER TABLE public.errand_requests ADD COLUMN campus_id uuid REFERENCES public.campuses(id);

-- 5. Backfill
UPDATE public.merchants m
SET campus_id = public.get_user_campus_id(m.user_id)
WHERE m.campus_id IS NULL;

UPDATE public.errand_requests e
SET campus_id = public.get_user_campus_id(e.requester_id)
WHERE e.campus_id IS NULL;

CREATE INDEX merchants_campus_id_idx ON public.merchants(campus_id);
CREATE INDEX errand_requests_campus_id_idx ON public.errand_requests(campus_id);

-- 6. Auto-fill triggers
CREATE OR REPLACE FUNCTION public.set_merchant_campus()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.campus_id IS NULL THEN
    NEW.campus_id := public.get_user_campus_id(NEW.user_id);
  END IF;
  IF NEW.campus_id IS NULL THEN
    RAISE EXCEPTION 'No campus found for user. Please set your university in your profile first.';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER merchants_set_campus
  BEFORE INSERT ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.set_merchant_campus();

CREATE OR REPLACE FUNCTION public.set_errand_campus()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.campus_id IS NULL THEN
    NEW.campus_id := public.get_user_campus_id(NEW.requester_id);
  END IF;
  IF NEW.campus_id IS NULL THEN
    RAISE EXCEPTION 'No campus found for user. Please set your university in your profile first.';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER errand_requests_set_campus
  BEFORE INSERT ON public.errand_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_errand_campus();

-- 7. RLS: campus-scoped browsing
DROP POLICY IF EXISTS "Anyone can read active merchants" ON public.merchants;
CREATE POLICY "Same-campus or owner can read merchants"
  ON public.merchants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      status = 'active'::merchant_status
      AND campus_id IS NOT NULL
      AND campus_id = public.get_user_campus_id(auth.uid())
    )
  );

DROP POLICY IF EXISTS "Anyone can read available products" ON public.merchant_products;
CREATE POLICY "Same-campus can read available products"
  ON public.merchant_products FOR SELECT TO authenticated
  USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM public.merchants m
      WHERE m.id = merchant_products.merchant_id
        AND m.status = 'active'::merchant_status
        AND (
          m.user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin'::app_role)
          OR (m.campus_id IS NOT NULL AND m.campus_id = public.get_user_campus_id(auth.uid()))
        )
    )
  );

DROP POLICY IF EXISTS "Participants, admins, or open errands readable" ON public.errand_requests;
CREATE POLICY "Same-campus open, participants, or admins can read errands"
  ON public.errand_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = requester_id
    OR auth.uid() = helper_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      status = 'open'::errand_status
      AND campus_id IS NOT NULL
      AND campus_id = public.get_user_campus_id(auth.uid())
    )
  );
