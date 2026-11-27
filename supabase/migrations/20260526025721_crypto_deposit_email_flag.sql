ALTER TABLE public.crypto_deposits
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
