
-- 1. COLLECTIONS: revoke sensitive columns from authenticated/anon roles
REVOKE SELECT (virtual_account_number, virtual_bank_name) ON public.collections FROM anon, authenticated;

-- RPC for collection creator (or admin) to fetch their own virtual account details
CREATE OR REPLACE FUNCTION public.get_collection_payout_details(p_collection_id uuid)
RETURNS TABLE (virtual_account_number text, virtual_bank_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = p_collection_id
      AND (c.creator_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT c.virtual_account_number, c.virtual_bank_name
  FROM public.collections c
  WHERE c.id = p_collection_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_collection_payout_details(uuid) TO authenticated;

-- 2. EVENTS: revoke sensitive columns from authenticated/anon roles
REVOKE SELECT (
  virtual_account_number,
  virtual_bank_name,
  settlement_account_number,
  settlement_bank_name,
  settlement_account_name
) ON public.events FROM anon, authenticated;

-- RPC for event organizer (or admin) to fetch their own bank details
CREATE OR REPLACE FUNCTION public.get_event_payout_details(p_event_id uuid)
RETURNS TABLE (
  virtual_account_number text,
  virtual_bank_name text,
  settlement_account_number text,
  settlement_bank_name text,
  settlement_account_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id
      AND (e.organizer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT e.virtual_account_number, e.virtual_bank_name,
         e.settlement_account_number, e.settlement_bank_name, e.settlement_account_name
  FROM public.events e
  WHERE e.id = p_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_payout_details(uuid) TO authenticated;

-- 3. ERRAND_REQUESTS: prevent helpers from modifying financial / requester fields
-- Replace UPDATE policy with a stricter version using a trigger to enforce column immutability for helpers.
CREATE OR REPLACE FUNCTION public.errand_requests_protect_helper_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin or requester can change anything (subject to RLS)
  IF public.has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = OLD.requester_id THEN
    RETURN NEW;
  END IF;

  -- If updater is the helper, lock down sensitive fields
  IF auth.uid() = OLD.helper_id THEN
    IF NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.requester_id IS DISTINCT FROM OLD.requester_id
       OR NEW.requester_lat IS DISTINCT FROM OLD.requester_lat
       OR NEW.requester_lng IS DISTINCT FROM OLD.requester_lng
       OR NEW.delivery_lat IS DISTINCT FROM OLD.delivery_lat
       OR NEW.delivery_lng IS DISTINCT FROM OLD.delivery_lng
       OR NEW.item_cost IS DISTINCT FROM OLD.item_cost
       OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
       OR NEW.merchant_id IS DISTINCT FROM OLD.merchant_id
       OR NEW.merchant_order_id IS DISTINCT FROM OLD.merchant_order_id
       OR NEW.errand_type IS DISTINCT FROM OLD.errand_type
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
    THEN
      RAISE EXCEPTION 'Helper cannot modify financial or requester fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS errand_requests_protect_helper_updates_trg ON public.errand_requests;
CREATE TRIGGER errand_requests_protect_helper_updates_trg
BEFORE UPDATE ON public.errand_requests
FOR EACH ROW EXECUTE FUNCTION public.errand_requests_protect_helper_updates();

-- 4. REALTIME: restrict channel subscriptions for crypto_deposits to the owner
-- The channel topic in the client is `crypto_dep_{deposit_id}`
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only subscribe to own crypto deposit channels" ON realtime.messages;
CREATE POLICY "Users can only subscribe to own crypto deposit channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow if topic isn't a crypto_dep_* topic (other channels unaffected)
  (realtime.topic() NOT LIKE 'crypto_dep_%')
  OR EXISTS (
    SELECT 1 FROM public.crypto_deposits cd
    WHERE cd.id::text = substring(realtime.topic() FROM 'crypto_dep_(.*)$')
      AND cd.user_id = auth.uid()
  )
);
