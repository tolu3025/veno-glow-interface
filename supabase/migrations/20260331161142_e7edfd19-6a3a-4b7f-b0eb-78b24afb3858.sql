
-- JAMB Challenge seasons and scores tracking
CREATE TABLE public.jamb_challenge_seasons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  prize_description text NOT NULL DEFAULT '₦10,000 shared among top 3',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.jamb_challenge_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  season_id uuid NOT NULL REFERENCES public.jamb_challenge_seasons(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  percentage integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast leaderboard queries
CREATE INDEX idx_jamb_scores_season_points ON public.jamb_challenge_scores(season_id, points DESC);
CREATE INDEX idx_jamb_scores_user_season ON public.jamb_challenge_scores(user_id, season_id);

-- Leaderboard view: aggregate best points per user per season
CREATE OR REPLACE VIEW public.jamb_challenge_leaderboard AS
SELECT 
  s.user_id,
  s.season_id,
  SUM(s.points) as total_points,
  COUNT(*) as attempts,
  MAX(s.percentage) as best_percentage,
  MAX(s.score) as best_score,
  p.display_name,
  p.email
FROM public.jamb_challenge_scores s
LEFT JOIN public.profiles p ON p.id = s.user_id
GROUP BY s.user_id, s.season_id, p.display_name, p.email;

-- RLS
ALTER TABLE public.jamb_challenge_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jamb_challenge_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view seasons
CREATE POLICY "Anyone can view seasons" ON public.jamb_challenge_seasons
  FOR SELECT USING (true);

-- Anyone can view scores (for leaderboard)
CREATE POLICY "Anyone can view scores" ON public.jamb_challenge_scores
  FOR SELECT USING (true);

-- Authenticated users can insert their own scores
CREATE POLICY "Users can insert own scores" ON public.jamb_challenge_scores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
