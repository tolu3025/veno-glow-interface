DROP POLICY IF EXISTS "Creators can delete own completed collections" ON public.collections;
CREATE POLICY "Creators can delete own collections"
ON public.collections FOR DELETE TO authenticated
USING (auth.uid() = creator_id);

CREATE OR REPLACE FUNCTION public.get_public_collection(p_collection_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  target_amount numeric,
  amount_per_person numeric,
  total_collected numeric,
  participant_count integer,
  status text,
  deadline timestamptz,
  require_matric boolean,
  virtual_account_number text,
  virtual_bank_name text,
  virtual_account_name text,
  organizer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.title, c.description, c.target_amount, c.amount_per_person,
         c.total_collected, c.participant_count, c.status::text, c.deadline,
         c.require_matric, c.virtual_account_number, c.virtual_bank_name,
         c.virtual_account_name, p.full_name
  FROM public.collections c
  LEFT JOIN public.profiles p ON p.id = c.creator_id
  WHERE c.id = p_collection_id;
$$;

REVOKE ALL ON FUNCTION public.get_public_collection(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_collection(uuid) TO anon, authenticated, service_role;