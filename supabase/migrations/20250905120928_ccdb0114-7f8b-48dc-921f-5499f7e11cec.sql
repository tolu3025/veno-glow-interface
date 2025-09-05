-- Fix infinite recursion in user_roles RLS policies
-- Drop all existing problematic policies on user_roles
DROP POLICY IF EXISTS "Admin users can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can modify all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only authenticated users can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to create roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to read their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;

-- Create new non-recursive policies using email whitelist
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Hardcoded admin can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.email() = 'williamsbenjaminacc@gmail.com');

CREATE POLICY "Service role can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role');

-- Update admin check functions to use email whitelist instead of role queries
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = _user_id 
    AND email = 'williamsbenjaminacc@gmail.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.email() = 'williamsbenjaminacc@gmail.com';
$$;