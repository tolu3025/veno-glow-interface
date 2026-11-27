
-- =========================================================================
-- Dollar Vault: tables, helpers, RLS
-- =========================================================================

-- 1) usd_wallets ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usd_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  available_usd NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (available_usd >= 0),
  locked_usd    NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (locked_usd >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.usd_wallets TO authenticated;
GRANT ALL ON public.usd_wallets TO service_role;
ALTER TABLE public.usd_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usd wallet" ON public.usd_wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2) fx_quotes ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fx_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('ngn_to_usd','usd_to_ngn')),
  rate NUMERIC(18,6) NOT NULL CHECK (rate > 0),
  ngn_amount NUMERIC(18,2) NOT NULL CHECK (ngn_amount > 0),
  usd_amount NUMERIC(18,4) NOT NULL CHECK (usd_amount > 0),
  provider_quote_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','consumed','expired','cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fx_quotes_user_created_idx ON public.fx_quotes(user_id, created_at DESC);
GRANT SELECT ON public.fx_quotes TO authenticated;
GRANT ALL ON public.fx_quotes TO service_role;
ALTER TABLE public.fx_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own fx quotes" ON public.fx_quotes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3) usd_conversions ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usd_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('ngn_to_usd','usd_to_ngn')),
  ngn_amount NUMERIC(18,2) NOT NULL,
  usd_amount NUMERIC(18,4) NOT NULL,
  rate NUMERIC(18,6) NOT NULL,
  fx_quote_id UUID REFERENCES public.fx_quotes(id) ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','reversed')),
  provider_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usd_conversions_user_idx ON public.usd_conversions(user_id, created_at DESC);
GRANT SELECT ON public.usd_conversions TO authenticated;
GRANT ALL ON public.usd_conversions TO service_role;
ALTER TABLE public.usd_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own conversions" ON public.usd_conversions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4) dollar_locks ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dollar_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  principal_usd NUMERIC(18,4) NOT NULL CHECK (principal_usd > 0),
  lock_days INTEGER NOT NULL CHECK (lock_days IN (7,30,90,180,365)),
  challenge_name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mature_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','matured','broken')),
  penalty_applied BOOLEAN NOT NULL DEFAULT false,
  penalty_usd NUMERIC(18,4) NOT NULL DEFAULT 0,
  matured_at TIMESTAMPTZ,
  broken_at TIMESTAMPTZ,
  reminded_24h BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dollar_locks_user_idx ON public.dollar_locks(user_id, status);
CREATE INDEX IF NOT EXISTS dollar_locks_mature_idx ON public.dollar_locks(status, mature_at);
GRANT SELECT ON public.dollar_locks TO authenticated;
GRANT ALL ON public.dollar_locks TO service_role;
ALTER TABLE public.dollar_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own locks" ON public.dollar_locks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5) dollar_lock_events ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dollar_lock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id UUID NOT NULL REFERENCES public.dollar_locks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created','warned_24h','matured','broken')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dollar_lock_events_lock_idx ON public.dollar_lock_events(lock_id, created_at);
GRANT SELECT ON public.dollar_lock_events TO authenticated;
GRANT ALL ON public.dollar_lock_events TO service_role;
ALTER TABLE public.dollar_lock_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own lock events" ON public.dollar_lock_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =========================================================================
-- Timestamp trigger (reuse existing update_updated_at_column if present)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_usd_wallets_updated ON public.usd_wallets;
CREATE TRIGGER trg_usd_wallets_updated BEFORE UPDATE ON public.usd_wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_dollar_locks_updated ON public.dollar_locks;
CREATE TRIGGER trg_dollar_locks_updated BEFORE UPDATE ON public.dollar_locks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================================
-- Helpers
-- =========================================================================

-- KYC gate for locks (Tier 3 = BVN)
CREATE OR REPLACE FUNCTION public.has_bvn_kyc(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT kyc_level >= 3 FROM public.profiles WHERE id = _user_id), false);
$$;

