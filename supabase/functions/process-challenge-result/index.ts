import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { challengeId, hostScore, opponentScore } = await req.json();
    
    console.log(`Processing challenge result: challengeId=${challengeId}, hostScore=${hostScore}, opponentScore=${opponentScore}`);

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('streak_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      throw new Error('Challenge not found');
    }

    // Determine winner
    let winnerId: string | null = null;
    let isDraw = false;

    if (hostScore > opponentScore) {
      winnerId = challenge.host_id;
    } else if (opponentScore > hostScore) {
      winnerId = challenge.opponent_id;
    } else {
      isDraw = true;
    }

    // Update challenge with results
    const { error: updateError } = await supabase
      .from('streak_challenges')
      .update({
        host_score: hostScore,
        opponent_score: opponentScore,
        winner_id: winnerId,
        is_draw: isDraw,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (updateError) {
      throw updateError;
    }

    const today = new Date().toISOString().split('T')[0];

    // Update stats for both players
    const updatePlayerStats = async (userId: string, isWinner: boolean) => {
      // Get current stats
      const { data: stats, error: statsError } = await supabase
        .from('user_challenge_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error(`Error fetching stats for ${userId}:`, statsError);
        return;
      }

      let currentStreak = stats?.current_streak || 0;
      let highestStreak = stats?.highest_streak || 0;
      let totalWins = stats?.total_wins || 0;
      let totalChallenges = (stats?.total_challenges || 0) + 1;

      // Check if streak should reset (skipped a day)
      if (stats?.last_challenge_date) {
        const lastDate = new Date(stats.last_challenge_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
          // Reset streak to 1 if they skipped a day
          currentStreak = 0;
          console.log(`Streak reset for ${userId} due to ${daysDiff} days gap`);
        }
      }

      // Update streak if winner
      if (isWinner) {
        currentStreak += 1;
        totalWins += 1;
        if (currentStreak > highestStreak) {
          highestStreak = currentStreak;
        }
      }
      // Note: Loser doesn't lose streak (per requirements)

      if (stats) {
        // Update existing stats
        await supabase
          .from('user_challenge_stats')
          .update({
            current_streak: currentStreak,
            highest_streak: highestStreak,
            total_wins: totalWins,
            total_challenges: totalChallenges,
            last_challenge_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      } else {
        // Insert new stats
        await supabase
          .from('user_challenge_stats')
          .insert({
            user_id: userId,
            current_streak: isWinner ? 1 : 0,
            highest_streak: isWinner ? 1 : 0,
            total_wins: isWinner ? 1 : 0,
            total_challenges: 1,
            last_challenge_date: today
          });
      }
    };

    // Update both players' stats
    if (!isDraw) {
      await updatePlayerStats(challenge.host_id, winnerId === challenge.host_id);
      if (challenge.opponent_id) {
        await updatePlayerStats(challenge.opponent_id, winnerId === challenge.opponent_id);
      }
    } else {
      // For draws, just increment total_challenges
      await updatePlayerStats(challenge.host_id, false);
      if (challenge.opponent_id) {
        await updatePlayerStats(challenge.opponent_id, false);
      }
    }

    console.log(`Challenge ${challengeId} processed successfully. Winner: ${winnerId || 'Draw'}`);

    return new Response(JSON.stringify({ 
      success: true,
      winnerId,
      isDraw,
      hostScore,
      opponentScore
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-challenge-result:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
