import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Coin rewards for leaderboard positions
const COIN_REWARDS = {
  1: 100,  // 1st place
  2: 60,   // 2nd place
  3: 5,    // 3rd-10th place (each gets 5)
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting weekly coin distribution...');

    // Get top 10 users from leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('user_challenge_stats')
      .select('user_id, highest_streak, total_wins')
      .order('highest_streak', { ascending: false })
      .order('total_wins', { ascending: false })
      .limit(10);

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError);
      throw leaderboardError;
    }

    if (!leaderboard || leaderboard.length === 0) {
      console.log('No users on leaderboard to reward');
      return new Response(JSON.stringify({ message: 'No users to reward' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${leaderboard.length} users to reward`);

    const results: { userId: string; coins: number; rank: number }[] = [];

    // Distribute coins to each user
    for (let i = 0; i < leaderboard.length; i++) {
      const entry = leaderboard[i];
      const rank = i + 1;
      let coinsToAward = 0;

      if (rank === 1) {
        coinsToAward = COIN_REWARDS[1];
      } else if (rank === 2) {
        coinsToAward = COIN_REWARDS[2];
      } else if (rank >= 3 && rank <= 10) {
        coinsToAward = COIN_REWARDS[3];
      }

      if (coinsToAward > 0) {
        // Ensure user_coins record exists
        await supabase
          .from('user_coins')
          .upsert({
            user_id: entry.user_id,
            balance: 0,
            total_earned: 0,
          }, { onConflict: 'user_id' });

        // Get current balance
        const { data: currentCoins } = await supabase
          .from('user_coins')
          .select('balance, total_earned')
          .eq('user_id', entry.user_id)
          .single();

        const currentBalance = currentCoins?.balance || 0;
        const currentTotalEarned = currentCoins?.total_earned || 0;

        // Update balance
        const { error: updateError } = await supabase
          .from('user_coins')
          .update({
            balance: currentBalance + coinsToAward,
            total_earned: currentTotalEarned + coinsToAward,
          })
          .eq('user_id', entry.user_id);

        if (updateError) {
          console.error(`Error updating coins for user ${entry.user_id}:`, updateError);
          continue;
        }

        // Create transaction record
        await supabase
          .from('coin_transactions')
          .insert({
            user_id: entry.user_id,
            amount: coinsToAward,
            transaction_type: 'leaderboard_reward',
            description: `Weekly leaderboard reward - Rank #${rank}`,
          });

        // Update weekly rank
        await supabase
          .from('user_challenge_stats')
          .update({
            weekly_rank: rank,
            last_ranked_at: new Date().toISOString(),
          })
          .eq('user_id', entry.user_id);

        // Create notification
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', entry.user_id)
          .single();

        if (profile?.email) {
          await supabase
            .from('notifications')
            .insert({
              user_email: profile.email,
              title: '🏆 Weekly Leaderboard Rewards!',
              message: `Congratulations! You finished #${rank} on the leaderboard and earned ${coinsToAward} coins!`,
              type: 'leaderboard_reward',
              link: '/cbt/streak-leaderboard',
            });
        }

        results.push({ userId: entry.user_id, coins: coinsToAward, rank });
        console.log(`Awarded ${coinsToAward} coins to user ${entry.user_id} (Rank #${rank})`);
      }
    }

    console.log('Weekly coin distribution complete:', results);

    return new Response(JSON.stringify({
      success: true,
      message: 'Weekly coin distribution completed',
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weekly coin distribution:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
