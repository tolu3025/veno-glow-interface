
-- Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_e164 text;

-- OTP table
CREATE TABLE IF NOT EXISTS public.phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_otps_user_created ON public.phone_otps(user_id, created_at DESC);

ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own otps"
  ON public.phone_otps FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Consume OTP
CREATE OR REPLACE FUNCTION public.consume_phone_otp(p_user_id uuid, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_otp phone_otps%ROWTYPE;
  v_hash text;
BEGIN
  v_hash := encode(digest(p_code, 'sha256'), 'hex');

  SELECT * INTO v_otp FROM phone_otps
    WHERE user_id = p_user_id AND verified_at IS NULL
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

  IF v_otp.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active code. Request a new one.');
  END IF;

  IF v_otp.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code expired. Request a new one.');
  END IF;

  IF v_otp.attempts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Too many attempts. Request a new code.');
  END IF;

  IF v_otp.code_hash <> v_hash THEN
    UPDATE phone_otps SET attempts = attempts + 1 WHERE id = v_otp.id;
    RETURN jsonb_build_object('success', false, 'error', 'Incorrect code.');
  END IF;

  UPDATE phone_otps SET verified_at = now() WHERE id = v_otp.id;
  UPDATE profiles
    SET phone_verified_at = now(),
        phone_e164 = v_otp.phone_e164
    WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Ensure pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update errand notification trigger to also notify the requester on delivery
CREATE OR REPLACE FUNCTION public.notify_on_errand_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.status = 'open' AND NEW.status = 'accepted' THEN
    PERFORM create_notification(
      NEW.requester_id,
      'Errand Accepted',
      'Someone accepted your errand: ' || NEW.title,
      'errand',
      jsonb_build_object('errand_id', NEW.id)
    );
  ELSIF OLD.status = 'accepted' AND NEW.status = 'in_progress' THEN
    PERFORM create_notification(
      NEW.requester_id,
      'Errand In Progress',
      'Your errand is being worked on: ' || NEW.title,
      'errand',
      jsonb_build_object('errand_id', NEW.id)
    );
  ELSIF OLD.status = 'in_progress' AND NEW.status = 'completed' THEN
    -- Notify requester (customer) that order/errand has been delivered
    PERFORM create_notification(
      NEW.requester_id,
      'Delivered ✅',
      'Your order has been delivered: ' || NEW.title,
      'merchant',
      jsonb_build_object('errand_id', NEW.id)
    );
    IF NEW.helper_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.helper_id,
        'Errand Completed',
        'Payment released for: ' || NEW.title,
        'errand',
        jsonb_build_object('errand_id', NEW.id)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
