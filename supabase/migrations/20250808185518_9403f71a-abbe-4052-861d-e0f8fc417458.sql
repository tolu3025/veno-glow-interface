-- Fix recursive RLS policies on public.user_roles by removing self-referencing conditions
-- and replacing them with non-recursive, safe policies.

begin;

-- Drop all existing policies on user_roles to eliminate recursion
DO $$ 
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT polname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol.polname);
  END LOOP;
END$$;

-- Ensure RLS is enabled (do not force to keep current behavior consistent)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles (non-recursive)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Superadmin can fully manage roles via email whitelist (avoids querying user_roles in policy)
CREATE POLICY "Superadmin can manage user roles"
ON public.user_roles
FOR ALL
USING ((auth.jwt() ->> 'email') = 'williamsbenjaminacc@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'williamsbenjaminacc@gmail.com');

commit;