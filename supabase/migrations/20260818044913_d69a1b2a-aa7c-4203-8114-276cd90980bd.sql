CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'toyesek',
  provider_booking_id text,
  provider_reference text,
  route_id text,
  route_name text,
  landmark_id text,
  landmark_name text,
  vacation_period_id text,
  travel_date date,
  seats integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  payment_reference text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'confirmed',
  passenger_name text,
  passenger_email text,
  passenger_phone text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ride_bookings TO authenticated;
GRANT ALL ON public.ride_bookings TO service_role;

ALTER TABLE public.ride_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own ride bookings" ON public.ride_bookings;
CREATE POLICY "Users view own ride bookings" ON public.ride_bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ride_bookings_user ON public.ride_bookings(user_id, created_at DESC);