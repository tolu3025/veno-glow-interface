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
  IF auth.uid() IS NULL OR (auth.uid() <> _user_id AND NOT public.has_role(auth.uid(),'admin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not allowed');
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

  IF v_has_history AND NOT v_known_device THEN
    v_score := v_score + 35;
    v_reasons := v_reasons || jsonb_build_object('type','new_device');
  ELSIF v_known_device AND NOT v_trusted_device THEN
    v_score := v_score + 10;
    v_reasons := v_reasons || jsonb_build_object('type','untrusted_device');
  END IF;

  IF _country IS NOT NULL AND v_has_history AND NOT v_known_country THEN
    v_score := v_score + 30;
    v_reasons := v_reasons || jsonb_build_object('type','new_country','country',_country);
  END IF;

  IF v_last.id IS NOT NULL AND _country IS NOT NULL AND v_last.country IS NOT NULL
     AND v_last.country <> _country THEN
    v_minutes := EXTRACT(EPOCH FROM (now() - v_last.last_seen_at)) / 60;
    IF v_minutes < 120 THEN
      v_score := v_score + 40;
      v_reasons := v_reasons || jsonb_build_object('type','impossible_travel','from',v_last.country,'to',_country);
    END IF;
  END IF;

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
  IF auth.uid() IS NULL OR (auth.uid() <> v_session.user_id AND NOT public.has_role(auth.uid(),'admin')) THEN
    RETURN jsonb_build_object('success', false, 'error','Not allowed');
  END IF;

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

REVOKE EXECUTE ON FUNCTION public.evaluate_session_risk(uuid,text,text,text,text,text,integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.record_session_risk_event(uuid,text,integer,jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_session_verified(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.terminate_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.terminate_other_sessions(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_adaptive_limit(text,text,integer,integer,boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.session_outflow_guard(uuid,bigint) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.evaluate_session_risk(uuid,text,text,text,text,text,integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_session_risk_event(uuid,text,integer,jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_session_verified(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.terminate_session(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.terminate_other_sessions(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_adaptive_limit(text,text,integer,integer,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.session_outflow_guard(uuid,bigint) TO service_role;