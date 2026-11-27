UPDATE public.kyc_documents
SET verification_status = 'pending', admin_notes = NULL
WHERE verification_status = 'rejected'
  AND reviewed_by IS NULL;

UPDATE public.profiles p
SET kyc_status = 'pending', updated_at = now()
WHERE p.kyc_status = 'rejected'
  AND NOT EXISTS (
    SELECT 1 FROM public.kyc_documents d
    WHERE d.user_id = p.id
      AND d.verification_status = 'rejected'
      AND d.reviewed_by IS NOT NULL
  )
  AND EXISTS (
    SELECT 1 FROM public.kyc_documents d
    WHERE d.user_id = p.id
      AND d.verification_status = 'pending'
  );

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;