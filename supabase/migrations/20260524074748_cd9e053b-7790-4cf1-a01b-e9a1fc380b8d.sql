CREATE POLICY "Admins can read all transaction feedback"
ON public.transaction_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));