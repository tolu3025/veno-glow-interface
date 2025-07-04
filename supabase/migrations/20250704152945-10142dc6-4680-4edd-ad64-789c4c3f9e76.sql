
-- Drop the existing admin_user_view if it exists
DROP VIEW IF EXISTS public.admin_user_view;

-- Create the corrected admin_user_view with ban fields
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

-- Grant access to the view for authenticated users
GRANT SELECT ON public.admin_user_view TO authenticated;

-- Create RLS policy for the view (if it doesn't exist)
DROP POLICY IF EXISTS "Admins can view admin users view" ON public.admin_user_view;
CREATE POLICY "Admins can view admin users view" ON public.admin_user_view
FOR SELECT TO authenticated
USING (is_current_user_admin_secure() OR is_admin_by_email());
