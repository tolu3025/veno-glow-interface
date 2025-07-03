
-- Fix the infinite recursion issue in user_roles policies by creating a secure function
CREATE OR REPLACE FUNCTION public.is_current_user_admin_secure()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  );
$$;

-- Create a function to check if user is admin by email (for hardcoded admin)
CREATE OR REPLACE FUNCTION public.is_admin_by_email()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.email() = 'williamsbenjaminacc@gmail.com';
$$;

-- Add missing user_bans table for user management
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user_bans
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Policy for user_bans - only admins can manage
CREATE POLICY "Admins can manage user bans" ON public.user_bans
FOR ALL TO authenticated
USING (is_current_user_admin_secure() OR is_admin_by_email())
WITH CHECK (is_current_user_admin_secure() OR is_admin_by_email());

-- Fix blog_articles policies to allow admin posting
DROP POLICY IF EXISTS "Blog articles are publicly readable" ON public.blog_articles;
DROP POLICY IF EXISTS "Anyone can read published blog articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can view all blog articles" ON public.blog_articles;
DROP POLICY IF EXISTS "Admins can manage blog articles" ON public.blog_articles;

-- Create new policies for blog_articles without recursion
CREATE POLICY "Public can read published articles" ON public.blog_articles
FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Admins can manage all articles" ON public.blog_articles
FOR ALL TO authenticated
USING (is_current_user_admin_secure() OR is_admin_by_email())
WITH CHECK (is_current_user_admin_secure() OR is_admin_by_email());

-- Fix user_profiles policies to allow admin access
CREATE POLICY "Admins can manage all user profiles" ON public.user_profiles
FOR ALL TO authenticated
USING (is_current_user_admin_secure() OR is_admin_by_email() OR user_id = auth.uid())
WITH CHECK (is_current_user_admin_secure() OR is_admin_by_email() OR user_id = auth.uid());

-- Create admin view for user management without recursion issues
CREATE OR REPLACE VIEW public.admin_users_view AS
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
  CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as is_banned,
  ub.reason as ban_reason,
  ub.expires_at as ban_expires_at
FROM public.user_profiles up
LEFT JOIN public.user_roles ur ON up.user_id = ur.user_id
LEFT JOIN public.user_bans ub ON up.user_id = ub.user_id AND ub.is_active = true;

-- Grant access to the view for admins
GRANT SELECT ON public.admin_users_view TO authenticated;

-- Create policy for the admin view
CREATE POLICY "Admins can view admin users view" ON public.admin_users_view
FOR SELECT TO authenticated
USING (is_current_user_admin_secure() OR is_admin_by_email());
