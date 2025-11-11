-- Update past_questions INSERT policy to use is_admin() security definer function
-- This ensures consistency with storage policies

DROP POLICY IF EXISTS "Only admins can upload past questions" ON public.past_questions;

CREATE POLICY "Only admins can upload past questions"
ON public.past_questions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));