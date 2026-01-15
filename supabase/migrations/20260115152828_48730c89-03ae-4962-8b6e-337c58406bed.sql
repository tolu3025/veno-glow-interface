-- Insert admin role for marvelousotuagan@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('cd8a1b4b-a746-4d9f-a0bf-6cc32389a96c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop existing policies on course_materials
DROP POLICY IF EXISTS "Admins can manage course materials" ON public.course_materials;
DROP POLICY IF EXISTS "Everyone can read course materials" ON public.course_materials;

-- Create proper admin policy using has_role function
CREATE POLICY "Admins can manage course materials"
ON public.course_materials
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Everyone can read course materials
CREATE POLICY "Everyone can read course materials"
ON public.course_materials
FOR SELECT
USING (true);