-- Fix existing duplicate subjects by trimming whitespace
UPDATE public.questions SET subject = TRIM(subject) WHERE subject != TRIM(subject);

-- Grant AI test access to williamsbenjaminacc@gmail.com (user_id: ae53686d-c8ae-471e-be9d-4c4293fd8be9)
INSERT INTO public.user_feature_access (user_id, feature_type, access_count, unlimited_access, expires_at)
VALUES (
  'ae53686d-c8ae-471e-be9d-4c4293fd8be9',
  'ai_test',
  -1,
  true,
  NOW() + INTERVAL '6 months'
)
ON CONFLICT (user_id, feature_type) 
DO UPDATE SET unlimited_access = true, expires_at = NOW() + INTERVAL '6 months', updated_at = NOW();