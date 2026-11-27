import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      return json({ error: "Unauthorized" }, 401);
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Invalid session" }, 401);

    const { action, ...params } = await req.json();

    switch (action) {
      case "update_location": {
        const { latitude, longitude } = params;
        if (typeof latitude !== "number" || typeof longitude !== "number") {
          return json({ error: "Valid latitude and longitude required" });
        }
        const { error } = await supabaseAdmin
          .from("merchants")
          .update({ latitude, longitude, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (error) return json({ error: error.message });
        return json({ success: true });
      }

      case "register": {
        const { business_name, description, category, settlement_account_number, settlement_bank_name, settlement_account_name, latitude, longitude } = params;

        if (!business_name || !category) return json({ error: "Business name and category required" });

        // Check KYC level 3
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("kyc_level")
          .eq("id", user.id)
          .single();

        if (!profile || profile.kyc_level < 3) {
          return json({ error: "KYC Level 3 required to register as merchant" });
        }

        // Check if already a merchant
        const { data: existing } = await supabaseAdmin
          .from("merchants")
          .select("id, status")
          .eq("user_id", user.id)
          .single();

        if (existing) {
          return json({ error: `You already have a merchant account (${existing.status})` });
        }

        // Generate QR code
        const qr_code = "MER-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();

        const { data: merchant, error } = await supabaseAdmin
          .from("merchants")
          .insert({
            user_id: user.id,
            business_name,
            description: description || null,
            category,
            qr_code,
            settlement_account_number: settlement_account_number || null,
            settlement_bank_name: settlement_bank_name || null,
            settlement_account_name: settlement_account_name || null,
            latitude: typeof latitude === "number" ? latitude : null,
            longitude: typeof longitude === "number" ? longitude : null,
          })
          .select()
          .single();

        if (error) return json({ error: error.message });
        return json({ success: true, merchant });
      }

      case "get_my_merchant": {
        const { data: merchant } = await supabaseAdmin
          .from("merchants")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!merchant) return json({ error: "No merchant account found" });

        // Get transaction stats
        const { data: txns } = await supabaseAdmin
          .from("merchant_transactions")
          .select("*")
          .eq("merchant_id", merchant.id)
          .order("created_at", { ascending: false })
          .limit(50);

        // Get today/week/month stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const allTxns = txns || [];
        const todayTxns = allTxns.filter(t => t.created_at >= todayStart);
        const weekTxns = allTxns.filter(t => t.created_at >= weekStart);
        const monthTxns = allTxns.filter(t => t.created_at >= monthStart);

        // Get product count
        const { count: productCount } = await supabaseAdmin
          .from("merchant_products")
          .select("id", { count: "exact", head: true })
          .eq("merchant_id", merchant.id);

        return json({
          success: true,
          merchant,
          transactions: allTxns,
          stats: {
            todayRevenue: todayTxns.reduce((s: number, t: any) => s + Number(t.net_amount), 0),
            todayCount: todayTxns.length,
            weekRevenue: weekTxns.reduce((s: number, t: any) => s + Number(t.net_amount), 0),
            weekCount: weekTxns.length,
            monthRevenue: monthTxns.reduce((s: number, t: any) => s + Number(t.net_amount), 0),
            monthCount: monthTxns.length,
            totalCommission: allTxns.reduce((s: number, t: any) => s + Number(t.commission_amount), 0),
            productCount: productCount || 0,
          },
        });
      }

      case "get_directory": {
        const { search, category, page = 0, limit = 20 } = params;

        // Campus scoping: only show merchants on the caller's campus.
        const { data: campusId } = await supabaseAdmin.rpc("get_user_campus_id", {
          _user_id: user.id,
        });
        if (!campusId) {
          return json({ success: true, merchants: [], total: 0, no_campus: true });
        }

        // Map UI category slugs → the actual `merchants.category` values stored
        // in the DB. Merchants were onboarded with short slugs (food, stationery,
        // general, etc.), while the discovery UI uses richer slugs
        // (food_drinks, printing_stationery, ...). Normalise both sides.
        const CATEGORY_ALIASES: Record<string, string[]> = {
          food_drinks: ["food_drinks", "food", "drinks", "food_beverage"],
          printing_stationery: ["printing_stationery", "printing", "stationery", "print_shop"],
          fashion_accessories: ["fashion_accessories", "fashion", "clothing", "accessories"],
          laundry: ["laundry", "laundry_service"],
          barbing_beauty: ["barbing_beauty", "beauty", "barbing", "salon"],
          electronics_repairs: ["electronics_repairs", "electronics", "repairs", "gadgets"],
          health_pharmacy: ["health_pharmacy", "health", "pharmacy"],
          transport: ["transport", "logistics"],
          other: ["other", "general", "misc"],
        };

        let allowedMerchantIds: string[] | null = null;
        let categoryValues: string[] | null = null;
        if (category && category !== "all") {
          categoryValues = CATEGORY_ALIASES[category] ?? [category];

          // Also include merchants whose *products* fall in this category, so a
          // "general" store selling printing shows up under Printing.
          const productAliases: Record<string, string[]> = {
            printing_stationery: ["printing", "stationery", "project_thesis"],
            food_drinks: ["food", "drinks"],
            laundry: ["laundry"],
          };
          const productCats = productAliases[category];
          if (productCats?.length) {
            const { data: mp } = await supabaseAdmin
              .from("merchant_products")
              .select("merchant_id")
              .in("category", productCats);
            allowedMerchantIds = Array.from(new Set((mp ?? []).map((r: any) => r.merchant_id)));
          }
        }

        let query = supabaseAdmin
          .from("merchants")
          .select("id, business_name, description, category, logo_url, qr_code, total_transactions", { count: "exact" })
          .eq("status", "active")
          .eq("campus_id", campusId);

        if (search) query = query.ilike("business_name", `%${search}%`);
        if (categoryValues) {
          if (allowedMerchantIds && allowedMerchantIds.length > 0) {
            const idList = allowedMerchantIds.map((id) => `"${id}"`).join(",");
            const catList = categoryValues.map((c) => `"${c}"`).join(",");
            query = query.or(`category.in.(${catList}),id.in.(${idList})`);
          } else {
            query = query.in("category", categoryValues);
          }
        }
        query = query.order("total_transactions", { ascending: false }).range(page * limit, (page + 1) * limit - 1);

        const { data, count, error } = await query;
        if (error) return json({ error: error.message });
        return json({ success: true, merchants: data, total: count });
      }


      case "get_merchant": {
        const { merchant_id } = params;
        const { data: campusId } = await supabaseAdmin.rpc("get_user_campus_id", {
          _user_id: user.id,
        });
        const { data: merchant, error } = await supabaseAdmin
          .from("merchants")
          .select("id, business_name, description, category, logo_url, qr_code, status, campus_id, user_id, offers_delivery, is_print_shop, delivery_fee")
          .eq("id", merchant_id)
          .eq("status", "active")
          .single();

        if (error || !merchant) return json({ error: "Merchant not found" });
        // Only allow same-campus access (owner can always see their own).
        if (merchant.user_id !== user.id && merchant.campus_id !== campusId) {
          return json({ error: "This store is on a different campus." });
        }
        return json({ success: true, merchant });
      }

      case "pay": {
        const { merchant_id, amount, pin } = params;

        if (!merchant_id || !amount || amount <= 0) return json({ error: "Invalid payment details" });
        if (!pin || pin.length < 4) return json({ error: "PIN required" });

        // Verify PIN
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("transaction_pin_hash")
          .eq("id", user.id)
          .single();

        if (!profile?.transaction_pin_hash) return json({ error: "Set a transaction PIN first" });

        const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
        const valid = bcrypt.compareSync(pin, profile.transaction_pin_hash);
        if (!valid) {
          await supabaseAdmin.rpc("record_failed_pin", { p_user_id: user.id });
          return json({ error: "Invalid PIN" });
        }
        await supabaseAdmin.rpc("reset_pin_attempts", { p_user_id: user.id });

        // Execute payment via db function
        const { data, error } = await supabaseAdmin.rpc("pay_merchant_from_wallet", {
          p_customer_id: user.id,
          p_merchant_id: merchant_id,
          p_amount: amount,
        });

        if (error) return json({ error: error.message });
        return json(data);
      }

      case "find_by_qr": {
        const { qr_code } = params;
        const { data: campusId } = await supabaseAdmin.rpc("get_user_campus_id", {
          _user_id: user.id,
        });
        const { data: merchant } = await supabaseAdmin
          .from("merchants")
          .select("id, business_name, description, category, logo_url, qr_code, status, campus_id, user_id, offers_delivery, is_print_shop, delivery_fee")
          .eq("qr_code", qr_code)
          .eq("status", "active")
          .single();

        if (!merchant) return json({ error: "Merchant not found" });
        if (merchant.user_id !== user.id && merchant.campus_id !== campusId) {
          return json({ error: "This store is on a different campus." });
        }
        return json({ success: true, merchant });
      }

      case "purchase_products": {
        const {
          merchant_id, items, total_amount, pin,
          delivery_method, delivery_fee, delivery_address, delivery_location,
          print_file_url, print_specs,
        } = params;
        if (!merchant_id || !items || !total_amount || !pin) return json({ error: "Missing fields" });
        const method = ["pickup", "merchant_delivery", "runner"].includes(delivery_method) ? delivery_method : "pickup";
        const feeAmount = Math.max(0, Number(delivery_fee) || 0);

        // Verify PIN — accept transaction PIN or (fallback) login PIN so users
        // aren't blocked when only one of the two is set.
        const { data: prof } = await supabaseAdmin
          .from("profiles")
          .select("transaction_pin_hash, login_pin_hash")
          .eq("id", user.id)
          .single();
        if (!prof?.transaction_pin_hash && !prof?.login_pin_hash) {
          return json({ error: "Set a transaction PIN first" });
        }
        const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
        const okTx = prof.transaction_pin_hash ? bcrypt.compareSync(pin, prof.transaction_pin_hash) : false;
        const okLogin = !okTx && prof.login_pin_hash ? bcrypt.compareSync(pin, prof.login_pin_hash) : false;
        if (!okTx && !okLogin) {
          await supabaseAdmin.rpc("record_failed_pin", { p_user_id: user.id });
          return json({ error: "Invalid PIN" });
        }
        await supabaseAdmin.rpc("reset_pin_attempts", { p_user_id: user.id });

        // Pay merchant (items + merchant delivery fee both go to merchant; pickup fee = 0)
        const { data: payResult, error: payErr } = await supabaseAdmin.rpc("pay_merchant_from_wallet", {
          p_customer_id: user.id, p_merchant_id: merchant_id, p_amount: total_amount,
        });
        if (payErr) return json({ error: payErr.message });
        if (!payResult?.success) return json(payResult);

        // Get customer name
        const { data: custProfile } = await supabaseAdmin.from("profiles").select("full_name").eq("id", user.id).single();

        // Create order
        const { data: insertedOrder } = await supabaseAdmin.from("merchant_orders").insert({
          merchant_id, customer_id: user.id, total_amount,
          items, customer_name: custProfile?.full_name || "Customer",
          transaction_reference: payResult.reference,
          delivery_method: method,
          delivery_fee: feeAmount,
          delivery_address: delivery_address || null,
          delivery_location: delivery_location || null,
          print_file_url: print_file_url || null,
          print_specs: print_specs || null,
          order_type: "food",
        }).select("id").single();

        // Decrement product quantities
        for (const item of items as any[]) {
          await supabaseAdmin.from("merchant_products")
            .update({ quantity: Math.max(0, (await supabaseAdmin.from("merchant_products").select("quantity").eq("id", item.product_id).single()).data?.quantity - item.quantity) })
            .eq("id", item.product_id);
        }

        return json({ success: true, reference: payResult.reference, order_id: insertedOrder?.id });
      }

      case "get_orders": {
        const { merchant_id } = params;
        const { data: orders } = await supabaseAdmin
          .from("merchant_orders")
          .select("*")
          .eq("merchant_id", merchant_id)
          .order("created_at", { ascending: false })
          .limit(100);
        return json({ success: true, orders: orders || [] });
      }

      case "update_order_status": {
        const { order_id, status } = params;
        const { error } = await supabaseAdmin
          .from("merchant_orders")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", order_id);
        if (error) return json({ error: error.message });
        return json({ success: true });
      }

      default:
        return json({ error: "Unknown action" });
    }
  } catch (err) {
    console.error("Merchant error:", err);
    return json({ error: "An unexpected error occurred" }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
