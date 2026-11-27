-- 1. Tables ------------------------------------------------------------

CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_fingerprint TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_band TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'active',
  step_up_verified_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id, status, last_seen_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own sessions readable" ON public.user_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own sessions updatable" ON public.user_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.session_risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  score_delta INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_risk_events_user ON public.session_risk_events(user_id, created_at DESC);

GRANT SELECT ON public.session_risk_events TO authenticated;
GRANT ALL ON public.session_risk_events TO service_role;
ALTER TABLE public.session_risk_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own risk events readable" ON public.session_risk_events
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ip_reputation (
  ip_address TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  failed_auth_count INTEGER NOT NULL DEFAULT 0,
  distinct_users INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ip_reputation TO service_role;
ALTER TABLE public.ip_reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read ip reputation" ON public.ip_reputation
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.ip_reputation TO authenticated;

CREATE TABLE public.ip_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'throttle',
  reason TEXT,
  blocked_until TIMESTAMPTZ,
  strikes INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_ip_blocklist_ip ON public.ip_blocklist(ip_address);
GRANT SELECT, UPDATE, DELETE ON public.ip_blocklist TO authenticated;
GRANT ALL ON public.ip_blocklist TO service_role;
ALTER TABLE public.ip_blocklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage blocklist" ON public.ip_blocklist
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_user_sessions_touch BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ip_blocklist_touch BEFORE UPDATE ON public.ip_blocklist
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Risk scoring -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.evaluate_session_risk(
  _user_id UUID,
  _fingerprint TEXT,
  _ip TEXT,
  _country TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL,
  _local_hour INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_session public.user_sessions%ROWTYPE;
  v_score INT := 0;
  v_band TEXT;
  v_reasons JSONB := '[]'::jsonb;
  v_known_device BOOLEAN := false;
  v_trusted_device BOOLEAN := false;
  v_known_country BOOLEAN := false;
  v_has_history BOOLEAN := false;
  v_last public.user_sessions%ROWTYPE;
  v_minutes NUMERIC;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing user');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_sessions WHERE user_id = _user_id) INTO v_has_history;

  SELECT true, COALESCE(is_trusted,false) INTO v_known_device, v_trusted_device
  FROM public.device_fingerprints
  WHERE user_id = _user_id AND fingerprint = _fingerprint
  LIMIT 1;
  v_known_device := COALESCE(v_known_device, false);

  IF _country IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_sessions
      WHERE user_id = _user_id AND country = _country AND created_at > now() - interval '90 days'
    ) INTO v_known_country;
  END IF;

  SELECT * INTO v_last FROM public.user_sessions
  WHERE user_id = _user_id ORDER BY last_seen_at DESC LIMIT 1;

  -- Device signals
  IF v_has_history AND NOT v_known_device THEN
    v_score := v_score + 35;
    v_reasons := v_reasons || jsonb_build_object('type','new_device');
  ELSIF v_known_device AND NOT v_trusted_device THEN
    v_score := v_score + 10;
    v_reasons := v_reasons || jsonb_build_object('type','untrusted_device');
  END IF;

  -- Location signals
  IF _country IS NOT NULL AND v_has_history AND NOT v_known_country THEN
    v_score := v_score + 30;
    v_reasons := v_reasons || jsonb_build_object('type','new_country','country',_country);
  END IF;

  -- Impossible travel: different country within 2 hours of last activity
  IF v_last.id IS NOT NULL AND _country IS NOT NULL AND v_last.country IS NOT NULL
     AND v_last.country <> _country THEN
    v_minutes := EXTRACT(EPOCH FROM (now() - v_last.last_seen_at)) / 60;
    IF v_minutes < 120 THEN
      v_score := v_score + 40;
      v_reasons := v_reasons || jsonb_build_object('type','impossible_travel','from',v_last.country,'to',_country);
    END IF;
  END IF;

  -- Odd-hour signal, only when the user has no such history
  IF _local_hour IS NOT NULL AND _local_hour >= 1 AND _local_hour < 5 AND v_has_history THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_sessions
      WHERE user_id = _user_id
        AND EXTRACT(HOUR FROM created_at) BETWEEN 1 AND 4
        AND created_at < now() - interval '1 minute'
    ) THEN
      v_score := v_score + 15;
      v_reasons := v_reasons || jsonb_build_object('type','odd_hour','hour',_local_hour);
    END IF;
  END IF;

  -- Recent failed logins from this address
  IF _ip IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.security_logs
    WHERE ip_address = _ip AND success = false AND created_at > now() - interval '1 hour'
    GROUP BY ip_address HAVING count(*) >= 3
  ) THEN
    v_score := v_score + 20;
    v_reasons := v_reasons || jsonb_build_object('type','failed_logins_from_ip');
  END IF;

  v_band := CASE WHEN v_score >= 55 THEN 'high' WHEN v_score >= 25 THEN 'elevated' ELSE 'low' END;

  INSERT INTO public.user_sessions
    (user_id, device_fingerprint, ip_address, country, city, user_agent, risk_score, risk_band)
  VALUES (_user_id, _fingerprint, _ip, _country, _city, _user_agent, v_score, v_band)
  RETURNING * INTO v_session;

  INSERT INTO public.session_risk_events(session_id, user_id, event_type, score_delta, details)
  VALUES (v_session.id, _user_id, 'session_scored', v_score,
          jsonb_build_object('band', v_band, 'reasons', v_reasons));

  IF v_band = 'high' THEN
    INSERT INTO public.fraud_flags(user_id, flag_type, description, metadata)
    VALUES (_user_id, 'high_risk_session',
            'Sign-in scored high risk from an unfamiliar device or location',
            jsonb_build_object('session_id', v_session.id, 'reasons', v_reasons, 'ip', _ip));
  END IF;

  IF _fingerprint IS NOT NULL THEN
    INSERT INTO public.device_fingerprints(user_id, fingerprint, last_seen_at)
    VALUES (_user_id, _fingerprint, now())
    ON CONFLICT (user_id, fingerprint) DO UPDATE SET last_seen_at = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'score', v_score,
    'band', v_band,
    'requires_step_up', v_band <> 'low',
    'reasons', v_reasons
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_session_risk_event(
  _session_id UUID, _event_type TEXT, _delta INTEGER DEFAULT 0, _details JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_session public.user_sessions%ROWTYPE; v_band TEXT;
BEGIN
  SELECT * INTO v_session FROM public.user_sessions WHERE id = _session_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error','Session not found'); END IF;

  INSERT INTO public.session_risk_events(session_id, user_id, event_type, score_delta, details)
  VALUES (_session_id, v_session.user_id, _event_type, _delta, _details);

  v_band := CASE WHEN v_session.risk_score + _delta >= 55 THEN 'high'
                 WHEN v_session.risk_score + _delta >= 25 THEN 'elevated' ELSE 'low' END;

  UPDATE public.user_sessions
     SET risk_score = GREATEST(0, risk_score + _delta),
         risk_band = v_band,
         last_seen_at = now(),
         step_up_verified_at = CASE WHEN v_band = 'high' THEN NULL ELSE step_up_verified_at END
   WHERE id = _session_id;

  RETURN jsonb_build_object('success', true, 'band', v_band, 'requires_step_up', v_band <> 'low');
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_session_verified(_session_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_sessions
     SET step_up_verified_at = now(), last_seen_at = now()
   WHERE id = _session_id AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error','Session not found'); END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.terminate_session(_session_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_sessions SET status = 'terminated'
   WHERE id = _session_id
     AND (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error','Session not found'); END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.terminate_other_sessions(_keep_session_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_count INT;
BEGIN
  UPDATE public.user_sessions SET status = 'terminated'
   WHERE user_id = auth.uid() AND status = 'active'
     AND (_keep_session_id IS NULL OR id <> _keep_session_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.fraud_flags(user_id, flag_type, description, metadata)
  VALUES (auth.uid(), 'user_reported_session',
          'User reported unrecognised activity and ended other sessions',
          jsonb_build_object('ended', v_count));

  RETURN jsonb_build_object('success', true, 'ended', v_count);
END;
$$;

-- 3. Adaptive rate limiting + address reputation ------------------------

CREATE OR REPLACE FUNCTION public.check_adaptive_limit(
  _ip TEXT, _action TEXT, _max_requests INTEGER DEFAULT 30, _window_seconds INTEGER DEFAULT 60,
  _success BOOLEAN DEFAULT true
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_block public.ip_blocklist%ROWTYPE;
  v_base JSONB;
  v_rep public.ip_reputation%ROWTYPE;
  v_level TEXT;
  v_until TIMESTAMPTZ;
BEGIN
  IF _ip IS NULL OR _ip = '' THEN
    RETURN jsonb_build_object('allowed', true, 'level','none');
  END IF;

  SELECT * INTO v_block FROM public.ip_blocklist WHERE ip_address = _ip;
  IF FOUND AND v_block.blocked_until IS NOT NULL AND v_block.blocked_until > now() THEN
    RETURN jsonb_build_object('allowed', false, 'level', v_block.level,
      'retry_after_seconds', CEIL(EXTRACT(EPOCH FROM (v_block.blocked_until - now()))));
  END IF;

  INSERT INTO public.ip_reputation(ip_address, request_count, failed_auth_count, window_start)
  VALUES (_ip, 1, CASE WHEN _success THEN 0 ELSE 1 END, now())
  ON CONFLICT (ip_address) DO UPDATE SET
    request_count = CASE WHEN public.ip_reputation.window_start < now() - interval '10 minutes'
                         THEN 1 ELSE public.ip_reputation.request_count + 1 END,
    failed_auth_count = CASE WHEN public.ip_reputation.window_start < now() - interval '10 minutes'
                         THEN (CASE WHEN _success THEN 0 ELSE 1 END)
                         ELSE public.ip_reputation.failed_auth_count + (CASE WHEN _success THEN 0 ELSE 1 END) END,
    window_start = CASE WHEN public.ip_reputation.window_start < now() - interval '10 minutes'
                         THEN now() ELSE public.ip_reputation.window_start END,
    updated_at = now()
  RETURNING * INTO v_rep;

  v_base := public.check_rate_limit(_ip, _action, _max_requests, _window_seconds);

  -- Escalation ladder driven by pattern, not raw volume alone
  IF (v_base->>'allowed')::boolean = false OR v_rep.failed_auth_count >= 10
     OR v_rep.request_count > _max_requests * 10 THEN
    v_level := CASE
      WHEN COALESCE(v_block.strikes,0) >= 3 THEN 'extended_ban'
      WHEN COALESCE(v_block.strikes,0) >= 1 THEN 'temp_ban'
      ELSE 'throttle' END;
    v_until := now() + CASE v_level
      WHEN 'extended_ban' THEN interval '6 hours'
      WHEN 'temp_ban' THEN interval '30 minutes'
      ELSE interval '2 minutes' END;

    INSERT INTO public.ip_blocklist(ip_address, level, reason, blocked_until, strikes)
    VALUES (_ip, v_level, 'Adaptive limit: ' || _action, v_until, 1)
    ON CONFLICT (ip_address) DO UPDATE SET
      level = v_level, blocked_until = v_until,
      reason = 'Adaptive limit: ' || _action,
      strikes = public.ip_blocklist.strikes + 1,
      updated_at = now();

    RETURN jsonb_build_object('allowed', false, 'level', v_level,
      'retry_after_seconds', CEIL(EXTRACT(EPOCH FROM (v_until - now()))));
  END IF;

  RETURN jsonb_build_object('allowed', true, 'level','none', 'count', v_base->>'count');
END;
$$;

-- 4. Risk-aware money limits in the posting engine ----------------------

CREATE OR REPLACE FUNCTION public.session_outflow_guard(_user_id UUID, _amount_kobo BIGINT)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_band TEXT;
  v_verified TIMESTAMPTZ;
  v_today_kobo BIGINT;
  v_cap_kobo BIGINT := 500000; -- NGN 5,000 while a session is high risk and unverified
BEGIN
  SELECT risk_band, step_up_verified_at INTO v_band, v_verified
  FROM public.user_sessions
  WHERE user_id = _user_id AND status = 'active'
  ORDER BY last_seen_at DESC LIMIT 1;

  IF v_band IS DISTINCT FROM 'high' OR v_verified IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', true);
  END IF;

  SELECT COALESCE(outflow_kobo, 0) INTO v_today_kobo
  FROM public.velocity_counters
  WHERE user_id = _user_id AND window_date = CURRENT_DATE;

  IF COALESCE(v_today_kobo,0) + _amount_kobo > v_cap_kobo THEN
    RETURN jsonb_build_object('allowed', false,
      'error', 'For your safety this sign-in needs to be confirmed with your PIN before sending this amount.');
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_session_risk(uuid,text,text,text,text,text,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_session_risk_event(uuid,text,integer,jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_session_verified(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.terminate_session(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.terminate_other_sessions(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_adaptive_limit(text,text,integer,integer,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.session_outflow_guard(uuid,bigint) TO service_role;