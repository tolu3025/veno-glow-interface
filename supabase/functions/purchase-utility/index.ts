import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { grantCashback } from "../_shared/cashback.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLW_BASE = "https://api.flutterwave.com/v3";

// Flutterwave biller codes for data bundles per network
const DATA_BILLER_CODE: Record<string, string> = {
  mtn: "BIL108",
  glo: "BIL109",
  airtel: "BIL110",
  "9mobile": "BIL111",
};

async function legacySha256(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPin(pin: string, storedHash: string, userId: string, adminClient: any): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compareSync(pin, storedHash);
  }
  const sha256Hash = await legacySha256(pin);
  if (sha256Hash === storedHash) {
    const bcryptHash = bcrypt.hashSync(pin, 10);
    await adminClient.from("profiles").update({ transaction_pin_hash: bcryptHash }).eq("id", userId);
    return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const flwSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flwSecretKey) {
      console.error("[purchase-utility] Missing FLUTTERWAVE_SECRET_KEY");
      return new Response(JSON.stringify({ success: false, error: "Service temporarily unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, network, phone, amount, bundle, pin, item_code, biller_code } = await req.json();

    if (!type || !network || !phone || !amount || amount < 50) {
      return new Response(JSON.stringify({ success: false, error: "Invalid input" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["mtn", "glo", "airtel", "9mobile"].includes(network)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid network" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^0[789]\d{9}$/.test(phone)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid phone number" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check PIN lockout
    const { data: lockStatus } = await supabase.rpc("check_pin_lockout", { p_user_id: user.id });
    if (lockStatus?.locked) {
      return new Response(JSON.stringify({ success: false, error: lockStatus.message, locked: true }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify PIN
    const { data: profile } = await supabase
      .from("profiles")
      .select("transaction_pin_hash")
      .eq("id", user.id)
      .single();

    if (!profile?.transaction_pin_hash) {
      return new Response(JSON.stringify({ success: false, error: "Transaction PIN not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pinValid = await verifyPin(pin, profile.transaction_pin_hash, user.id, supabase);
    if (!pinValid) {
      const { data: failResult } = await supabase.rpc("record_failed_pin", { p_user_id: user.id });
      const msg = failResult?.locked
        ? "Account locked for 30 minutes due to failed PIN attempts."
        : `Incorrect PIN. ${failResult?.remaining || 0} attempts remaining.`;
      return new Response(JSON.stringify({ success: false, error: msg, locked: failResult?.locked }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.rpc("reset_pin_attempts", { p_user_id: user.id });

    // Check balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance, available_balance")
      .eq("user_id", user.id)
      .single();

    if (!wallet || Number(wallet.available_balance ?? wallet.balance) < amount) {
      return new Response(JSON.stringify({ success: false, error: "Insufficient balance" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const commissionRate = type === "data" ? 0.04 : 0.03;
    const commission = Math.round(amount * commissionRate * 100) / 100;
    const reference = `VTU-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Build Flutterwave bill payment request
    let flwData: Record<string, unknown>;

    if (type === "airtime") {
      // Airtime uses the standard bills endpoint
      const billPayload = {
        country: "NG",
        customer: phone,
        amount: amount,
        recurrence: "ONCE",
        type: "AIRTIME",
        reference: reference,
      };

      console.log(`[purchase-utility] Airtime payload: ${JSON.stringify(billPayload)}`);

      const flwResponse = await fetch(`${FLW_BASE}/bills`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${flwSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billPayload),
      });

      const flwText = await flwResponse.text();
      console.log(`[purchase-utility] Flutterwave status: ${flwResponse.status}, response: ${flwText.slice(0, 500)}`);

      try {
        flwData = JSON.parse(flwText);
      } catch {
        console.error("[purchase-utility] Invalid Flutterwave response:", flwText.slice(0, 200));
        return new Response(JSON.stringify({ success: false, error: "Purchase failed. Please try again." }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Data bundles — use the items order endpoint with biller_code + item_code
      if (!bundle) {
        return new Response(JSON.stringify({ success: false, error: "Invalid data bundle" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine biller_code from network
      const networkBillerCode = biller_code || DATA_BILLER_CODE[network];
      const itemCode = item_code;
      
      if (itemCode && networkBillerCode) {
        // Use the orders endpoint with biller_code + item_code
        const orderPayload = {
          country: "NG",
          customer: {
            name: "Customer",
            email: "customer@kuka.app",
            phone_number: phone,
          },
          amount: String(amount),
          reference: reference,
        };

        console.log(`[purchase-utility] Data order: biller=${networkBillerCode}, item=${itemCode}, payload=${JSON.stringify(orderPayload)}`);

        const flwResponse = await fetch(`${FLW_BASE}/billers/${networkBillerCode}/items/${itemCode}/orders`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${flwSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderPayload),
        });

        const flwText = await flwResponse.text();
        console.log(`[purchase-utility] Flutterwave status: ${flwResponse.status}, response: ${flwText.slice(0, 500)}`);

        try {
          flwData = JSON.parse(flwText);
        } catch {
          console.error("[purchase-utility] Invalid Flutterwave response:", flwText.slice(0, 200));
          return new Response(JSON.stringify({ success: false, error: "Purchase failed. Please try again." }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // Fallback to bills endpoint with type=biller_name
        const billPayload = {
          country: "NG",
          customer: phone,
          amount: amount,
          recurrence: "ONCE",
          type: bundle,
          reference: reference,
        };

        console.log(`[purchase-utility] Data bills fallback payload: ${JSON.stringify(billPayload)}`);

        const flwResponse = await fetch(`${FLW_BASE}/bills`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${flwSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(billPayload),
        });

        const flwText = await flwResponse.text();
        console.log(`[purchase-utility] Flutterwave status: ${flwResponse.status}, response: ${flwText.slice(0, 500)}`);

        try {
          flwData = JSON.parse(flwText);
        } catch {
          console.error("[purchase-utility] Invalid Flutterwave response:", flwText.slice(0, 200));
          return new Response(JSON.stringify({ success: false, error: "Purchase failed. Please try again." }), {
            status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (flwData.status !== "success" && flwData.status !== "pending") {
      const errorMsg = (flwData.message as string) || "Purchase failed at provider";
      console.error(`[purchase-utility] Flutterwave error: ${JSON.stringify(flwData)}`);
      return new Response(JSON.stringify({ success: false, error: errorMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // "pending" is normal for bill payments — Flutterwave processes asynchronously
    const isPending = flwData.status === "pending";
    console.log(`[purchase-utility] Flutterwave status: ${flwData.status}${isPending ? " (will complete async)" : ""}`);

    // Success — deduct from wallet
    await supabase.from("wallets").update({
      balance: Number(wallet.balance) - amount,
      available_balance: Number(wallet.available_balance ?? wallet.balance) - amount,
    }).eq("id", wallet.id);


    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "bill_payment" as const,
      amount,
      status: "completed",
      reference,
      metadata: {
        direction: "debit",
        purchase_type: type === "airtime" ? "airtime" : "data",
        network, phone,
        bundle: bundle || null,
        commission,
        provider: "flutterwave",
        provider_reference: (flwData.data as any)?.tx_ref || (flwData.data as any)?.reference || null,
      },
    });

    // Explicit notification (bill_payment isn't covered by the deposit trigger)
    const purchaseLabel = type === "airtime" ? "Airtime Purchase" : "Data Bundle Purchase";
    await supabase.rpc("create_notification", {
      p_user_id: user.id,
      p_title: purchaseLabel + " Successful",
      p_message: `₦${Number(amount).toLocaleString()} ${type === "airtime" ? "airtime" : "data"} sent to ${phone} (${(network || "").toUpperCase()})`,
      p_type: "bill_payment",
      p_metadata: { reference, amount, network, phone, purchase_type: type },
    });

    // Log commission for revenue tracking
    await supabase.from("commission_logs").insert({
      transaction_reference: reference,
      user_id: user.id,
      commission_type: type === "airtime" ? "airtime" : "data",
      transaction_amount: amount,
      commission_amount: commission,
      commission_rate: commissionRate,
    });

    const cashback = await grantCashback(supabase, user.id, reference, amount, type === "data" ? "data" : "airtime");

    return new Response(
      JSON.stringify({ success: true, reference, commission, cashback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[purchase-utility] Unhandled error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
