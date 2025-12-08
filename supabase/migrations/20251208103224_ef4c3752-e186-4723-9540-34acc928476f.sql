-- Add share_code column to streak_challenges for link-based challenges
ALTER TABLE public.streak_challenges 
ADD COLUMN IF NOT EXISTS share_code TEXT UNIQUE;

-- Create index for faster lookup by share_code
CREATE INDEX IF NOT EXISTS idx_streak_challenges_share_code ON public.streak_challenges(share_code);

-- Update RLS to allow viewing challenges by share_code
DROP POLICY IF EXISTS "Users can view challenges they are part of" ON public.streak_challenges;
CREATE POLICY "Users can view challenges they are part of or by share code"
ON public.streak_challenges
FOR SELECT
USING (
  auth.uid() = host_id 
  OR auth.uid() = opponent_id 
  OR status = 'pending'
  OR share_code IS NOT NULL
);

-- Allow any authenticated user to join a challenge via share code
DROP POLICY IF EXISTS "Participants can update their challenges" ON public.streak_challenges;
CREATE POLICY "Participants can update their challenges"
ON public.streak_challenges
FOR UPDATE
USING (
  auth.uid() = host_id 
  OR auth.uid() = opponent_id
  OR (share_code IS NOT NULL AND opponent_id IS NULL AND status = 'pending')
);