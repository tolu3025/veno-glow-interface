
-- Fix profiles that were auto-elevated past their approved doc level due to
-- approve_kyc defaulting to level 2. Reset kyc_level to the highest still-approved doc.
UPDATE public.profiles p
SET kyc_level = COALESCE((
  SELECT MAX(kyc_level) FROM public.kyc_documents kd
  WHERE kd.user_id = p.id AND kd.verification_status = 'approved'
), 0)
WHERE p.kyc_status = 'verified'
  AND p.kyc_level > COALESCE((
    SELECT MAX(kyc_level) FROM public.kyc_documents kd
    WHERE kd.user_id = p.id AND kd.verification_status = 'approved'
  ), 0);
