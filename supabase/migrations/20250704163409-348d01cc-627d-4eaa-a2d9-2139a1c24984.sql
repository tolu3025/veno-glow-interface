
-- Fix the infinite recursion issue in user_roles policies by creating secure functions
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create or replace the secure admin check function
CREATE OR REPLACE FUNCTION public.is_current_user_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  ) OR auth.email() = 'williamsbenjaminacc@gmail.com';
$$;

-- Create new policies without recursion
CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL TO authenticated
USING (is_current_user_admin_secure())
WITH CHECK (is_current_user_admin_secure());

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_current_user_admin_secure());

-- Update other policies that might be causing recursion
DROP POLICY IF EXISTS "Admins can manage all articles" ON public.blog_articles;
CREATE POLICY "Admins can manage all articles" ON public.blog_articles
FOR ALL TO authenticated
USING (is_current_user_admin_secure())
WITH CHECK (is_current_user_admin_secure());

-- Update admin_user_view to use the secure function
DROP VIEW IF EXISTS public.admin_user_view;
CREATE OR REPLACE VIEW public.admin_user_view AS
SELECT 
  up.id,
  up.user_id,
  up.email,
  up.points,
  up.created_at,
  up.updated_at,
  up.is_verified,
  up.activities,
  COALESCE(ur.role, 'user'::app_role) as role,
  CASE WHEN ub.id IS NOT NULL AND ub.is_active = true THEN true ELSE false END as is_banned,
  ub.reason as ban_reason,
  ub.expires_at as ban_expires_at
FROM public.user_profiles up
LEFT JOIN public.user_roles ur ON up.user_id = ur.user_id
LEFT JOIN public.user_bans ub ON up.user_id = ub.user_id AND ub.is_active = true;

-- Grant access and create policy for the view
GRANT SELECT ON public.admin_user_view TO authenticated;

DROP POLICY IF EXISTS "Admins can view admin users view" ON public.admin_user_view;
CREATE POLICY "Admins can view admin users view" ON public.admin_user_view
FOR SELECT TO authenticated
USING (is_current_user_admin_secure());
