-- Create user_challenge_stats table to track streak and wins
CREATE TABLE public.user_challenge_stats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    highest_streak INTEGER NOT NULL DEFAULT 0,
    total_wins INTEGER NOT NULL DEFAULT 0,
    total_challenges INTEGER NOT NULL DEFAULT 0,
    last_challenge_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create streak_challenges table
CREATE TABLE public.streak_challenges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID NOT NULL,
    opponent_id UUID,
    subject TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'easy',
    status TEXT NOT NULL DEFAULT 'pending',
    questions JSONB,
    host_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    winner_id UUID,
    is_draw BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create challenge_answers table for real-time answer tracking
CREATE TABLE public.challenge_answers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.streak_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    question_index INTEGER NOT NULL,
    selected_answer INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_streak_challenges_host ON public.streak_challenges(host_id);
CREATE INDEX idx_streak_challenges_opponent ON public.streak_challenges(opponent_id);
CREATE INDEX idx_streak_challenges_status ON public.streak_challenges(status);
CREATE INDEX idx_challenge_answers_challenge ON public.challenge_answers(challenge_id);
CREATE INDEX idx_user_challenge_stats_streak ON public.user_challenge_stats(current_streak DESC);

-- Enable RLS on all tables
ALTER TABLE public.user_challenge_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_challenge_stats
CREATE POLICY "Users can view all challenge stats" ON public.user_challenge_stats
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON public.user_challenge_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.user_challenge_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for streak_challenges
CREATE POLICY "Users can view challenges they are part of" ON public.streak_challenges
    FOR SELECT USING (auth.uid() = host_id OR auth.uid() = opponent_id OR status = 'pending');

CREATE POLICY "Users can create challenges" ON public.streak_challenges
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Participants can update their challenges" ON public.streak_challenges
    FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = opponent_id);

-- RLS Policies for challenge_answers
CREATE POLICY "Users can view answers for their challenges" ON public.challenge_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.streak_challenges sc 
            WHERE sc.id = challenge_id 
            AND (sc.host_id = auth.uid() OR sc.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert their own answers" ON public.challenge_answers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for streak_challenges and challenge_answers
ALTER PUBLICATION supabase_realtime ADD TABLE public.streak_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_answers;

-- Create trigger to update updated_at
CREATE TRIGGER update_user_challenge_stats_updated_at
    BEFORE UPDATE ON public.user_challenge_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();