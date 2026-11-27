-- 1. Collections: drop anon read (app requires auth to pay)
DROP POLICY IF EXISTS "Anon can read active collections" ON public.collections;

-- 2. Errand requests: replace broad SELECT with scoped policy
DROP POLICY IF EXISTS "Authenticated users can read errands" ON public.errand_requests;
CREATE POLICY "Participants, admins, or open errands readable"
ON public.errand_requests
FOR SELECT
TO authenticated
USING (
  status = 'open'::errand_status
  OR auth.uid() = requester_id
  OR auth.uid() = helper_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Storage: tighten event-images INSERT to enforce folder ownership
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Users can upload event images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Storage: tighten merchant-images INSERT — folder must match a merchant owned by user
DROP POLICY IF EXISTS "Authenticated users can upload merchant images" ON storage.objects;
CREATE POLICY "Merchant owners can upload merchant images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'merchant-images'
  AND EXISTS (
    SELECT 1 FROM public.merchants
    WHERE id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
  )
);

-- 5. webhook_events: explicit deny-all (RLS enabled, no policy = effectively denied,
--    but add explicit policy so intent is clear and lint passes)
CREATE POLICY "Deny all client access to webhook_events"
ON public.webhook_events
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);
