
CREATE OR REPLACE FUNCTION public.release_service_milestone(
  _request_id uuid,
  _milestone_key text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_req service_requests%ROWTYPE;
  v_milestones jsonb;
  v_milestone jsonb;
  v_amount numeric;
  v_idx int := -1;
  v_i int;
  v_merchant_user uuid;
  v_mwallet merchant_wallets%ROWTYPE;
  v_updated jsonb := '[]'::jsonb;
  v_m jsonb;
  v_all_released boolean := true;
  v_new_status text;
  v_reference text;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_req FROM service_requests WHERE id = _request_id FOR UPDATE;
  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  IF v_req.student_id <> v_user THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the student can approve');
  END IF;

  v_milestones := COALESCE(v_req.milestones, '[]'::jsonb);

  FOR v_i IN 0 .. jsonb_array_length(v_milestones) - 1 LOOP
    IF v_milestones->v_i->>'key' = _milestone_key THEN
      v_idx := v_i;
      v_milestone := v_milestones->v_i;
      EXIT;
    END IF;
  END LOOP;

  IF v_idx = -1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Milestone not found');
  END IF;

  IF (v_milestone->>'status') NOT IN ('submitted','funded') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Milestone not ready for release');
  END IF;

  v_amount := COALESCE((v_milestone->>'amount')::numeric, 0);
  IF v_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Milestone amount missing');
  END IF;

  SELECT user_id INTO v_merchant_user FROM merchants WHERE id = v_req.merchant_id;
  IF v_merchant_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Merchant not found');
  END IF;

  SELECT * INTO v_mwallet FROM merchant_wallets
    WHERE merchant_id = v_req.merchant_id OR user_id = v_merchant_user
    FOR UPDATE LIMIT 1;

  IF v_mwallet.id IS NULL THEN
    INSERT INTO merchant_wallets (merchant_id, user_id, balance, available_balance, hold_balance, total_earned)
      VALUES (v_req.merchant_id, v_merchant_user, v_amount, v_amount, 0, v_amount)
      RETURNING * INTO v_mwallet;
  ELSE
    UPDATE merchant_wallets
      SET hold_balance = GREATEST(0, COALESCE(hold_balance, 0) - v_amount),
          available_balance = COALESCE(available_balance, 0) + v_amount,
          total_earned = COALESCE(total_earned, 0) + v_amount,
          updated_at = now()
      WHERE id = v_mwallet.id;
  END IF;

  FOR v_i IN 0 .. jsonb_array_length(v_milestones) - 1 LOOP
    v_m := v_milestones->v_i;
    IF v_i = v_idx THEN
      v_m := v_m
        || jsonb_build_object('status', 'released', 'released_at', to_jsonb(now()));
    ELSIF v_i = v_idx + 1 AND (v_m->>'status') = 'pending' THEN
      v_m := v_m || jsonb_build_object('status', 'funded');
    END IF;
    IF (v_m->>'status') <> 'released' THEN
      v_all_released := false;
    END IF;
    v_updated := v_updated || jsonb_build_array(v_m);
  END LOOP;

  v_new_status := CASE WHEN v_all_released THEN 'completed' ELSE 'in_progress' END;

  UPDATE service_requests
    SET milestones = v_updated,
        escrow_released = COALESCE(escrow_released, 0) + v_amount,
        status = v_new_status,
        completed_at = CASE WHEN v_all_released THEN now() ELSE completed_at END,
        updated_at = now()
    WHERE id = _request_id;

  v_reference := 'SR-REL-' || substring(_request_id::text, 1, 8) || '-' || extract(epoch from now())::bigint;
  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (v_merchant_user, 'service_request_payout', v_amount, 'completed', v_reference,
      jsonb_build_object('request_id', _request_id, 'milestone_key', _milestone_key, 'direction', 'credit'));

  BEGIN
    PERFORM create_notification(
      v_merchant_user,
      CASE WHEN v_all_released THEN 'Order completed' ELSE 'Milestone released' END,
      '₦' || to_char(v_amount, 'FM999,999,999') || ' credited for ' || COALESCE(v_req.title,'your service request'),
      'service_request',
      jsonb_build_object('request_id', _request_id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- non-fatal
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'released_amount', v_amount,
    'all_released', v_all_released,
    'status', v_new_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_service_milestone(uuid, text) TO authenticated;
