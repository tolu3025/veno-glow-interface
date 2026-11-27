-- Migration: Add 2FA and Biometrics settings to profiles table & OTP tracking table

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS two_factor_method TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS biometric_credential_id TEXT;

-- Table to store temporary login 2FA OTP codes
CREATE TABLE IF NOT EXISTS public.user_2fa_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_2fa_otps_email ON public.user_2fa_otps(email, otp_code);

-- Enable RLS
ALTER TABLE public.user_2fa_otps ENABLE ROW LEVEL SECURITY;

-- Policies for 2FA OTPs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_2fa_otps' AND policyname = 'Allow public insert for login 2FA'
  ) THEN
    CREATE POLICY "Allow public insert for login 2FA"
      ON public.user_2fa_otps
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_2fa_otps' AND policyname = 'Allow public select for verification'
  ) THEN
    CREATE POLICY "Allow public select for verification"
      ON public.user_2fa_otps
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Function to check if a user has 2FA enabled by email
CREATE OR REPLACE FUNCTION public.check_user_2fa_status(_email TEXT)
RETURNS TABLE (
  two_factor_enabled BOOLEAN,
  biometric_enabled BOOLEAN,
  two_factor_method TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.two_factor_enabled, FALSE),
    COALESCE(p.biometric_enabled, FALSE),
    COALESCE(p.two_factor_method, 'email')
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE LOWER(u.email) = LOWER(_email);
END;
$$;
