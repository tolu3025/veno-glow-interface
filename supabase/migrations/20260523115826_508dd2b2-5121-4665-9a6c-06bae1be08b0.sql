
-- 1. collection_payments: restrict SELECT to collection creator + admins
DROP POLICY IF EXISTS "Authenticated users can read collection payments" ON public.collection_payments;
CREATE POLICY "Creator or admin can read collection payments"
  ON public.collection_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_payments.collection_id
        AND c.creator_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 2. collections: hide financial/virtual-account columns from client roles
REVOKE SELECT (virtual_account_number, virtual_bank_name, flutterwave_reference)
  ON public.collections FROM anon, authenticated;

-- 3. events: hide settlement + virtual account columns from client roles
REVOKE SELECT (
  settlement_account_number,
  settlement_account_name,
  settlement_bank_name,
  virtual_account_number,
  virtual_bank_name,
  flutterwave_reference
) ON public.events FROM anon, authenticated;

-- 4. merchants: hide settlement bank columns from client roles
REVOKE SELECT (
  settlement_account_number,
  settlement_bank_name,
  settlement_account_name
) ON public.merchants FROM anon, authenticated;

-- 5. errand_requests: hide precise GPS coordinates from client roles
REVOKE SELECT (
  requester_lat,
  requester_lng,
  helper_lat,
  helper_lng,
  delivery_lat,
  delivery_lng
) ON public.errand_requests FROM anon, authenticated;

-- 6. errand_assignments: restrict SELECT to participants + admins
DROP POLICY IF EXISTS "Authenticated users can read assignments" ON public.errand_assignments;
CREATE POLICY "Participants or admin can read assignments"
  ON public.errand_assignments
  FOR SELECT
  TO authenticated
  USING (
    helper_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.errand_requests er
      WHERE er.id = errand_assignments.errand_id
        AND er.requester_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 7. has_role: prevent leaking another user's role membership
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _user_id IS NULL OR auth.uid() IS NULL THEN false
    WHEN _user_id <> auth.uid()
         AND NOT EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_id = auth.uid() AND role = 'admin'::app_role
         )
      THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
  END
$function$;

-- 8. Storage: owners can update/delete their own files in event-images and merchant-images buckets
CREATE POLICY "Owners can update event-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete event-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can update merchant-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'merchant-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners can delete merchant-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'merchant-images' AND auth.uid()::text = (storage.foldername(name))[1]);
