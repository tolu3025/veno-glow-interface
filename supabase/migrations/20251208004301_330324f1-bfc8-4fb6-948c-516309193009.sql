-- Add columns to track when each player finishes
ALTER TABLE public.streak_challenges
ADD COLUMN IF NOT EXISTS host_finished boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS opponent_finished boolean DEFAULT false;