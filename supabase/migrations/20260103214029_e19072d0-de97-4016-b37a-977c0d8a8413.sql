-- Create user_coins table to track coin balances
CREATE TABLE public.user_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_coins
CREATE POLICY "Users can view their own coin balance" 
ON public.user_coins FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own coin balance" 
ON public.user_coins FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage all coin balances" 
ON public.user_coins FOR ALL 
USING (true);

-- Create coin_transactions table
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('challenge_win', 'leaderboard_reward', 'feature_unlock', 'admin_grant')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for coin_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.coin_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.coin_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create feature_unlocks table
CREATE TABLE public.feature_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  coins_spent INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for feature_unlocks
CREATE POLICY "Users can view their own unlocks" 
ON public.feature_unlocks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own unlocks" 
ON public.feature_unlocks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add weekly_rank columns to user_challenge_stats
ALTER TABLE public.user_challenge_stats 
ADD COLUMN IF NOT EXISTS weekly_rank INTEGER,
ADD COLUMN IF NOT EXISTS last_ranked_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to update updated_at on user_coins
CREATE TRIGGER update_user_coins_updated_at
BEFORE UPDATE ON public.user_coins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create user_coins on first coin transaction
CREATE OR REPLACE FUNCTION public.ensure_user_coins_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, balance, total_earned)
  VALUES (NEW.user_id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating user_coins
CREATE TRIGGER ensure_user_coins_before_transaction
BEFORE INSERT ON public.coin_transactions
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_coins_exists();