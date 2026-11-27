import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Invalid session" }, 401);
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "save_to_goal": {
        const { goal_id, amount, pin } = params;

        // Verify PIN
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("transaction_pin_hash")
          .eq("id", user.id)
          .single();

        if (!profile?.transaction_pin_hash) {
          return jsonResponse({ success: false, error: "Set a transaction PIN first" });
        }

        const validPin = bcrypt.compareSync(pin, profile.transaction_pin_hash);
        if (!validPin) {
          return jsonResponse({ success: false, error: "Incorrect PIN" });
        }

        // Verify goal belongs to user
        const { data: goal } = await supabaseAdmin
          .from("savings_goals")
          .select("*")
          .eq("id", goal_id)
          .eq("user_id", user.id)
          .single();

        if (!goal) return jsonResponse({ success: false, error: "Goal not found" });
        if (goal.status !== "active") return jsonResponse({ success: false, error: "Goal is not active" });

        // Check wallet balance
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .single();

        if (!wallet) return jsonResponse({ success: false, error: "Wallet not found" });
        if (Number(wallet.balance) < amount) return jsonResponse({ success: false, error: "Insufficient balance" });

        // Debit wallet
        await supabaseAdmin
          .from("wallets")
          .update({ balance: Number(wallet.balance) - amount })
          .eq("id", wallet.id);

        // Credit savings goal
        const newSaved = Number(goal.saved_amount) + amount;
        const newStatus = newSaved >= Number(goal.target_amount) ? "completed" : "active";
        await supabaseAdmin
          .from("savings_goals")
          .update({ saved_amount: newSaved, status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", goal_id);

        return jsonResponse({ success: true, new_saved: newSaved });
      }

      case "withdraw_from_goal": {
        const { goal_id, amount, pin } = params;

        // Verify PIN
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("transaction_pin_hash")
          .eq("id", user.id)
          .single();

        if (!profile?.transaction_pin_hash) {
          return jsonResponse({ success: false, error: "Set a transaction PIN first" });
        }

        const validPin = bcrypt.compareSync(pin, profile.transaction_pin_hash);
        if (!validPin) {
          return jsonResponse({ success: false, error: "Incorrect PIN" });
        }

        // Verify goal belongs to user
        const { data: goal } = await supabaseAdmin
          .from("savings_goals")
          .select("*")
          .eq("id", goal_id)
          .eq("user_id", user.id)
          .single();

        if (!goal) return jsonResponse({ success: false, error: "Goal not found" });
        if (Number(goal.saved_amount) < amount) return jsonResponse({ success: false, error: "Exceeds saved amount" });

        // Credit wallet
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("id, balance")
          .eq("user_id", user.id)
          .single();

        if (!wallet) return jsonResponse({ success: false, error: "Wallet not found" });

        await supabaseAdmin
          .from("wallets")
          .update({ balance: Number(wallet.balance) + amount })
          .eq("id", wallet.id);

        // Debit savings goal
        const newSaved = Number(goal.saved_amount) - amount;
        await supabaseAdmin
          .from("savings_goals")
          .update({
            saved_amount: newSaved,
            status: newSaved <= 0 ? "withdrawn" : "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", goal_id);

        return jsonResponse({ success: true, new_saved: newSaved });
      }

      default:
        return jsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (err) {
    console.error("Savings error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
