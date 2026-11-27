CREATE OR REPLACE FUNCTION public.create_instant_order(
  p_merchant_id uuid,
  p_order_type text,
  p_total numeric,
  p_delivery_fee numeric,
  p_delivery_method text,
  p_delivery_address text,
  p_delivery_zone_name text,
  p_items jsonb,
  p_print_specs jsonb,
  p_print_file_url text,
  p_print_file_name text,
  p_laundry_items jsonb,
  p_service_type text,
  p_pickup_window jsonb,
  p_delivery_window jsonb,
  p_special_instructions text,
  p_customer_name text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_wallet wallets%ROWTYPE;
  v_mwallet merchant_wallets%ROWTYPE;
  v_order_id uuid;
  v_reference text;
  v_grand_total numeric;
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

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user FOR UPDATE;
  IF v_wallet.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  IF COALESCE(v_wallet.available_balance, v_wallet.balance) < v_grand_total THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Debit student wallet
  UPDATE wallets
    SET balance = balance - v_grand_total,
        available_balance = available_balance - v_grand_total,
        updated_at = now()
    WHERE id = v_wallet.id;

  -- Hold in merchant escrow
  SELECT * INTO v_mwallet FROM merchant_wallets WHERE merchant_id = p_merchant_id FOR UPDATE;
  IF v_mwallet.id IS NULL THEN
    INSERT INTO merchant_wallets (merchant_id, hold_balance, available_balance, balance)
      VALUES (p_merchant_id, v_grand_total, 0, v_grand_total)
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
    CASE WHEN p_order_type = 'printing' THEN 'received'
         WHEN p_order_type = 'laundry' THEN 'pending'
         ELSE 'pending' END,
    v_grand_total,
    COALESCE(p_items, '[]'::jsonb),
    p_customer_name,
    v_reference, p_delivery_method, COALESCE(p_delivery_fee, 0), p_delivery_address,
    p_delivery_zone_name, p_print_file_url, p_print_file_name, p_print_specs,
    p_order_type, p_service_type, p_laundry_items, p_pickup_window, p_delivery_window,
    p_special_instructions, true
  ) RETURNING id INTO v_order_id;

  INSERT INTO transactions (user_id, type, amount, status, reference, metadata)
    VALUES (v_user, 'merchant_payment', v_grand_total, 'completed', v_reference,
      jsonb_build_object('order_id', v_order_id, 'merchant_id', p_merchant_id,
                         'order_type', p_order_type, 'direction','debit'));

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'reference', v_reference);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_instant_order(uuid,text,numeric,numeric,text,text,text,jsonb,jsonb,text,text,jsonb,text,jsonb,jsonb,text,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_instant_order(uuid,text,numeric,numeric,text,text,text,jsonb,jsonb,text,text,jsonb,text,jsonb,jsonb,text,text) FROM anon, public;