-- Ensure wallet row exists
CREATE OR REPLACE FUNCTION public.ensure_usd_wallet(_user_id UUID)
RETURNS public.usd_wallets LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.usd_wallets;
BEGIN
  SELECT * INTO w FROM public.usd_wallets WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.usd_wallets(user_id) VALUES (_user_id) RETURNING * INTO w;
  END IF;
  RETURN w;
END; $$;

-- Apply an FX conversion atomically
-- direction: 'ngn_to_usd' debits wallets.available_balance, credits usd_wallets.available_usd
-- 'usd_to_ngn' does the reverse
CREATE OR REPLACE FUNCTION public.apply_fx_conversion(
  _user_id UUID, _quote_id UUID, _reference TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.fx_quotes;
  ngn_bal NUMERIC;
  usd public.usd_wallets;
BEGIN
  SELECT * INTO q FROM public.fx_quotes WHERE id = _quote_id AND user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'quote_not_found'); END IF;
  IF q.status <> 'pending' THEN RETURN jsonb_build_object('success', false, 'error', 'quote_'||q.status); END IF;
  IF q.expires_at < now() THEN
    UPDATE public.fx_quotes SET status='expired' WHERE id=q.id;
    RETURN jsonb_build_object('success', false, 'error', 'quote_expired');
  END IF;

  usd := public.ensure_usd_wallet(_user_id);

  IF q.direction = 'ngn_to_usd' THEN
    SELECT available_balance INTO ngn_bal FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
    IF ngn_bal IS NULL OR ngn_bal < q.ngn_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_ngn');
    END IF;
    UPDATE public.wallets SET available_balance = available_balance - q.ngn_amount WHERE user_id = _user_id;
    UPDATE public.usd_wallets SET available_usd = available_usd + q.usd_amount WHERE user_id = _user_id;
  ELSE
    IF usd.available_usd < q.usd_amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'insufficient_usd');
    END IF;
    UPDATE public.usd_wallets SET available_usd = available_usd - q.usd_amount WHERE user_id = _user_id;
    UPDATE public.wallets SET available_balance = available_balance + q.ngn_amount WHERE user_id = _user_id;
  END IF;

  UPDATE public.fx_quotes SET status='consumed' WHERE id=q.id;

  INSERT INTO public.usd_conversions(user_id, direction, ngn_amount, usd_amount, rate, fx_quote_id, reference, status)
  VALUES (_user_id, q.direction, q.ngn_amount, q.usd_amount, q.rate, q.id, _reference, 'completed');

  RETURN jsonb_build_object('success', true, 'direction', q.direction,
                            'ngn_amount', q.ngn_amount, 'usd_amount', q.usd_amount, 'rate', q.rate);
END; $$;

