import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChallengeNotificationRequest {
  challengeId: string;
  opponentId: string;
  hostUsername: string;
  subject: string;
  durationSeconds: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { challengeId, opponentId, hostUsername, subject, durationSeconds }: ChallengeNotificationRequest = await req.json();
    
    console.log("Sending challenge notification:", { challengeId, opponentId, hostUsername, subject });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get opponent's email and notification preferences
    const { data: opponent, error: opponentError } = await supabase
      .from('profiles')
      .select('email, notification_preferences')
      .eq('id', opponentId)
      .single();

    if (opponentError || !opponent?.email) {
      console.error("Error fetching opponent:", opponentError);
      return new Response(
        JSON.stringify({ error: "Opponent not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const notificationPrefs = opponent.notification_preferences || { email: true, push: true };
    const results = { email: false, inApp: false };

    // Create in-app notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_email: opponent.email,
        title: '⚔️ Challenge Request!',
        message: `${hostUsername} challenged you to a ${subject} battle! (${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')})`,
        type: 'challenge_request',
        link: '/cbt/streak-challenge',
      });

    if (!notifError) {
      results.inApp = true;
      console.log("In-app notification created successfully");
    } else {
      console.error("Error creating in-app notification:", notifError);
    }

    // Send email notification if enabled
    if (notificationPrefs.email !== false) {
      const brevoApiKey = Deno.env.get('BREVO_API_KEY');
      
      if (brevoApiKey) {
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://venobot.online';
        const challengeLink = `${frontendUrl}/cbt/streak-challenge`;

        const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'api-key': brevoApiKey,
          },
          body: JSON.stringify({
            sender: {
              name: 'Veno Challenge',
              email: 'notifications@veno.com'
            },
            to: [{ email: opponent.email }],
            subject: `⚔️ ${hostUsername} challenged you to a battle!`,
            htmlContent: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
                  .header { background: linear-gradient(135deg, #8B5CF6, #6366F1); padding: 30px; text-align: center; }
                  .header h1 { color: white; margin: 0; font-size: 24px; }
                  .content { padding: 30px; }
                  .challenge-card { background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
                  .challenge-card h2 { color: #d97706; margin: 0 0 10px 0; font-size: 20px; }
                  .details { background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 15px 0; }
                  .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                  .details-row:last-child { border-bottom: none; }
                  .btn { display: inline-block; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; }
                  .btn:hover { opacity: 0.9; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                  .urgent { color: #dc2626; font-weight: bold; font-size: 14px; margin-top: 15px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>⚔️ You've Been Challenged!</h1>
                  </div>
                  <div class="content">
                    <div class="challenge-card">
                      <h2>${hostUsername} wants to battle!</h2>
                      <p style="margin: 0; color: #92400e;">Think you can beat them?</p>
                    </div>
                    
                    <div class="details">
                      <div class="details-row">
                        <span>📚 Subject:</span>
                        <strong>${subject}</strong>
                      </div>
                      <div class="details-row">
                        <span>⏱️ Duration:</span>
                        <strong>${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}</strong>
                      </div>
                    </div>
                    
                    <div style="text-align: center;">
                      <a href="${challengeLink}" class="btn">Accept Challenge</a>
                    </div>
                    
                    <p class="urgent">⚡ Hurry! This challenge expires in 30 seconds!</p>
                  </div>
                  <div class="footer">
                    <p>You're receiving this because someone challenged you on Veno.</p>
                    <p>© ${new Date().getFullYear()} Veno - Challenge your knowledge!</p>
                  </div>
                </div>
              </body>
              </html>
            `
          })
        });

        if (emailResponse.ok) {
          results.email = true;
          console.log("Email notification sent successfully");
        } else {
          const errorData = await emailResponse.json();
          console.error("Brevo API error:", errorData);
        }
      } else {
        console.warn("BREVO_API_KEY not configured, skipping email notification");
      }
    }

    console.log("Notification results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending challenge notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
