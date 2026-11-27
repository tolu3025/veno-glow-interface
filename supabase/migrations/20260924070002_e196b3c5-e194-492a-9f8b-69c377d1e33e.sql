CREATE OR REPLACE FUNCTION public.get_collection_claim_status(p_claim_id uuid)
RETURNS TABLE(status text, amount numeric, payer_name text, payer_matric_number text, confirmed_at timestamptz, reference text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cp.status::text, cp.amount, cp.payer_name, cp.payer_matric_number,
         COALESCE(cp.matched_at, CASE WHEN cp.status::text='confirmed' THEN now() END),
         cp.id::text
  FROM public.collection_payments cp WHERE cp.id = p_claim_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_collection_claim_status(uuid) TO anon, authenticated;