-- Update RLS policies for past_questions to only allow admins to upload

-- Drop the existing upload policy
DROP POLICY IF EXISTS "Authenticated users can upload past questions" ON public.past_questions;

-- Create new admin-only upload policy
CREATE POLICY "Only admins can upload past questions"
ON public.past_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'superadmin')
  )
);