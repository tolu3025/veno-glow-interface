-- Fix infinite recursion in user_roles table by simplifying RLS policies
-- The is_admin() security definer function should bypass RLS, but we need clean policies

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Admin users can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can see all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can access roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can see their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;

-- Create simple, non-recursive policies
-- Allow all authenticated users to SELECT from user_roles (needed for is_admin function)
CREATE POLICY "user_roles_select_all"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only service role can INSERT/UPDATE/DELETE (prevents privilege escalation)
CREATE POLICY "user_roles_service_role_only"
ON public.user_roles
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow admins to manage roles using security definer function (no recursion)
CREATE POLICY "user_roles_admin_manage"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));