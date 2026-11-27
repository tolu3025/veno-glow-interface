DELETE FROM auth.refresh_tokens
WHERE user_id::text IN (
  SELECT id::text FROM public.profiles
  WHERE kyc_status IN ('pending','unverified','submitted','rejected')
     OR COALESCE(kyc_level, 0) < 1
);

DELETE FROM auth.sessions
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE kyc_status IN ('pending','unverified','submitted','rejected')
     OR COALESCE(kyc_level, 0) < 1
);