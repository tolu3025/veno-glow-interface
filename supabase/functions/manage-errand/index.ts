import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

function jsonRes(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return jsonRes({ success: false, error: "Unauthorized" }, 401);

    const body = await req.json();
    const { action } = body;

    // ── Helper: verify PIN with lockout ──
    async function verifyPinFlow(pin: string) {
      const { data: lockStatus } = await supabase.rpc("check_pin_lockout", { p_user_id: user!.id });
      if (lockStatus?.locked) {
        return { ok: false, res: jsonRes({ success: false, error: lockStatus.message, locked: true }, 403) };
      }
      const { data: profile } = await supabase.from("profiles").select("transaction_pin_hash").eq("id", user!.id).single();
      if (!profile?.transaction_pin_hash) {
        return { ok: false, res: jsonRes({ success: false, error: "Transaction PIN not set" }) };
      }
      const pinValid = await verifyPin(pin, profile.transaction_pin_hash, user!.id, supabase);
      if (!pinValid) {
        const { data: failResult } = await supabase.rpc("record_failed_pin", { p_user_id: user!.id });
        const msg = failResult?.locked
          ? "Account locked for 30 minutes due to failed PIN attempts."
          : `Incorrect PIN. ${failResult?.remaining || 0} attempts remaining.`;
        return { ok: false, res: jsonRes({ success: false, error: msg, locked: failResult?.locked }) };
      }
      await supabase.rpc("reset_pin_attempts", { p_user_id: user!.id });
      return { ok: true, res: null };
    }

    // ── CREATE (legacy free-text errand) ──
    if (action === "create") {
      const { title, description, zone, amount, urgency, pin, requester_lat, requester_lng } = body;
      if (!title || !zone || !amount || amount < 100) return jsonRes({ success: false, error: "Invalid input" });

      const pinCheck = await verifyPinFlow(pin);
      if (!pinCheck.ok) return pinCheck.res!;

      const { data: errand, error: insertError } = await supabase
        .from("errand_requests")
        .insert({
          requester_id: user.id, title, description: description || null,
          zone, amount, urgency: urgency || "standard", status: "open",
          requester_lat: requester_lat || null, requester_lng: requester_lng || null,
          errand_type: "legacy",
          item_cost: body.item_cost || 0,
          delivery_fee: body.convenience_fee || amount,
        })
        .select().single();

      if (insertError) {
        console.error("[manage-errand] Insert error:", insertError);
        return jsonRes({ success: false, error: "Failed to create errand" }, 500);
      }
      return jsonRes({ success: true, errand_id: errand.id });
    }

    // ── CREATE MERCHANT ERRAND ──
    if (action === "create_merchant_errand") {
      const { merchant_id, items, delivery_fee, zone, pin, urgency, requester_lat, requester_lng } = body;

      if (!merchant_id || !items?.length || !delivery_fee || delivery_fee < 100) {
        return jsonRes({ success: false, error: "Invalid input. Need merchant, items, and delivery fee (min ₦100)." });
      }

      const pinCheck = await verifyPinFlow(pin);
      if (!pinCheck.ok) return pinCheck.res!;

      // Fetch merchant
      const { data: merchant } = await supabase.from("merchants").select("*").eq("id", merchant_id).eq("status", "active").single();
      if (!merchant) return jsonRes({ success: false, error: "Merchant not found or inactive" });

      // Validate products and calculate item_cost
      let itemCost = 0;
      const validatedItems: any[] = [];
      for (const item of items) {
        const { data: product } = await supabase.from("merchant_products").select("*")
          .eq("id", item.product_id).eq("merchant_id", merchant_id).eq("is_available", true).single();
        if (!product) return jsonRes({ success: false, error: `Product ${item.product_id} not found` });
        if (product.quantity > 0 && product.quantity < item.quantity) {
          return jsonRes({ success: false, error: `Only ${product.quantity} of ${product.name} available` });
        }
        itemCost += product.price * item.quantity;
        validatedItems.push({ product_id: product.id, name: product.name, price: product.price, quantity: item.quantity });
      }

      const totalAmount = itemCost + delivery_fee;

      // Check wallet balance
      const { data: walletRow } = await supabase.from("wallets").select("id, balance, available_balance").eq("user_id", user.id).single();
      if (!walletRow || Number(walletRow.available_balance ?? walletRow.balance) < totalAmount) {
        return jsonRes({ success: false, error: "Insufficient balance" });
      }

      // Get user profile for order
      const { data: buyerProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

      // Debit wallet (escrow hold) — keep balance and available_balance in sync
      await supabase.from("wallets").update({
        balance: Number(walletRow.balance) - totalAmount,
        available_balance: Number(walletRow.available_balance ?? walletRow.balance) - totalAmount,
      }).eq("id", walletRow.id);


      // Create merchant order
      const { data: order, error: orderErr } = await supabase.from("merchant_orders").insert({
        merchant_id, customer_id: user.id, customer_name: buyerProfile?.full_name || "Customer",
        total_amount: itemCost, items: validatedItems, status: "pending", delivery_status: "awaiting_runner",
      }).select().single();

      if (orderErr) {
        // Refund on failure
        await supabase.from("wallets").update({ balance: Number(walletRow.balance), available_balance: Number(walletRow.available_balance ?? walletRow.balance) }).eq("id", walletRow.id);

        console.error("[manage-errand] Order error:", orderErr);
        return jsonRes({ success: false, error: "Failed to create order" }, 500);
      }

      // Deduct product quantities
      for (const item of validatedItems) {
        const { data: prod } = await supabase
          .from("merchant_products")
          .select("quantity")
          .eq("id", item.product_id)
          .single();
        const currentQty = (prod as any)?.quantity ?? 0;
        await supabase
          .from("merchant_products")
          .update({ quantity: Math.max(0, currentQty - item.quantity) })
          .eq("id", item.product_id);
        // Use raw update for quantity decrement
        await supabase.rpc("create_notification", {
          p_user_id: merchant.user_id,
          p_title: "New Order 📦",
          p_message: `${buyerProfile?.full_name || "A customer"} ordered ${validatedItems.length} item(s) for delivery`,
          p_type: "merchant",
          p_metadata: { merchant_id, order_id: order.id },
        });
      }

      // Create errand request
      const errandTitle = `Deliver from ${merchant.business_name}`;
      const errandDesc = validatedItems.map(i => `${i.name} ×${i.quantity}`).join(", ");

      // Use merchant's saved coordinates as the pickup point on the map
      const merchantLat = (merchant as any).latitude ?? null;
      const merchantLng = (merchant as any).longitude ?? null;
      if (merchantLat == null || merchantLng == null) {
        console.warn("[manage-errand] Merchant has no saved location:", merchant.id);
      }

      const { data: errand, error: errandErr } = await supabase.from("errand_requests").insert({
        requester_id: user.id, title: errandTitle, description: errandDesc,
        zone: zone || null, amount: totalAmount, urgency: urgency || "standard", status: "open",
        requester_lat: requester_lat || null, requester_lng: requester_lng || null,
        delivery_lat: merchantLat, delivery_lng: merchantLng,
        merchant_id, merchant_order_id: order.id,
        item_cost: itemCost, delivery_fee, errand_type: "merchant",
      }).select().single();

      if (errandErr) {
        console.error("[manage-errand] Errand error:", errandErr);
        // Refund
        await supabase.from("wallets").update({ balance: Number(walletRow.balance), available_balance: Number(walletRow.available_balance ?? walletRow.balance) }).eq("id", walletRow.id);
        return jsonRes({ success: false, error: "Failed to create errand" }, 500);
      }

      // Link order back to errand
      await supabase.from("merchant_orders").update({ errand_id: errand.id }).eq("id", order.id);

      // Record escrow transaction
      const reference = "ERR-M-" + crypto.randomUUID();
      await supabase.from("transactions").insert({
        user_id: user.id, type: "errand_payment", amount: totalAmount, status: "pending",
        reference, metadata: {
          direction: "debit", errand_id: errand.id, errand_title: errandTitle,
          merchant_id, order_id: order.id, item_cost: itemCost, delivery_fee,
        },
      });

      // Notify customer that order was placed and escrow is held
      await supabase.rpc("create_notification", {
        p_user_id: user.id,
        p_title: "Order placed 📦",
        p_message: `Your order from ${merchant.business_name} is awaiting a runner. ₦${totalAmount} held in escrow.`,
        p_type: "merchant",
        p_metadata: { order_id: order.id, errand_id: errand.id, merchant_id, amount: totalAmount },
      });

      return jsonRes({ success: true, errand_id: errand.id, order_id: order.id, reference });
    }

    // ── ACCEPT ──
    if (action === "accept") {
      const { errand_id, helper_lat, helper_lng } = body;

      // Check runner approval
      const { data: runnerApp } = await supabase.from("runner_applications")
        .select("status").eq("user_id", user.id).eq("status", "approved").maybeSingle();
      if (!runnerApp) {
        return jsonRes({ success: false, error: "Only approved runners can accept errands. Apply at Runner Registration." });
      }

      // Check distance restriction (max 2km)
      const { data: errandForDist } = await supabase.from("errand_requests")
        .select("requester_lat, requester_lng, delivery_lat, delivery_lng, errand_type, merchant_order_id")
        .eq("id", errand_id).single();

      if (helper_lat && helper_lng && errandForDist) {
        const eLat = errandForDist.requester_lat || errandForDist.delivery_lat;
        const eLng = errandForDist.requester_lng || errandForDist.delivery_lng;
        if (eLat && eLng) {
          // Haversine for radius gating
          const R = 6371;
          const dLat = (eLat - helper_lat) * Math.PI / 180;
          const dLng = (eLng - helper_lng) * Math.PI / 180;
          const a = Math.sin(dLat/2)**2 + Math.cos(helper_lat*Math.PI/180)*Math.cos(eLat*Math.PI/180)*Math.sin(dLng/2)**2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          if (dist > 2) {
            return jsonRes({ success: false, error: "Errand is too far (>2km). Move closer to accept." });
          }

          // Try Mapbox Directions API for an accurate ETA, fall back to heuristic
          let estimatedMinutes = Math.ceil((dist / 5) * 60) + 10;
          const mapboxToken = Deno.env.get("MAPBOX_ACCESS_TOKEN");
          if (mapboxToken) {
            try {
              const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${helper_lng},${helper_lat};${eLng},${eLat}?access_token=${mapboxToken}&overview=false`;
              const r = await fetch(url);
              if (r.ok) {
                const d = await r.json();
                const dur = d.routes?.[0]?.duration;
                if (typeof dur === "number") {
                  estimatedMinutes = Math.ceil(dur / 60) + 10; // +10 min buffer
                }
              }
            } catch (e) {
              console.warn("[manage-errand] Mapbox Directions failed, using fallback ETA", e);
            }
          }

          const deadline = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString();
          await supabase.from("errand_requests").update({
            estimated_minutes: estimatedMinutes,
            delivery_deadline: deadline,
          }).eq("id", errand_id);
        }
      }

      const { data, error } = await supabase.rpc("accept_errand_escrow", {
        p_errand_id: errand_id, p_helper_id: user.id,
      });

      if (error) {
        console.error("[manage-errand] Accept error:", error);
        return jsonRes({ success: false, error: "Failed to accept errand" }, 500);
      }

      // Update helper location if provided
      if (helper_lat && helper_lng) {
        await supabase.from("errand_requests").update({
          helper_lat, helper_lng, location_updated_at: new Date().toISOString(),
        }).eq("id", errand_id);
      }

      // Update merchant order delivery_status
      if (errandForDist?.errand_type === "merchant" && errandForDist?.merchant_order_id) {
        await supabase.from("merchant_orders").update({ delivery_status: "runner_assigned" })
          .eq("id", errandForDist.merchant_order_id);
      }

      return jsonRes(data);
    }

    // ── UPDATE STATUS ──
    if (action === "update_status") {
      const { errand_id, status } = body;
      const { data: errand } = await supabase.from("errand_requests").select("*").eq("id", errand_id).single();
      if (!errand) return jsonRes({ success: false, error: "Errand not found" });
      if (errand.helper_id !== user.id) return jsonRes({ success: false, error: "Only the helper can update status" });
      if (status === "in_progress" && errand.status !== "accepted") {
        return jsonRes({ success: false, error: "Errand must be accepted first" });
      }

      await supabase.from("errand_requests").update({ status }).eq("id", errand_id);
      await supabase.from("errand_assignments").update({ status }).eq("errand_id", errand_id).eq("helper_id", user.id);

      // Update merchant order delivery_status
      if (errand.errand_type === "merchant" && errand.merchant_order_id && status === "in_progress") {
        await supabase.from("merchant_orders").update({ delivery_status: "picked_up" })
          .eq("id", errand.merchant_order_id);
      }

      return jsonRes({ success: true });
    }

    // ── COMPLETE ──
    if (action === "complete") {
      const { errand_id } = body;

      // Check if merchant errand — use split payment function
      const { data: errandCheck } = await supabase.from("errand_requests")
        .select("errand_type").eq("id", errand_id).single();

      if (errandCheck?.errand_type === "merchant") {
        const { data, error } = await supabase.rpc("complete_merchant_errand", {
          p_errand_id: errand_id, p_requester_id: user.id,
        });
        if (error) {
          console.error("[manage-errand] Complete merchant error:", error);
          return jsonRes({ success: false, error: "Failed to complete errand" }, 500);
        }
        return jsonRes(data);
      }

      // Legacy errand completion
      const { data, error } = await supabase.rpc("complete_errand", {
        p_errand_id: errand_id, p_requester_id: user.id,
      });
      if (error) {
        console.error("[manage-errand] Complete error:", error);
        return jsonRes({ success: false, error: "Failed to complete errand" }, 500);
      }
      return jsonRes(data);
    }

    // ── DISPUTE ──
    if (action === "dispute") {
      const { errand_id } = body;
      const { data: errand } = await supabase.from("errand_requests").select("*").eq("id", errand_id).single();
      if (!errand) return jsonRes({ success: false, error: "Errand not found" });
      if (errand.requester_id !== user.id && errand.helper_id !== user.id) {
        return jsonRes({ success: false, error: "Not authorized" });
      }
      await supabase.from("errand_assignments").update({ dispute_flag: true, status: "disputed" }).eq("errand_id", errand_id);
      return jsonRes({ success: true });
    }

    return jsonRes({ success: false, error: "Unknown action" });
  } catch (err) {
    console.error("[manage-errand] Unhandled error:", err);
    return jsonRes({ success: false, error: "An unexpected error occurred. Please try again." }, 500);
  }
});
