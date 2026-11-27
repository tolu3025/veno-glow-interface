CREATE TABLE public.phone_otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  otp_reference text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_otp_user ON public.phone_otp_requests(user_id, created_at DESC);
CREATE INDEX idx_phone_otp_ref ON public.phone_otp_requests(otp_reference);

ALTER TABLE public.phone_otp_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own otp requests"
  ON public.phone_otp_requests FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;