-- Allow voice_tutor feature type in billing tables

ALTER TABLE public.user_payments
  DROP CONSTRAINT IF EXISTS user_payments_payment_type_check;

ALTER TABLE public.user_payments
  ADD CONSTRAINT user_payments_payment_type_check
  CHECK (payment_type = ANY (ARRAY['manual_test'::text, 'ai_test'::text, 'voice_tutor'::text]));

ALTER TABLE public.user_feature_access
  DROP CONSTRAINT IF EXISTS user_feature_access_feature_type_check;

ALTER TABLE public.user_feature_access
  ADD CONSTRAINT user_feature_access_feature_type_check
  CHECK (feature_type = ANY (ARRAY['manual_test'::text, 'ai_test'::text, 'voice_tutor'::text]));
