
-- ============ Service Requests (escrow flow) ============
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  deadline date,
  proposed_budget numeric,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  quote_amount numeric,
  quote_timeline_days integer,
  deliverables text[],
  merchant_note text,
  milestones jsonb NOT NULL DEFAULT '[]'::jsonb,
  negotiation_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  escrow_held numeric NOT NULL DEFAULT 0,
  escrow_released numeric NOT NULL DEFAULT 0,
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view service requests"
  ON public.service_requests FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Students create their own service requests"
  ON public.service_requests FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Participants update service requests"
  ON public.service_requests FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = merchant_id AND m.user_id = auth.uid())
  );

CREATE TRIGGER service_requests_touch BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_service_requests_student ON public.service_requests(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_merchant ON public.service_requests(merchant_id, status, created_at DESC);

-- ============ Service Request Messages (chat) ============
CREATE TABLE IF NOT EXISTS public.service_request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL,
  milestone_key text,
  body text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.service_request_messages TO authenticated;
GRANT ALL ON public.service_request_messages TO service_role;
ALTER TABLE public.service_request_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages"
  ON public.service_request_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = request_id
        AND (r.student_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = r.merchant_id AND m.user_id = auth.uid()))
    )
  );

CREATE POLICY "Participants send messages"
  ON public.service_request_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = request_id
        AND (r.student_id = auth.uid()
             OR EXISTS (SELECT 1 FROM public.merchants m WHERE m.id = r.merchant_id AND m.user_id = auth.uid()))
    )
  );

CREATE INDEX IF NOT EXISTS idx_srm_request ON public.service_request_messages(request_id, created_at);

-- ============ Extend merchant_orders for instant checkout categories ============
ALTER TABLE public.merchant_orders
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'food',
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS laundry_items jsonb,
  ADD COLUMN IF NOT EXISTS pickup_window jsonb,
  ADD COLUMN IF NOT EXISTS delivery_window jsonb,
  ADD COLUMN IF NOT EXISTS special_instructions text,
  ADD COLUMN IF NOT EXISTS escrow_held boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS released_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_merchant_orders_type ON public.merchant_orders(order_type, status, created_at DESC);

-- ============ Extend merchants for pricing config + service categories ============
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS printing_pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS laundry_pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS service_categories text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_merchants_service_categories ON public.merchants USING gin(service_categories);
