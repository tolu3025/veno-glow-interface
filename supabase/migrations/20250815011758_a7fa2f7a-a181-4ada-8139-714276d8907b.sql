-- Fix infinite recursion in user_roles table by creating security definer functions
-- This replaces the existing functions that might be causing circular references

-- Drop existing functions that might be causing issues
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- Create security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create security definer function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  );
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role IN ('admin', 'superadmin')
  );
$$;

-- Create security definer function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$$;

-- Drop all existing policies on user_roles table to prevent recursion
DROP POLICY IF EXISTS "Allow admins to view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create simple, non-recursive policies for user_roles table
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all user roles"
ON public.user_roles
FOR ALL
USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, anon;