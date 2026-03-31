
-- Allow admins to manage seasons
CREATE POLICY "Admins can manage seasons" ON public.jamb_challenge_seasons
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));

-- Seed first season
INSERT INTO public.jamb_challenge_seasons (title, starts_at, ends_at, prize_description, is_active)
VALUES ('JAMB Challenge Season 1', now(), now() + interval '14 days', '₦10,000 shared among 1st to 3rd place by VenoBot', true);
