
-- ============ 1. BILL PAYMENTS ============
CREATE OR REPLACE FUNCTION public.pay_bill_from_wallet(p_user_id uuid, p_amount numeric, p_reference text, p_bill_type text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_post jsonb;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  v_post := public.post_ledger_entry(
    p_user_id, NULL, ROUND(p_amount * 100)::bigint, 'bill_payment', p_reference,
    jsonb_build_object('bill_type', p_bill_type) || COALESCE(p_metadata, '{}'::jsonb)
  );
  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
  END IF;

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (p_user_id, 'bill_payment', p_amount, 'completed', p_reference,
      jsonb_build_object('bill_type', p_bill_type, 'entry_group_id', v_post->>'entry_group_id')
      || COALESCE(p_metadata,'{}'::jsonb));

  RETURN jsonb_build_object('success', true, 'reference', p_reference);
END $function$;

-- ============ 2. COLLECTION PAYMENTS ============
CREATE OR REPLACE FUNCTION public.pay_collection_from_wallet(p_payer_id uuid, p_collection_id uuid, p_amount numeric, p_payer_name text, p_payer_matric text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_collection collections%ROWTYPE;
  v_reference text;
  v_self_pay boolean;
  v_post jsonb;
BEGIN
  v_reference := 'COL-' || gen_random_uuid()::text;

  IF EXISTS (SELECT 1 FROM collection_payments
             WHERE collection_id = p_collection_id
               AND payer_matric_number = p_payer_matric AND status = 'confirmed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already paid for this collection');
  END IF;

  SELECT * INTO v_collection FROM collections WHERE id = p_collection_id FOR UPDATE;
  IF v_collection.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collection not found');
  END IF;
  IF v_collection.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Collection is no longer active');
  END IF;

  v_self_pay := (v_collection.creator_id = p_payer_id);

  IF NOT v_self_pay THEN
    v_post := public.post_ledger_entry(
      p_payer_id, v_collection.creator_id, ROUND(p_amount * 100)::bigint,
      'collection_payment', v_reference,
      jsonb_build_object('collection_id', p_collection_id, 'collection_title', v_collection.title,
                         'payer_name', p_payer_name)
    );
    IF NOT (v_post->>'success')::boolean THEN
      RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
    END IF;
  END IF;

  UPDATE collections SET
    total_collected = total_collected + p_amount,
    participant_count = participant_count + 1
  WHERE id = p_collection_id;

  INSERT INTO collection_payments (collection_id, amount, payer_name, payer_matric_number, status, transaction_reference, webhook_verified)
  VALUES (p_collection_id, p_amount, p_payer_name, p_payer_matric, 'confirmed', v_reference, true);

  IF v_self_pay THEN
    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (p_payer_id, 'collection_payment', p_amount, 'completed', v_reference,
      jsonb_build_object('direction', 'self_pay', 'self_pay', true,
                         'collection_id', p_collection_id,
                         'collection_title', v_collection.title,
                         'payer_name', p_payer_name));
  ELSE
    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (p_payer_id, 'collection_payment', p_amount, 'completed', v_reference,
      jsonb_build_object('direction', 'debit', 'collection_id', p_collection_id,
                         'collection_title', v_collection.title,
                         'entry_group_id', v_post->>'entry_group_id'));

    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (v_collection.creator_id, 'collection_payment', p_amount, 'completed', v_reference,
      jsonb_build_object('direction', 'credit', 'collection_id', p_collection_id,
                         'payer_name', p_payer_name,
                         'entry_group_id', v_post->>'entry_group_id'));
  END IF;

  RETURN jsonb_build_object('success', true, 'reference', v_reference, 'self_pay', v_self_pay);
END; $function$;

-- ============ 3. MERCHANT PAYMENTS ============
CREATE OR REPLACE FUNCTION public.pay_merchant_from_wallet(p_customer_id uuid, p_merchant_id uuid, p_amount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_merchant merchants%ROWTYPE;
  v_reference text;
  v_post jsonb;
BEGIN
  v_reference := 'MER-' || gen_random_uuid()::text;

  SELECT * INTO v_merchant FROM merchants WHERE id = p_merchant_id FOR UPDATE;
  IF v_merchant.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Merchant not found');
  END IF;
  IF v_merchant.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Merchant is not active');
  END IF;

  v_post := public.post_ledger_entry(
    p_customer_id, v_merchant.user_id, ROUND(p_amount * 100)::bigint,
    'merchant_payment', v_reference,
    jsonb_build_object('merchant_id', p_merchant_id, 'merchant_name', v_merchant.business_name)
  );
  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
  END IF;

  UPDATE merchants SET
    total_revenue = total_revenue + p_amount,
    total_transactions = total_transactions + 1,
    updated_at = now()
  WHERE id = p_merchant_id;

  INSERT INTO merchant_transactions (merchant_id, customer_id, amount, commission_amount, net_amount, reference)
  VALUES (p_merchant_id, p_customer_id, p_amount, 0, p_amount, v_reference);

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_customer_id, 'collection_payment', p_amount, 'completed', v_reference,
    jsonb_build_object('direction', 'debit', 'merchant_id', p_merchant_id,
                       'merchant_name', v_merchant.business_name,
                       'entry_group_id', v_post->>'entry_group_id'));

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (v_merchant.user_id, 'collection_payment', p_amount, 'completed', v_reference,
    jsonb_build_object('direction', 'credit', 'merchant_id', p_merchant_id,
                       'customer_id', p_customer_id, 'commission_deferred', true,
                       'entry_group_id', v_post->>'entry_group_id'));

  PERFORM create_notification(
    v_merchant.user_id, 'Payment Received',
    'N' || p_amount::text || ' received at ' || v_merchant.business_name,
    'merchant', jsonb_build_object('merchant_id', p_merchant_id, 'amount', p_amount));

  RETURN jsonb_build_object('success', true, 'reference', v_reference, 'credited', p_amount);
END; $function$;

-- ============ 4. TICKET PURCHASES ============
CREATE OR REPLACE FUNCTION public.purchase_ticket_from_wallet(p_buyer_id uuid, p_event_id uuid, p_ticket_type_id uuid, p_buyer_name text, p_buyer_matric text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
    v_ticket_type ticket_types%ROWTYPE;
    v_event events%ROWTYPE;
    v_reference text;
    v_qr_code text;
    v_post jsonb;
BEGIN
    v_reference := 'TKT-' || gen_random_uuid()::text;
    v_qr_code := 'TKT-' || encode(gen_random_uuid()::text::bytea, 'hex');

    SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;
    IF v_event.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event not found');
    END IF;
    IF v_event.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event is not active');
    END IF;

    SELECT * INTO v_ticket_type FROM ticket_types WHERE id = p_ticket_type_id AND event_id = p_event_id FOR UPDATE;
    IF v_ticket_type.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ticket type not found');
    END IF;
    IF v_ticket_type.sold >= v_ticket_type.quantity THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sold out');
    END IF;

    IF EXISTS (SELECT 1 FROM tickets WHERE event_id = p_event_id AND buyer_id = p_buyer_id AND ticket_type_id = p_ticket_type_id AND status = 'valid') THEN
        RETURN jsonb_build_object('success', false, 'error', 'You already have this ticket');
    END IF;

    v_post := public.post_ledger_entry(
      p_buyer_id, v_event.organizer_id, ROUND(v_ticket_type.price * 100)::bigint,
      'ticket_purchase', v_reference,
      jsonb_build_object('event_id', p_event_id, 'event_title', v_event.title,
                         'ticket_type', v_ticket_type.name)
    );
    IF NOT (v_post->>'success')::boolean THEN
      RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
    END IF;

    UPDATE ticket_types SET sold = sold + 1 WHERE id = p_ticket_type_id;
    UPDATE events SET total_revenue = total_revenue + v_ticket_type.price,
                      total_tickets_sold = total_tickets_sold + 1 WHERE id = p_event_id;

    INSERT INTO tickets (event_id, ticket_type_id, buyer_id, buyer_name, buyer_matric, qr_code, transaction_reference, amount_paid, payment_method)
    VALUES (p_event_id, p_ticket_type_id, p_buyer_id, p_buyer_name, p_buyer_matric, v_qr_code, v_reference, v_ticket_type.price, 'wallet');

    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (p_buyer_id, 'collection_payment', v_ticket_type.price, 'completed', v_reference,
        jsonb_build_object('direction', 'debit', 'event_id', p_event_id, 'event_title', v_event.title,
                           'ticket_type', v_ticket_type.name, 'entry_group_id', v_post->>'entry_group_id'));

    INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (v_event.organizer_id, 'collection_payment', v_ticket_type.price, 'completed', v_reference,
        jsonb_build_object('direction', 'credit', 'event_id', p_event_id, 'buyer_name', p_buyer_name,
                           'ticket_type', v_ticket_type.name, 'entry_group_id', v_post->>'entry_group_id'));

    PERFORM create_notification(
        v_event.organizer_id, 'Ticket Sold!',
        p_buyer_name || ' purchased a ' || v_ticket_type.name || ' ticket for ' || v_event.title,
        'event', jsonb_build_object('event_id', p_event_id, 'amount', v_ticket_type.price));

    RETURN jsonb_build_object('success', true, 'reference', v_reference, 'qr_code', v_qr_code);
END; $function$;

-- ============ 5. AJO CONTRIBUTIONS / DISBURSEMENTS ============
CREATE OR REPLACE FUNCTION public.contribute_to_ajo(p_member_id uuid, p_group_id uuid, p_cycle integer, p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_group ajo_groups%ROWTYPE;
  v_member ajo_members%ROWTYPE;
  v_contribution ajo_contributions%ROWTYPE;
  v_amount numeric;
  v_late_fee numeric := 0;
  v_total_amount numeric;
  v_reference text;
  v_all_paid boolean;
  v_recipient_member ajo_members%ROWTYPE;
  v_disbursement_amount numeric;
  v_disb_reference text;
  v_post jsonb;
BEGIN
  v_reference := 'AJO-' || gen_random_uuid()::text;

  SELECT * INTO v_group FROM ajo_groups WHERE id = p_group_id FOR UPDATE;
  IF v_group.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group not found');
  END IF;
  IF v_group.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group is not active');
  END IF;

  SELECT * INTO v_member FROM ajo_members WHERE id = p_member_id AND group_id = p_group_id AND user_id = p_user_id FOR UPDATE;
  IF v_member.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found');
  END IF;
  IF v_member.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member is not active');
  END IF;

  SELECT * INTO v_contribution FROM ajo_contributions
    WHERE member_id = p_member_id AND group_id = p_group_id AND cycle_number = p_cycle FOR UPDATE;
  IF v_contribution.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No contribution record for this cycle');
  END IF;
  IF v_contribution.status = 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already paid for this cycle');
  END IF;

  v_amount := v_contribution.amount;
  IF now() > v_contribution.due_date THEN
    v_late_fee := v_amount * (v_group.late_fee_percent / 100);
  END IF;
  v_total_amount := v_amount + v_late_fee;

  v_post := public.post_ledger_entry(
    p_user_id, NULL, ROUND(v_total_amount * 100)::bigint,
    'ajo_contribution', v_reference,
    jsonb_build_object('group_id', p_group_id, 'cycle', p_cycle, 'late_fee', v_late_fee,
                       'group_title', v_group.title),
    'escrow'::public.ledger_account_kind
  );
  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
  END IF;

  UPDATE ajo_contributions SET status = 'paid', paid_at = now(), late_fee = v_late_fee, transaction_reference = v_reference
    WHERE id = v_contribution.id;
  UPDATE ajo_members SET total_contributed = total_contributed + v_total_amount WHERE id = p_member_id;

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
  VALUES (p_user_id, 'ajo_contribution', v_total_amount, 'completed', v_reference,
    jsonb_build_object('group_id', p_group_id, 'cycle', p_cycle, 'late_fee', v_late_fee,
                       'group_title', v_group.title, 'entry_group_id', v_post->>'entry_group_id'));

  SELECT NOT EXISTS(
    SELECT 1 FROM ajo_contributions c
    JOIN ajo_members m ON m.id = c.member_id
    WHERE c.group_id = p_group_id AND c.cycle_number = p_cycle AND c.status != 'paid' AND m.status = 'active'
  ) INTO v_all_paid;

  IF v_all_paid THEN
    SELECT * INTO v_recipient_member FROM ajo_members
      WHERE group_id = p_group_id AND position = p_cycle AND status = 'active';

    IF v_recipient_member.id IS NOT NULL THEN
      v_disb_reference := 'AJO-D-' || gen_random_uuid()::text;
      v_disbursement_amount := v_group.contribution_amount * v_group.filled_slots;

      v_post := public.post_ledger_entry(
        NULL, v_recipient_member.user_id, ROUND(v_disbursement_amount * 100)::bigint,
        'ajo_disbursement', v_disb_reference,
        jsonb_build_object('group_id', p_group_id, 'cycle', p_cycle, 'group_title', v_group.title),
        'escrow'::public.ledger_account_kind
      );
      IF NOT (v_post->>'success')::boolean THEN
        RAISE EXCEPTION 'Ajo disbursement failed: %', v_post->>'error';
      END IF;

      UPDATE ajo_members SET total_collected = total_collected + v_disbursement_amount WHERE id = v_recipient_member.id;

      INSERT INTO ajo_disbursements (group_id, recipient_member_id, cycle_number, amount, disbursed_at, transaction_reference)
      VALUES (p_group_id, v_recipient_member.id, p_cycle, v_disbursement_amount, now(), v_disb_reference);

      INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
      VALUES (v_recipient_member.user_id, 'ajo_disbursement', v_disbursement_amount, 'completed', v_disb_reference,
        jsonb_build_object('group_id', p_group_id, 'cycle', p_cycle, 'group_title', v_group.title,
                           'entry_group_id', v_post->>'entry_group_id'));

      PERFORM create_notification(
        v_recipient_member.user_id, 'Ajo Payout!',
        'N' || v_disbursement_amount::text || ' has been disbursed to your wallet from ' || v_group.title,
        'ajo', jsonb_build_object('group_id', p_group_id, 'cycle', p_cycle, 'amount', v_disbursement_amount));

      IF p_cycle >= v_group.total_slots THEN
        UPDATE ajo_groups SET status = 'completed', current_cycle = p_cycle WHERE id = p_group_id;
      ELSE
        UPDATE ajo_groups SET current_cycle = p_cycle + 1 WHERE id = p_group_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'reference', v_reference, 'late_fee', v_late_fee, 'all_paid', v_all_paid);
END; $function$;

-- ============ 6. INSTANT ORDER CHECKOUT ============
CREATE OR REPLACE FUNCTION public.create_instant_order(p_merchant_id uuid, p_order_type text, p_total numeric, p_delivery_fee numeric, p_delivery_method text, p_delivery_address text, p_delivery_zone_name text, p_items jsonb, p_print_specs jsonb, p_print_file_url text, p_print_file_name text, p_laundry_items jsonb, p_service_type text, p_pickup_window jsonb, p_delivery_window jsonb, p_special_instructions text, p_customer_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_mwallet merchant_wallets%ROWTYPE;
  v_merchant_user uuid;
  v_order_id uuid;
  v_reference text;
  v_grand_total numeric;
  v_post jsonb;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  IF p_order_type NOT IN ('printing','laundry','food') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid order type');
  END IF;
  IF p_total IS NULL OR p_total <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  v_grand_total := p_total + COALESCE(p_delivery_fee, 0);
  v_reference := upper(p_order_type) || '-' || gen_random_uuid()::text;

  SELECT user_id INTO v_merchant_user FROM merchants WHERE id = p_merchant_id;
  IF v_merchant_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Merchant not found');
  END IF;

  v_post := public.post_ledger_entry(
    v_user, NULL, ROUND(v_grand_total * 100)::bigint,
    'merchant_order_escrow', v_reference,
    jsonb_build_object('merchant_id', p_merchant_id, 'order_type', p_order_type),
    'escrow'::public.ledger_account_kind
  );
  IF NOT (v_post->>'success')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_post->>'error');
  END IF;

  SELECT * INTO v_mwallet FROM merchant_wallets WHERE merchant_id = p_merchant_id FOR UPDATE;
  IF v_mwallet.id IS NULL THEN
    INSERT INTO merchant_wallets (merchant_id, user_id, hold_balance, available_balance, balance, total_earned, total_withdrawn)
      VALUES (p_merchant_id, v_merchant_user, v_grand_total, 0, v_grand_total, 0, 0)
      RETURNING * INTO v_mwallet;
  ELSE
    UPDATE merchant_wallets
      SET hold_balance = COALESCE(hold_balance, 0) + v_grand_total,
          balance = COALESCE(balance, 0) + v_grand_total,
          updated_at = now()
      WHERE id = v_mwallet.id;
  END IF;

  INSERT INTO merchant_orders (
    merchant_id, customer_id, status, total_amount, items, customer_name,
    transaction_reference, delivery_method, delivery_fee, delivery_address,
    delivery_zone_name, print_file_url, print_file_name, print_specs,
    order_type, service_type, laundry_items, pickup_window, delivery_window,
    special_instructions, escrow_held
  ) VALUES (
    p_merchant_id, v_user,
    CASE WHEN p_order_type = 'printing' THEN 'received' ELSE 'pending' END,
    v_grand_total, COALESCE(p_items, '[]'::jsonb), p_customer_name,
    v_reference, p_delivery_method, COALESCE(p_delivery_fee, 0), p_delivery_address,
    p_delivery_zone_name, p_print_file_url, p_print_file_name, p_print_specs,
    p_order_type, p_service_type, p_laundry_items, p_pickup_window, p_delivery_window,
    p_special_instructions, true
  ) RETURNING id INTO v_order_id;

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (v_user, 'merchant_payment', v_grand_total, 'completed', v_reference,
      jsonb_build_object('order_id', v_order_id, 'merchant_id', p_merchant_id,
                         'order_type', p_order_type, 'direction','debit',
                         'entry_group_id', v_post->>'entry_group_id'));

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'reference', v_reference);
END; $function$;

-- ============ 7. WITHDRAWAL HOLD (kobo-exact) ============
CREATE OR REPLACE FUNCTION public.safe_withdrawal(_user_id uuid, _amount numeric, _reference text, _bank_account text, _bank_code text, _is_instant boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_single numeric; v_daily numeric; v_spent numeric;
  v_wallet wallets%ROWTYPE; v_kyc text; v_velocity int;
  v_used integer; v_reset timestamptz; v_effective_used integer;
  v_tiered numeric := 0; v_instant numeric := 0; v_total_fee numeric;
  v_net numeric; v_fee_reason text; v_amount_kobo bigint;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    RETURN jsonb_build_object('status','failed','reason','invalid_amount');
  END IF;
  v_amount_kobo := ROUND(_amount * 100)::bigint;

  SELECT max_amount INTO v_single FROM transaction_limits WHERE limit_type='single' AND is_active ORDER BY effective_date DESC LIMIT 1;
  SELECT max_amount INTO v_daily  FROM transaction_limits WHERE limit_type='daily'  AND is_active ORDER BY effective_date DESC LIMIT 1;
  IF v_single IS NOT NULL AND _amount > v_single THEN
    RETURN jsonb_build_object('status','failed','reason','exceeds_single_limit','limit',v_single);
  END IF;
  SELECT COALESCE(SUM(amount),0) INTO v_spent FROM transactions
    WHERE user_id=_user_id AND type='withdrawal' AND status IN ('pending','completed') AND DATE(created_at)=CURRENT_DATE;
  IF v_daily IS NOT NULL AND v_spent + _amount > v_daily THEN
    RETURN jsonb_build_object('status','failed','reason','exceeds_daily_limit','limit',v_daily,'spent',v_spent);
  END IF;

  SELECT free_withdrawals_used, free_withdrawals_reset_at INTO v_used, v_reset
    FROM profiles WHERE id = _user_id FOR UPDATE;
  IF v_reset IS NULL OR v_reset < date_trunc('month', now()) THEN
    v_effective_used := 0;
    UPDATE profiles SET free_withdrawals_used = 0, free_withdrawals_reset_at = date_trunc('month', now())
     WHERE id = _user_id;
  ELSE
    v_effective_used := COALESCE(v_used, 0);
  END IF;

  IF v_effective_used < 2 THEN v_tiered := 0;
  ELSIF _amount <= 10000 THEN v_tiered := 50;
  ELSIF _amount <= 50000 THEN v_tiered := 100;
  ELSE v_tiered := 200; END IF;
  IF _is_instant THEN v_instant := 100; END IF;

  v_total_fee := v_tiered + v_instant;
  v_net := _amount - v_total_fee;
  v_fee_reason := CASE
    WHEN v_total_fee = 0 THEN 'Free withdrawal (2 per month)'
    WHEN v_tiered = 0 AND v_instant > 0 THEN 'Instant payout surcharge (N100)'
    WHEN v_tiered > 0 AND v_instant = 0 THEN 'Withdrawal fee - covers our bank transfer cost. KukaPay does not profit from withdrawals.'
    ELSE 'Withdrawal fee + N100 instant payout. KukaPay does not profit from withdrawals.'
  END;

  SELECT * INTO v_wallet FROM wallets WHERE user_id=_user_id FOR UPDATE;
  IF v_wallet.id IS NULL THEN
    RETURN jsonb_build_object('status','failed','reason','wallet_not_found');
  END IF;
  IF (v_wallet.ledger_balance_kobo - v_wallet.hold_balance_kobo) < v_amount_kobo THEN
    RETURN jsonb_build_object('status','failed','reason','insufficient_available_balance');
  END IF;
  IF EXISTS (SELECT 1 FROM transactions WHERE reference = _reference) THEN
    RETURN jsonb_build_object('status','failed','reason','duplicate_reference');
  END IF;
  SELECT COUNT(*) INTO v_velocity FROM transactions
    WHERE user_id=_user_id AND type='withdrawal' AND created_at > now() - interval '1 hour';
  IF v_velocity >= 3 THEN
    RETURN jsonb_build_object('status','failed','reason','velocity_limit');
  END IF;
  SELECT kyc_status INTO v_kyc FROM profiles WHERE id=_user_id;
  IF v_kyc IS DISTINCT FROM 'verified' THEN
    RETURN jsonb_build_object('status','failed','reason','kyc_required');
  END IF;

  -- Hold in exact kobo; no ledger movement until the payout settles.
  UPDATE wallets SET hold_balance_kobo = hold_balance_kobo + v_amount_kobo, updated_at = now()
   WHERE id = v_wallet.id;

  INSERT INTO transactions (user_id, type, amount, fee_amount, fee_reason, status, reference, metadata)
  VALUES (_user_id, 'withdrawal', _amount, v_total_fee, v_fee_reason, 'pending', _reference,
    jsonb_build_object('provider','flutterwave','bank_account',_bank_account,'bank_code',_bank_code,
      'tiered_fee',v_tiered,'instant_surcharge',v_instant,'net_payout',v_net,
      'is_instant',_is_instant,'free_used_before',v_effective_used));

  IF v_total_fee = 0 THEN
    UPDATE profiles SET free_withdrawals_used = v_effective_used + 1 WHERE id = _user_id;
  END IF;

  RETURN jsonb_build_object(
    'status','pending','reference',_reference,'amount',_amount,
    'tiered_fee',v_tiered,'instant_surcharge',v_instant,'total_fee',v_total_fee,
    'net_payout',v_net,
    'free_used',v_effective_used + CASE WHEN v_total_fee = 0 THEN 1 ELSE 0 END,
    'free_remaining',GREATEST(0, 2 - (v_effective_used + CASE WHEN v_total_fee = 0 THEN 1 ELSE 0 END)),
    'fee_reason',v_fee_reason);
END; $function$;

-- ============ 8. WITHDRAWAL SETTLEMENT ============
CREATE OR REPLACE FUNCTION public.finalize_withdrawal(_user_id uuid, _amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  v_wallet wallets%ROWTYPE;
  v_kobo bigint;
  v_post jsonb;
BEGIN
  v_kobo := ROUND(_amount * 100)::bigint;
  SELECT * INTO v_wallet FROM wallets WHERE user_id = _user_id FOR UPDATE;
  IF v_wallet.id IS NULL THEN RETURN; END IF;

  -- Release the hold first, then debit through the engine.
  UPDATE wallets SET hold_balance_kobo = GREATEST(0, hold_balance_kobo - v_kobo), updated_at = now()
   WHERE id = v_wallet.id;

  v_post := public.post_ledger_entry(
    _user_id, NULL, v_kobo, 'withdrawal_settled', NULL,
    jsonb_build_object('source','finalize_withdrawal'),
    'external'::public.ledger_account_kind, true
  );
  IF NOT (v_post->>'success')::boolean THEN
    RAISE EXCEPTION 'Withdrawal settlement failed: %', v_post->>'error';
  END IF;
END; $function$;

-- ============ 9. AUTOMATED MISMATCH DETECTION ============
CREATE OR REPLACE FUNCTION public.flag_ledger_mismatches()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_count int := 0;
BEGIN
  WITH mismatches AS (
    SELECT * FROM public.reconcile_wallet_ledger() WHERE diff_kobo <> 0
  ), inserted AS (
    INSERT INTO public.reconciliation_flags (user_id, reference, expected_amount, actual_amount, flag_type)
    SELECT m.user_id,
           'LEDGER-DRIFT-' || m.wallet_id::text || '-' || to_char(now(), 'YYYYMMDDHH24'),
           ROUND(m.ledger_kobo::numeric / 100, 2),
           ROUND(m.wallet_kobo::numeric / 100, 2),
           'wallet_ledger_drift'
    FROM mismatches m
    WHERE NOT EXISTS (
      SELECT 1 FROM public.reconciliation_flags f
      WHERE f.reference = 'LEDGER-DRIFT-' || m.wallet_id::text || '-' || to_char(now(), 'YYYYMMDDHH24')
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM inserted;

  RETURN jsonb_build_object('success', true, 'flagged', v_count, 'checked_at', now());
END; $function$;

REVOKE ALL ON FUNCTION public.flag_ledger_mismatches() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.flag_ledger_mismatches() TO service_role;