-- Create a lock (Tier 3 only)
CREATE OR REPLACE FUNCTION public.create_dollar_lock(
  _user_id UUID, _usd NUMERIC, _days INTEGER, _challenge TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lock_row public.dollar_locks; usd public.usd_wallets;
BEGIN
  IF NOT public.has_bvn_kyc(_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'bvn_required');
  END IF;
  IF _days NOT IN (7,30,90,180,365) THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_period');
  END IF;
  IF _usd <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  usd := public.ensure_usd_wallet(_user_id);
  IF usd.available_usd < _usd THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_usd');
  END IF;

  UPDATE public.usd_wallets
    SET available_usd = available_usd - _usd, locked_usd = locked_usd + _usd
    WHERE user_id = _user_id;

  INSERT INTO public.dollar_locks(user_id, principal_usd, lock_days, challenge_name, mature_at)
  VALUES (_user_id, _usd, _days, _challenge, now() + (_days || ' days')::interval)
  RETURNING * INTO lock_row;

  INSERT INTO public.dollar_lock_events(lock_id, user_id, event_type, metadata)
  VALUES (lock_row.id, _user_id, 'created', jsonb_build_object('days', _days, 'usd', _usd));

  RETURN jsonb_build_object('success', true, 'lock_id', lock_row.id, 'mature_at', lock_row.mature_at);
END; $$;

-- Break lock early with penalty. _current_rate is NGN per 1 USD (used only to
-- convert the ₦500 floor into USD for comparison).
CREATE OR REPLACE FUNCTION public.break_dollar_lock(
  _user_id UUID, _lock_id UUID, _current_rate NUMERIC
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  lk public.dollar_locks;
  pct_penalty NUMERIC;
  floor_penalty_usd NUMERIC;
  penalty_usd NUMERIC;
  release_usd NUMERIC;
BEGIN
  SELECT * INTO lk FROM public.dollar_locks WHERE id=_lock_id AND user_id=_user_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'not_found'); END IF;
  IF lk.status <> 'active' THEN RETURN jsonb_build_object('success', false, 'error', 'not_active'); END IF;
  IF _current_rate <= 0 THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_rate'); END IF;

  pct_penalty := ROUND((lk.principal_usd * 0.02)::numeric, 4);
  floor_penalty_usd := ROUND((500.0 / _current_rate)::numeric, 4);
  penalty_usd := GREATEST(pct_penalty, floor_penalty_usd);
  IF penalty_usd > lk.principal_usd THEN penalty_usd := lk.principal_usd; END IF;
  release_usd := lk.principal_usd - penalty_usd;

  UPDATE public.usd_wallets
    SET locked_usd = locked_usd - lk.principal_usd,
        available_usd = available_usd + release_usd
    WHERE user_id = _user_id;

  UPDATE public.dollar_locks
    SET status='broken', broken_at=now(), penalty_applied=true, penalty_usd=penalty_usd
    WHERE id=lk.id;

  INSERT INTO public.dollar_lock_events(lock_id, user_id, event_type, metadata)
  VALUES (lk.id, _user_id, 'broken', jsonb_build_object('penalty_usd', penalty_usd, 'released_usd', release_usd));

  RETURN jsonb_build_object('success', true, 'penalty_usd', penalty_usd, 'released_usd', release_usd);
END; $$;

-- Mature all locks whose time is up (called by cron)
CREATE OR REPLACE FUNCTION public.mature_due_dollar_locks()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lk RECORD; count_matured INT := 0;
BEGIN
  FOR lk IN
    SELECT * FROM public.dollar_locks
    WHERE status='active' AND mature_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.usd_wallets
      SET locked_usd = locked_usd - lk.principal_usd,
          available_usd = available_usd + lk.principal_usd
      WHERE user_id = lk.user_id;

    UPDATE public.dollar_locks
      SET status='matured', matured_at=now()
      WHERE id=lk.id;

    INSERT INTO public.dollar_lock_events(lock_id, user_id, event_type, metadata)
    VALUES (lk.id, lk.user_id, 'matured', jsonb_build_object('usd', lk.principal_usd));

    INSERT INTO public.notifications(user_id, type, title, message, metadata)
    VALUES (lk.user_id, 'dollar_lock_matured',
            'Your Dollar Vault is unlocked! 🎉',
            'Your $'||lk.principal_usd||' savings challenge is complete.',
            jsonb_build_object('lock_id', lk.id, 'usd', lk.principal_usd));

    count_matured := count_matured + 1;
  END LOOP;
  RETURN jsonb_build_object('matured', count_matured);
END; $$;

-- 24h reminder pass
CREATE OR REPLACE FUNCTION public.remind_upcoming_dollar_locks()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lk RECORD; count_notified INT := 0;
BEGIN
  FOR lk IN
    SELECT * FROM public.dollar_locks
    WHERE status='active' AND reminded_24h=false
      AND mature_at <= now() + interval '24 hours'
      AND mature_at > now()
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.dollar_locks SET reminded_24h=true WHERE id=lk.id;
    INSERT INTO public.dollar_lock_events(lock_id, user_id, event_type)
    VALUES (lk.id, lk.user_id, 'warned_24h');
    INSERT INTO public.notifications(user_id, type, title, message, metadata)
    VALUES (lk.user_id, 'dollar_lock_reminder',
            'Your Dollar Vault unlocks in 24 hours ⏰',
            'Get ready — your $'||lk.principal_usd||' savings challenge finishes tomorrow.',
            jsonb_build_object('lock_id', lk.id));
    count_notified := count_notified + 1;
  END LOOP;
  RETURN jsonb_build_object('notified', count_notified);
END; $$;
