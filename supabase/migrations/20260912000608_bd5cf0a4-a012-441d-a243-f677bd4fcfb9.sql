CREATE TABLE IF NOT EXISTS public.user_2fa_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_2fa_otps_lookup_idx ON public.user_2fa_otps (email, otp_code, used, expires_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.user_2fa_otps TO authenticated;
GRANT ALL ON public.user_2fa_otps TO service_role;

ALTER TABLE public.user_2fa_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users manage codes for their own email" ON public.user_2fa_otps;
CREATE POLICY "Signed-in users manage codes for their own email"
  ON public.user_2fa_otps
  FOR ALL
  TO authenticated
  USING (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')))
  WITH CHECK (lower(email) = lower(coalesce((auth.jwt() ->> 'email'), '')));