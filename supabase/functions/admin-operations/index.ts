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

    // Get the user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "verify_admin_pin": {
        const { pin } = params;
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("transaction_pin_hash")
          .eq("id", user.id)
          .single();
        
        if (!profile?.transaction_pin_hash) {
          return jsonResponse({ success: false, error: "Admin has no PIN set. Set one in Profile first." });
        }

        const valid = bcrypt.compareSync(pin, profile.transaction_pin_hash);
        if (!valid) {
          return jsonResponse({ success: false, error: "Invalid PIN" });
        }
        return jsonResponse({ success: true });
      }

      case "get_dashboard_stats": {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [
          profilesRes,
          walletsRes,
          collectionsRes,
          txTodayRes,
          txWeekRes,
          txMonthRes,
          errandsRes,
          withdrawalsRes,
        ] = await Promise.all([
          supabaseAdmin.from("profiles").select("id, kyc_status, is_suspended", { count: "exact" }),
          supabaseAdmin.from("wallets").select("balance"),
          supabaseAdmin.from("collections").select("id, status, total_collected", { count: "exact" }),
          supabaseAdmin.from("transactions").select("id", { count: "exact" }).gte("created_at", todayStart),
          supabaseAdmin.from("transactions").select("id", { count: "exact" }).gte("created_at", weekStart),
          supabaseAdmin.from("transactions").select("id", { count: "exact" }).gte("created_at", monthStart),
          supabaseAdmin.from("errand_requests").select("id, status", { count: "exact" }),
          supabaseAdmin.from("withdrawals").select("id, status, amount", { count: "exact" }),
        ]);

        const profiles = profilesRes.data || [];
        const totalUsers = profiles.length;
        const pendingKyc = profiles.filter(p => p.kyc_status === "pending" || p.kyc_status === "submitted").length;
        const suspended = profiles.filter(p => p.is_suspended).length;
        const activeUsers = totalUsers - suspended;

        const totalWalletBalance = (walletsRes.data || []).reduce((s, w) => s + Number(w.balance), 0);

        const collections = collectionsRes.data || [];
        const activeCollections = collections.filter(c => c.status === "active").length;
        const completedCollections = collections.filter(c => c.status === "completed").length;
        const totalCollectionValue = collections.reduce((s, c) => s + Number(c.total_collected), 0);

        const errands = errandsRes.data || [];
        const openErrands = errands.filter(e => e.status === "open").length;
        const inProgressErrands = errands.filter(e => e.status === "in_progress").length;
        const disputedErrands = errands.filter(e => e.status === "cancelled").length;

        const withdrawals = withdrawalsRes.data || [];
        const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
        const processingWithdrawals = withdrawals.filter(w => w.status === "processing").length;
        const pendingWithdrawalAmount = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);

        return jsonResponse({
          success: true,
          stats: {
            totalUsers, activeUsers, pendingKyc, suspended,
            totalWalletBalance,
            totalCollections: collections.length, activeCollections, completedCollections, totalCollectionValue,
            txToday: txTodayRes.count || 0,
            txWeek: txWeekRes.count || 0,
            txMonth: txMonthRes.count || 0,
            openErrands, inProgressErrands, disputedErrands,
            pendingWithdrawals, processingWithdrawals, pendingWithdrawalAmount,
          },
        });
      }

      case "get_revenue_stats": {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayOfMonth = now.getDate();

        // Float interest calculation
        const { data: wallets } = await supabaseAdmin.from("wallets").select("balance");
        const totalFloat = (wallets || []).reduce((s: number, w: any) => s + Number(w.balance), 0);
        const annualRate = 0.10; // 10% annual
        const dailyRate = annualRate / 365;
        const dailyInterest = totalFloat * dailyRate;
        const projectedMonthlyFloat = dailyInterest * daysInMonth;
        const mtdFloatRevenue = dailyInterest * dayOfMonth;

        // Airtime & data commissions this month
        const { data: commissions } = await supabaseAdmin
          .from("commission_logs")
          .select("commission_type, commission_amount")
          .gte("created_at", monthStart);

        const airtimeCommission = (commissions || [])
          .filter((c: any) => c.commission_type === "airtime")
          .reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
        const dataCommission = (commissions || [])
          .filter((c: any) => c.commission_type === "data")
          .reduce((s: number, c: any) => s + Number(c.commission_amount), 0);

        // Merchant settlement fees (1.5% of collection payments this month)
        const { data: collPayments } = await supabaseAdmin
          .from("collection_payments")
          .select("amount")
          .eq("status", "confirmed")
          .gte("created_at", monthStart);
        const merchantVolume = (collPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
        const merchantFeeRevenue = merchantVolume * 0.015;

        // Withdrawal urgency fees this month
        const { data: urgentWithdrawals } = await supabaseAdmin
          .from("withdrawals")
          .select("fee_amount")
          .eq("is_instant", true)
          .gte("created_at", monthStart);
        const withdrawalFeeRevenue = (urgentWithdrawals || []).reduce((s: number, w: any) => s + Number(w.fee_amount), 0);

        // Organizer subscriptions MRR
        const { data: subs } = await supabaseAdmin
          .from("organizer_subscriptions")
          .select("price_monthly, tier")
          .eq("is_active", true);
        const mrr = (subs || []).reduce((s: number, sub: any) => s + Number(sub.price_monthly), 0);
        const proCount = (subs || []).filter((s: any) => s.tier === "pro").length;
        const freeCount = (subs || []).filter((s: any) => s.tier === "free").length;

        // Revenue snapshots for chart (last 30 days)
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
        const { data: snapshots } = await supabaseAdmin
          .from("revenue_snapshots")
          .select("*")
          .gte("snapshot_date", thirtyDaysAgo)
          .order("snapshot_date", { ascending: true });

        const totalMonthlyRevenue = mtdFloatRevenue + airtimeCommission + dataCommission + merchantFeeRevenue + withdrawalFeeRevenue + mrr;

        return jsonResponse({
          success: true,
          revenue: {
            // Float
            totalFloat,
            dailyInterest: Math.round(dailyInterest * 100) / 100,
            projectedMonthlyFloat: Math.round(projectedMonthlyFloat * 100) / 100,
            mtdFloatRevenue: Math.round(mtdFloatRevenue * 100) / 100,
            // Airtime/Data
            airtimeCommission: Math.round(airtimeCommission * 100) / 100,
            dataCommission: Math.round(dataCommission * 100) / 100,
            totalAirtimeDataCommission: Math.round((airtimeCommission + dataCommission) * 100) / 100,
            // Merchant
            merchantVolume: Math.round(merchantVolume * 100) / 100,
            merchantFeeRevenue: Math.round(merchantFeeRevenue * 100) / 100,
            // Withdrawal fees
            withdrawalFeeRevenue: Math.round(withdrawalFeeRevenue * 100) / 100,
            // Subscriptions
            mrr: Math.round(mrr * 100) / 100,
            proCount,
            freeCount,
            // Total
            totalMonthlyRevenue: Math.round(totalMonthlyRevenue * 100) / 100,
            // Snapshots
            snapshots: snapshots || [],
          },
        });
      }

      case "get_users": {
        const { kycFilter, universityFilter, page = 0, limit = 50 } = params;
        let query = supabaseAdmin.from("profiles").select("*", { count: "exact" });
        if (kycFilter && kycFilter !== "all") query = query.eq("kyc_status", kycFilter);
        if (universityFilter) query = query.ilike("university", `%${universityFilter}%`);
        query = query.order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
        const { data, count, error } = await query;
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true, users: data, total: count });
      }

      case "get_user_detail": {
        const { userId } = params;
        const [profileRes, walletRes, txRes, kycRes, rolesRes] = await Promise.all([
          supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
          supabaseAdmin.from("wallets").select("*").eq("user_id", userId).single(),
          supabaseAdmin.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
          supabaseAdmin.from("kyc_documents").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
        ]);

        // Generate signed URLs for KYC document images (private bucket)
        const kycDocs = kycRes.data || [];
        const imageFields = ["nin_image_url", "id_card_image_url", "selfie_image_url", "address_proof_url"];
        for (const doc of kycDocs) {
          for (const field of imageFields) {
            if (doc[field] && !doc[field].startsWith("http")) {
              const { data: signedData } = await supabaseAdmin.storage
                .from("kyc-documents")
                .createSignedUrl(doc[field], 3600); // 1 hour
              if (signedData?.signedUrl) {
                doc[field] = signedData.signedUrl;
              }
            }
          }
        }

        return jsonResponse({
          success: true,
          profile: profileRes.data,
          wallet: walletRes.data,
          transactions: txRes.data,
          kycDocuments: kycDocs,
          roles: (rolesRes.data || []).map((r: any) => r.role),
        });
      }

      case "approve_kyc": {
        const { userId, docId, level: paramLevel } = params;

        // Get the user's current kyc_level to determine what we're approving
        const { data: currentProfile } = await supabaseAdmin
          .from("profiles")
          .select("kyc_level, full_name, phone_number")
          .eq("id", userId)
          .single();

        // Derive the level being approved. Priority:
        //  1. explicit `level` from admin dashboard
        //  2. the kyc_level of the specific pending doc (docId)
        //  3. the kyc_level of the most recent pending/submitted doc
        //  4. fallback: currentProfile.kyc_level + 1
        let targetLevel: number | null = typeof paramLevel === "number" ? paramLevel : null;
        if (!targetLevel) {
          let docQuery = supabaseAdmin
            .from("kyc_documents")
            .select("kyc_level, id, verification_status, created_at")
            .eq("user_id", userId);
          if (docId) docQuery = docQuery.eq("id", docId);
          else docQuery = docQuery.in("verification_status", ["pending", "submitted"]);
          const { data: pendingDocs } = await docQuery
            .order("created_at", { ascending: false })
            .limit(1);
          if (pendingDocs?.[0]?.kyc_level) targetLevel = pendingDocs[0].kyc_level;
        }
        if (!targetLevel) targetLevel = (currentProfile?.kyc_level || 0) + 1;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ kyc_status: "verified", kyc_level: targetLevel })
          .eq("id", userId);
        if (error) return jsonResponse({ success: false, error: error.message });

        // Approve the specific doc if provided, else only docs at the level we approved.
        let approveQuery = supabaseAdmin
          .from("kyc_documents")
          .update({ verification_status: "approved", reviewed_by: user.id })
          .eq("user_id", userId);
        if (docId) approveQuery = approveQuery.eq("id", docId);
        else approveQuery = approveQuery.eq("kyc_level", targetLevel).in("verification_status", ["pending", "submitted"]);
        await approveQuery;

        // Auto-create Flutterwave virtual account on Level 1+ approval
        let vaResult: { created: boolean; error?: string; account_number?: string } = { created: false };
        if (targetLevel >= 1) {
          try {
            const { data: wallet } = await supabaseAdmin
              .from("wallets")
              .select("virtual_account_number")
              .eq("user_id", userId)
              .maybeSingle();

            if (wallet && !wallet.virtual_account_number) {
              const { data: kycDoc } = await supabaseAdmin
                .from("kyc_documents")
                .select("nin_number")
                .eq("user_id", userId)
                .not("nin_number", "is", null)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              const nin = kycDoc?.nin_number;

              if (!nin) {
                vaResult = { created: false, error: "NIN not found on file" };
              } else {
                // Validate the NIN against the identity database first — an
                // approval mistake must not produce a live account number.
                const { checkNin } = await import("../_shared/nin-check.ts");
                const ninCheck = await checkNin(nin, currentProfile?.full_name || "");
                await supabaseAdmin.from("kyc_documents").update({
                  nin_verified: ninCheck.status === "match" ? true : ninCheck.status === "unavailable" ? null : false,
                  nin_verified_name: ninCheck.name,
                  nin_check_notes: ninCheck.message,
                }).eq("user_id", userId).eq("kyc_level", 1);

                if (ninCheck.status === "mismatch" || ninCheck.status === "not_found") {
                  await supabaseAdmin.from("kyc_documents").update({
                    verification_status: "rejected",
                    admin_notes: ninCheck.message,
                  }).eq("user_id", userId).eq("kyc_level", 1);
                  await supabaseAdmin.from("profiles").update({
                    kyc_status: "rejected",
                    kyc_level: 0,
                  }).eq("id", userId);
                  await supabaseAdmin.from("notifications").insert({
                    user_id: userId,
                    title: "NIN verification failed",
                    body: `${ninCheck.message} No account number was created. Please resubmit your KYC with the correct NIN.`,
                    type: "kyc",
                  });
                  return jsonResponse({
                    success: false,
                    error: `NIN check failed: ${ninCheck.message}${ninCheck.name ? ` (NIN name: ${ninCheck.name})` : ""}. Approval reverted.`,
                    nin_check: ninCheck,
                  });
                }

                const { provisionVirtualAccount } = await import("../_shared/flutterwave-v3.ts");
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
                const email = authUser?.user?.email || "";
                const nameParts = (currentProfile?.full_name || "").split(" ");
                const txRef = `kuka-va-${userId.slice(0, 8)}-${Date.now()}`;

                const r = await provisionVirtualAccount({
                  email,
                  first_name: nameParts[0] || "User",
                  last_name: nameParts.slice(1).join(" ") || "KukaPay",
                  phone: currentProfile?.phone_number || undefined,
                  nin,
                  reference: txRef,
                  narration: "Kukapay",
                });

                if (r.ok) {
                  await supabaseAdmin.from("wallets").update({
                    virtual_account_number: r.account_number,
                    virtual_bank_name: r.bank_name,
                    virtual_account_name: r.account_name,
                    flutterwave_reference: txRef,
                  }).eq("user_id", userId);
                  vaResult = { created: true, account_number: r.account_number };

                  await supabaseAdmin.from("notifications").insert({
                    user_id: userId,
                    title: "Your virtual account is ready",
                    body: `KYC approved. Your account number ${r.account_number} (${r.bank_name}) is now active.`,
                    type: "kyc",
                  });
                } else {
                  console.error("Flutterwave v3 VA error:", r.raw);
                  vaResult = { created: false, error: r.error };
                }
              }
            }
          } catch (e: any) {
            console.error("Auto-VA error:", e);
            vaResult = { created: false, error: e?.message || "VA creation failed" };
          }
        }

        // Branded approval email (best-effort; never blocks approval).
        try {
          const { data: au } = await supabaseAdmin.auth.admin.getUserById(userId);
          const to = au?.user?.email;
          if (to) {
            const { data: w } = await supabaseAdmin.from("wallets")
              .select("virtual_account_number, virtual_bank_name").eq("user_id", userId).maybeSingle();
            const { kycApprovedEmail } = await import("../_shared/kyc-approved-email.ts");
            const { sendEmail } = await import("../_shared/email.ts");
            const { subject, html } = kycApprovedEmail({
              fullName: currentProfile?.full_name, level: targetLevel,
              accountNumber: w?.virtual_account_number, bankName: w?.virtual_bank_name,
            });
            await sendEmail(to, subject, html);
          }
        } catch (e) { console.error("KYC approved email failed:", e); }

        return jsonResponse({ success: true, virtual_account: vaResult });
      }



      case "reject_kyc": {
        const { userId, reason, docId, level } = params;

        // Mark the specific doc (or all pending/submitted docs for this user/level) as rejected.
        let rejectQuery = supabaseAdmin
          .from("kyc_documents")
          .update({ verification_status: "rejected", reviewed_by: user.id, admin_notes: reason || null })
          .eq("user_id", userId);
        if (docId) {
          rejectQuery = rejectQuery.eq("id", docId);
        } else {
          rejectQuery = rejectQuery.in("verification_status", ["pending", "submitted"]);
          if (level) rejectQuery = rejectQuery.eq("kyc_level", level);
        }
        const { error: rejErr } = await rejectQuery;
        if (rejErr) return jsonResponse({ success: false, error: rejErr.message });

        // Recompute kyc_level from the highest still-approved doc (rejection must not preserve
        // elevated privileges from the submission we just rejected).
        const { data: approvedDocs } = await supabaseAdmin
          .from("kyc_documents")
          .select("kyc_level")
          .eq("user_id", userId)
          .eq("verification_status", "approved")
          .order("kyc_level", { ascending: false })
          .limit(1);
        const newLevel = approvedDocs?.[0]?.kyc_level ?? 0;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ kyc_status: "rejected", kyc_level: newLevel })
          .eq("id", userId);
        if (error) return jsonResponse({ success: false, error: error.message });

        return jsonResponse({ success: true, kyc_level: newLevel });
      }

      case "suspend_user": {
        const { userId, reason } = params;
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_suspended: true, suspended_reason: reason || "Suspended by admin" })
          .eq("id", userId);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "activate_user": {
        const { userId } = params;
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_suspended: false, suspended_reason: null })
          .eq("id", userId);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "make_organizer": {
        const { userId } = params;
        // Check if already has organizer role
        const { data: existing } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", "organizer")
          .single();
        if (existing) return jsonResponse({ success: false, error: "User is already an organizer" });
        const { error } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "organizer" });
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "remove_organizer": {
        const { userId } = params;
        const { error } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "organizer");
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "get_collections": {
        const { page = 0, limit = 50 } = params;
        const { data, count, error } = await supabaseAdmin
          .from("collections")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(page * limit, (page + 1) * limit - 1);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true, collections: data, total: count });
      }

      case "get_errands": {
        const { statusFilter, page = 0, limit = 50 } = params;
        let query = supabaseAdmin.from("errand_requests").select("*", { count: "exact" });
        if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);
        query = query.order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
        const { data, count, error } = await query;
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true, errands: data, total: count });
      }

      case "resolve_errand_refund": {
        const { errandId } = params;
        const { data: assignment } = await supabaseAdmin
          .from("errand_assignments")
          .select("*")
          .eq("errand_id", errandId)
          .single();
        if (!assignment) return jsonResponse({ success: false, error: "Assignment not found" });

        // Idempotency — don't double-credit on repeat clicks
        if (assignment.admin_resolved) {
          return jsonResponse({ success: false, error: "This errand has already been resolved" });
        }

        const { data: errand } = await supabaseAdmin
          .from("errand_requests")
          .select("*")
          .eq("id", errandId)
          .single();
        if (!errand) return jsonResponse({ success: false, error: "Errand not found" });

        const amt = Number(assignment.amount_held) || 0;

        // Credit BOTH balance and available_balance — escrow debited both on hold
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("id, balance, available_balance")
          .eq("user_id", errand.requester_id)
          .single();
        if (wallet) {
          await supabaseAdmin
            .from("wallets")
            .update({
              balance: Number(wallet.balance) + amt,
              available_balance: Number(wallet.available_balance ?? wallet.balance) + amt,
            })
            .eq("id", wallet.id);
        }

        // Audit trail
        await supabaseAdmin.from("transactions").insert({
          user_id: errand.requester_id,
          type: "REFUND",
          amount: amt,
          status: "completed",
          reference: `errand-refund-${errand.id}`,
          metadata: { errand_id: errand.id, errand_title: errand.title, source: "admin_refund" },
        });

        await supabaseAdmin.rpc("create_notification", {
          p_user_id: errand.requester_id,
          p_title: "Errand Refunded",
          p_message: `₦${amt.toLocaleString()} has been refunded to your wallet for errand: ${errand.title}`,
          p_type: "errand",
        });

        await supabaseAdmin
          .from("errand_assignments")
          .update({ status: "disputed", admin_resolved: true })
          .eq("id", assignment.id);

        await supabaseAdmin
          .from("errand_requests")
          .update({ status: "cancelled" })
          .eq("id", errandId);

        return jsonResponse({ success: true });
      }

      case "resolve_errand_release": {
        const { errandId } = params;
        const { data: assignment } = await supabaseAdmin
          .from("errand_assignments")
          .select("*")
          .eq("errand_id", errandId)
          .single();
        if (!assignment) return jsonResponse({ success: false, error: "Assignment not found" });

        if (assignment.admin_resolved) {
          return jsonResponse({ success: false, error: "This errand has already been resolved" });
        }

        const { data: errand } = await supabaseAdmin
          .from("errand_requests")
          .select("*")
          .eq("id", errandId)
          .single();
        if (!errand) return jsonResponse({ success: false, error: "Errand not found" });

        const amt = Number(assignment.amount_held) || 0;

        // Pay helper — credit both balance and available_balance
        const { data: helperWallet } = await supabaseAdmin
          .from("wallets")
          .select("id, balance, available_balance")
          .eq("user_id", assignment.helper_id)
          .single();
        if (helperWallet) {
          await supabaseAdmin
            .from("wallets")
            .update({
              balance: Number(helperWallet.balance) + amt,
              available_balance: Number(helperWallet.available_balance ?? helperWallet.balance) + amt,
            })
            .eq("id", helperWallet.id);
        }

        await supabaseAdmin.from("transactions").insert({
          user_id: assignment.helper_id,
          type: "errand_payment",
          amount: amt,
          status: "completed",
          reference: `errand-release-${errand.id}`,
          metadata: { errand_id: errand.id, errand_title: errand.title, source: "admin_release" },
        });

        await supabaseAdmin.rpc("create_notification", {
          p_user_id: assignment.helper_id,
          p_title: "Errand Payment Released",
          p_message: `₦${amt.toLocaleString()} released to your wallet for errand: ${errand.title}`,
          p_type: "errand",
        });

        await supabaseAdmin
          .from("errand_assignments")
          .update({ status: "completed", admin_resolved: true, completed_at: new Date().toISOString() })
          .eq("id", assignment.id);

        await supabaseAdmin
          .from("errand_requests")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", errandId);

        return jsonResponse({ success: true });
      }

      case "get_security_logs": {
        const { page = 0, limit = 100, actionFilter, searchQuery } = params;
        let query = supabaseAdmin
          .from("security_logs")
          .select("id, user_id, action, ip_address, success, created_at", { count: "exact" });
        if (actionFilter && actionFilter !== "all") {
          query = query.eq("action", actionFilter);
        }
        query = query.order("created_at", { ascending: false })
          .range(page * limit, (page + 1) * limit - 1);
        const { data, count, error } = await query;
        if (error) return jsonResponse({ success: false, error: error.message });

        // Enrich with user names
        const logs = data || [];
        const userIds = [...new Set(logs.filter((l: any) => l.user_id).map((l: any) => l.user_id))];
        let profileMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);
          if (profiles) {
            profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.full_name]));
          }
        }
        const enrichedLogs = logs.map((log: any) => ({
          ...log,
          user_name: log.user_id ? (profileMap[log.user_id] || "Unknown") : "System",
        }));

        // Filter by search query (user name) if provided
        let finalLogs = enrichedLogs;
        if (searchQuery) {
          const sq = searchQuery.toLowerCase();
          finalLogs = enrichedLogs.filter((l: any) => 
            l.user_name?.toLowerCase().includes(sq) || l.action?.toLowerCase().includes(sq)
          );
        }

        return jsonResponse({ success: true, logs: finalLogs, total: count });
      }

      case "delete_security_log": {
        const { logId } = params;
        if (!logId) return jsonResponse({ success: false, error: "Missing security log id" }, 400);
        const { error } = await supabaseAdmin.from("security_logs").delete().eq("id", logId);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "delete_all_security_logs": {
        const { error } = await supabaseAdmin.from("security_logs").delete().not("id", "is", null);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "get_fraud_flags": {
        const { page = 0, limit = 50 } = params;
        const { data, count, error } = await supabaseAdmin
          .from("fraud_flags")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(page * limit, (page + 1) * limit - 1);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true, flags: data, total: count });
      }

      case "resolve_fraud_flag": {
        const { flagId } = params;
        const { error } = await supabaseAdmin
          .from("fraud_flags")
          .update({ resolved: true, resolved_by: user.id })
          .eq("id", flagId);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "get_risky_sessions": {
        const { bandFilter = "all", page = 0, limit = 50 } = params;
        let query = supabaseAdmin
          .from("user_sessions")
          .select("id, user_id, device_fingerprint, ip_address, country, city, user_agent, risk_score, risk_band, status, step_up_verified_at, last_seen_at, created_at", { count: "exact" });
        if (bandFilter === "risky") query = query.in("risk_band", ["elevated", "high"]);
        else if (bandFilter !== "all") query = query.eq("risk_band", bandFilter);
        query = query.order("last_seen_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
        const { data, count, error } = await query;
        if (error) return jsonResponse({ success: false, error: error.message });

        const sessions = data || [];
        const ids = [...new Set(sessions.map((s: any) => s.user_id).filter(Boolean))];
        let names: Record<string, string> = {};
        if (ids.length) {
          const { data: profs } = await supabaseAdmin
            .from("profiles").select("id, full_name").in("id", ids);
          names = Object.fromEntries((profs || []).map((p: any) => [p.id, p.full_name]));
        }
        return jsonResponse({
          success: true,
          total: count,
          sessions: sessions.map((s: any) => ({ ...s, user_name: names[s.user_id] || null })),
        });
      }

      case "terminate_user_session": {
        const { sessionId } = params;
        const { error } = await supabaseAdmin
          .from("user_sessions")
          .update({ status: "terminated" })
          .eq("id", sessionId);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "get_ip_blocks": {
        const { data, error } = await supabaseAdmin
          .from("ip_blocklist")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(200);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true, blocks: data });
      }

      case "unblock_ip": {
        const { ip } = params;
        const { error } = await supabaseAdmin
          .from("ip_blocklist")
          .delete()
          .eq("ip_address", ip);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "block_ip": {
        const { ip, hours = 6, reason = "Blocked by admin" } = params;
        const until = new Date(Date.now() + Number(hours) * 3600_000).toISOString();
        const { error } = await supabaseAdmin
          .from("ip_blocklist")
          .upsert({ ip_address: ip, level: "extended_ban", reason, blocked_until: until, strikes: 3 },
            { onConflict: "ip_address" });
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }


      case "get_withdrawals": {
        const { statusFilter, page = 0, limit = 50 } = params;
        let query = supabaseAdmin.from("withdrawals").select("*", { count: "exact" });
        if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);
        query = query.order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
        const { data, count, error } = await query;
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true, withdrawals: data, total: count });
      }

      case "get_merchants": {
        const { statusFilter, page = 0, limit = 50 } = params;
        let query = supabaseAdmin.from("merchants").select("*", { count: "exact" });
        if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter);
        query = query.order("created_at", { ascending: false }).range(page * limit, (page + 1) * limit - 1);
        const { data, count, error } = await query;
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true, merchants: data, total: count });
      }

      case "approve_merchant": {
        const { merchantId } = params;
        const { error } = await supabaseAdmin
          .from("merchants")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", merchantId);
        if (error) return jsonResponse({ success: false, error: error.message });

        // Notify merchant owner
        const { data: merchant } = await supabaseAdmin.from("merchants").select("user_id, business_name").eq("id", merchantId).single();
        if (merchant) {
          await supabaseAdmin.rpc("create_notification", {
            p_user_id: merchant.user_id,
            p_title: "Merchant Approved! 🎉",
            p_message: `${merchant.business_name} is now live on Kuka Pay.`,
            p_type: "merchant",
          });
        }
        return jsonResponse({ success: true });
      }

      case "suspend_merchant": {
        const { merchantId } = params;
        const { error } = await supabaseAdmin
          .from("merchants")
          .update({ status: "suspended", updated_at: new Date().toISOString() })
          .eq("id", merchantId);
        if (error) return jsonResponse({ success: false, error: error.message });
        return jsonResponse({ success: true });
      }

      case "reset_kyc": {
        const { userId } = params;
        await supabaseAdmin.from("profiles").update({ kyc_level: 0, kyc_status: "pending", face_match_score: null }).eq("id", userId);
        await supabaseAdmin.from("kyc_documents").delete().eq("user_id", userId);
        return jsonResponse({ success: true, message: "KYC reset for user" });
      }

      // Re-issue virtual accounts so senders see the correct KukaPay name.
      // v3 cannot rename an existing account — a new one must be issued.
      // Runs in batches; safe to call repeatedly until `remaining` is 0.
      case "reissue_virtual_accounts": {
        const batch = Math.min(Number(params.limit) || 20, 50);
        const scope = params.scope === "collections" || params.scope === "wallets"
          ? params.scope
          : "all";
        const { provisionVirtualAccount } = await import("../_shared/flutterwave-v3.ts");

        const identityFor = async (userId: string) => {
          const { data: rows } = await supabaseAdmin
            .from("kyc_documents")
            .select("nin_number, bvn_number, verification_status, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
          const approved = (rows || []).filter((r: any) => r.verification_status === "approved");
          const pool = approved.length ? approved : (rows || []);
          return {
            bvn: pool.find((r: any) => r.bvn_number)?.bvn_number || undefined,
            nin: pool.find((r: any) => r.nin_number)?.nin_number || undefined,
          };
        };

        const results: any[] = [];
        let walletsRemaining = 0;
        let collectionsRemaining = 0;

        if (scope !== "collections") {
          const { data: wallets, count } = await supabaseAdmin
            .from("wallets")
            .select("id, user_id, virtual_account_number", { count: "exact" })
            .not("virtual_account_number", "is", null)
            .or("virtual_account_name.is.null,virtual_account_name.neq.Kukapay")
            .limit(batch);
          walletsRemaining = Math.max((count || 0) - (wallets?.length || 0), 0);

          for (const w of wallets || []) {
            try {
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("full_name, phone_number")
                .eq("id", w.user_id)
                .single();
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(w.user_id);
              const email = authUser?.user?.email;
              const { bvn, nin } = await identityFor(w.user_id);
              if (!email || (!bvn && !nin)) {
                results.push({ type: "wallet", user_id: w.user_id, skipped: "no identity on file" });
                continue;
              }
              const parts = (profile?.full_name || "").trim().split(/\s+/);
              const txRef = `kuka-va-${w.user_id.slice(0, 8)}-${Date.now()}`;
              const r = await provisionVirtualAccount({
                email,
                first_name: parts[0] || "User",
                last_name: parts.slice(1).join(" ") || "KukaPay",
                phone: profile?.phone_number || undefined,
                bvn: bvn || undefined,
                nin: !bvn ? nin || undefined : undefined,
                reference: txRef,
                narration: "Kukapay",
              });
              if (!r.ok) {
                results.push({ type: "wallet", user_id: w.user_id, error: r.error });
                continue;
              }
              await supabaseAdmin.from("wallets").update({
                previous_virtual_account_number: w.virtual_account_number,
                virtual_account_number: r.account_number,
                virtual_bank_name: r.bank_name,
                virtual_account_name: r.account_name,
                flutterwave_reference: txRef,
              }).eq("id", w.id);
              await supabaseAdmin.from("notifications").insert({
                user_id: w.user_id,
                title: "Your deposit account number changed",
                body: `Your new KukaPay deposit account is ${r.account_number} (${r.bank_name}), shown as "${r.account_name}". Please update any saved beneficiary.`,
                type: "wallet",
              });
              results.push({ type: "wallet", user_id: w.user_id, account_number: r.account_number });
            } catch (e: any) {
              console.error("[reissue] wallet failed", w.user_id, e?.message);
              results.push({ type: "wallet", user_id: w.user_id, error: e?.message || "failed" });
            }
          }
        }

        if (scope !== "wallets") {
          const { data: cols, count } = await supabaseAdmin
            .from("collections")
            .select("id, creator_id, title, virtual_account_number", { count: "exact" })
            .not("virtual_account_number", "is", null)
            .eq("status", "active")
            .is("virtual_account_name", null)
            .limit(batch);
          collectionsRemaining = Math.max((count || 0) - (cols?.length || 0), 0);

          for (const c of cols || []) {
            try {
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("full_name, phone_number")
                .eq("id", c.creator_id)
                .single();
              const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(c.creator_id);
              const email = authUser?.user?.email;
              const { bvn, nin } = await identityFor(c.creator_id);
              if (!email || (!bvn && !nin)) {
                results.push({ type: "collection", id: c.id, skipped: "no identity on file" });
                continue;
              }
              const parts = (profile?.full_name || "").trim().split(/\s+/);
              const txRef = `kuka-col-${c.id.slice(0, 8)}-${Date.now()}`;
              const r = await provisionVirtualAccount({
                email,
                first_name: parts[0] || "Kuka",
                last_name: parts.slice(1).join(" ") || "User",
                phone: profile?.phone_number || undefined,
                bvn: bvn || undefined,
                nin: !bvn ? nin || undefined : undefined,
                reference: txRef,
                narration: `Kukapay/${c.title}`,
              });
              if (!r.ok) {
                results.push({ type: "collection", id: c.id, error: r.error });
                continue;
              }
              await supabaseAdmin.from("collections").update({
                previous_virtual_account_number: c.virtual_account_number,
                virtual_account_number: r.account_number,
                virtual_bank_name: r.bank_name,
                virtual_account_name: r.account_name,
                flutterwave_reference: txRef,
              }).eq("id", c.id);
              await supabaseAdmin.from("notifications").insert({
                user_id: c.creator_id,
                title: "Collection account updated",
                body: `"${c.title}" now uses account ${r.account_number} (${r.bank_name}), shown as "${r.account_name}". Share the new details with payers.`,
                type: "collection",
              });
              results.push({ type: "collection", id: c.id, account_number: r.account_number });
            } catch (e: any) {
              console.error("[reissue] collection failed", c.id, e?.message);
              results.push({ type: "collection", id: c.id, error: e?.message || "failed" });
            }
          }
        }

        return jsonResponse({
          success: true,
          processed: results.length,
          remaining: walletsRemaining + collectionsRemaining,
          results,
        });
      }


      default:
        return jsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (err) {
    console.error("Admin operation error:", err);
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
