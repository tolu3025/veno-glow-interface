// Service Requests: escrow-backed orders for thesis / project / research / freelance work.
// Lifecycle: pending → quoted → (negotiating) → approved → in_progress → delivered → completed
// Refund paths: rejected | cancelled (refund any escrow back to student).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

const DEFAULT_MILESTONES = [
  { key: "m1", label: "Upfront", pct: 50 },
  { key: "m2", label: "Draft", pct: 25 },
  { key: "m3", label: "Final", pct: 25 },
];

function normalizeMilestones(input: any[] | undefined, quoteAmount: number) {
  const src = Array.isArray(input) && input.length ? input : DEFAULT_MILESTONES;
  const totalPct = src.reduce((s, m) => s + Number(m.pct || 0), 0) || 100;
  return src.map((m, idx) => {
    const pct = Number(m.pct || 0);
    const amount = Math.round(((pct / totalPct) * quoteAmount) * 100) / 100;
    return {
      key: m.key || `m${idx + 1}`,
      label: m.label || `Milestone ${idx + 1}`,
      pct,
      amount,
      status: "pending", // pending | funded | submitted | released
      files: [] as Array<{ name: string; path: string }>,
      released_at: null as string | null,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Invalid session" }, 401);

    const { action, ...params } = await req.json();

    // Helper — load request and verify caller is participant.
    async function loadRequest(id: string) {
      const { data: r, error } = await supabaseAdmin
        .from("service_requests").select("*").eq("id", id).maybeSingle();
      if (error || !r) return { error: "Request not found" };
      const isStudent = r.student_id === user.id;
      let isMerchant = false;
      if (!isStudent) {
        const { data: m } = await supabaseAdmin
          .from("merchants").select("user_id").eq("id", r.merchant_id).maybeSingle();
        isMerchant = m?.user_id === user.id;
      }
      if (!isStudent && !isMerchant) return { error: "Forbidden" };
      return { request: r, isStudent, isMerchant };
    }

    switch (action) {
      // ── STUDENT: create a new request ────────────────────────────────
      case "create_request": {
        const { merchant_id, category, title, description, deadline, proposed_budget, attachments } = params;
        if (!merchant_id || !category || !title || !description) {
          return json({ error: "merchant_id, category, title, description required" }, 400);
        }
        const { data: m } = await supabaseAdmin
          .from("merchants").select("id, business_name, user_id").eq("id", merchant_id).maybeSingle();
        if (!m) return json({ error: "Merchant not found" }, 404);

        const { data, error } = await supabaseAdmin
          .from("service_requests")
          .insert({
            student_id: user.id,
            merchant_id,
            category,
            title: String(title).slice(0, 200),
            description: String(description).slice(0, 5000),
            deadline: deadline || null,
            proposed_budget: proposed_budget ?? null,
            attachments: Array.isArray(attachments) ? attachments : [],
            status: "pending",
          })
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);

        await supabaseAdmin.rpc("create_notification", {
          p_user_id: m.user_id,
          p_title: "New service request",
          p_message: `${title} — review and send a quote`,
          p_type: "service_request",
          p_metadata: { request_id: data.id },
        });
        return json({ success: true, request: data });
      }

      // ── MERCHANT: respond with a quote ───────────────────────────────
      case "send_quote": {
        const { request_id, quote_amount, quote_timeline_days, deliverables, merchant_note, milestones } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        if (!ctx.isMerchant) return json({ error: "Only merchant can send a quote" }, 403);
        if (!["pending", "negotiating"].includes(ctx.request.status)) {
          return json({ error: "Cannot quote on this request" }, 400);
        }
        const amount = Number(quote_amount);
        if (!(amount > 0)) return json({ error: "Invalid quote amount" }, 400);

        const ms = normalizeMilestones(milestones, amount);
        const { data, error } = await supabaseAdmin
          .from("service_requests")
          .update({
            quote_amount: amount,
            quote_timeline_days: Number(quote_timeline_days) || null,
            deliverables: Array.isArray(deliverables) ? deliverables : [],
            merchant_note: merchant_note || null,
            milestones: ms,
            status: "quoted",
          })
          .eq("id", request_id)
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);

        await supabaseAdmin.rpc("create_notification", {
          p_user_id: ctx.request.student_id,
          p_title: "You received a quote",
          p_message: `₦${amount.toLocaleString()} for ${ctx.request.title}`,
          p_type: "service_request",
          p_metadata: { request_id, amount },
        });
        return json({ success: true, request: data });
      }

      // ── EITHER: counter-offer ────────────────────────────────────────
      case "negotiate": {
        const { request_id, amount, timeline_days, note } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        if (!["quoted", "negotiating", "pending"].includes(ctx.request.status)) {
          return json({ error: "Cannot negotiate now" }, 400);
        }
        const history = Array.isArray(ctx.request.negotiation_history) ? ctx.request.negotiation_history : [];
        history.push({
          by: ctx.isStudent ? "student" : "merchant",
          at: new Date().toISOString(),
          amount: amount ?? null,
          timeline_days: timeline_days ?? null,
          note: note || "",
        });
        const { data, error } = await supabaseAdmin
          .from("service_requests")
          .update({ status: "negotiating", negotiation_history: history })
          .eq("id", request_id)
          .select().single();
        if (error) return json({ error: error.message }, 400);

        // Notify the other party
        const recipientId = ctx.isStudent
          ? (await supabaseAdmin.from("merchants").select("user_id").eq("id", ctx.request.merchant_id).maybeSingle()).data?.user_id
          : ctx.request.student_id;
        if (recipientId) {
          await supabaseAdmin.rpc("create_notification", {
            p_user_id: recipientId,
            p_title: "Counter-offer received",
            p_message: `${ctx.request.title} — review the latest terms`,
            p_type: "service_request",
            p_metadata: { request_id },
          });
        }
        return json({ success: true, request: data });
      }

      // ── STUDENT: approve and fund first milestone ────────────────────
      case "approve_and_pay": {
        const { request_id } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        if (!ctx.isStudent) return json({ error: "Only the student can approve" }, 403);
        if (!["quoted", "negotiating"].includes(ctx.request.status)) {
          return json({ error: "Cannot approve in current state" }, 400);
        }
        const amount = Number(ctx.request.quote_amount);
        if (!(amount > 0)) return json({ error: "No quote to approve" }, 400);
        const milestones = Array.isArray(ctx.request.milestones) ? ctx.request.milestones : [];
        if (!milestones.length) return json({ error: "Missing milestone schedule" }, 400);

        // Lock wallet — debit full quote amount into escrow_held.
        const { data: wallet } = await supabaseAdmin
          .from("wallets").select("*").eq("user_id", user.id).maybeSingle();
        if (!wallet) return json({ error: "Wallet not found" }, 400);
        if (Number(wallet.available_balance ?? wallet.balance) < amount) {
          return json({ error: "Insufficient wallet balance" }, 400);
        }
        const newBalance = Number(wallet.balance) - amount;
        const newAvailable = Number(wallet.available_balance ?? wallet.balance) - amount;
        const { error: wErr } = await supabaseAdmin
          .from("wallets")
          .update({ balance: newBalance, available_balance: newAvailable, updated_at: new Date().toISOString() })
          .eq("id", wallet.id);
        if (wErr) return json({ error: wErr.message }, 400);

        // Mark first milestone funded immediately so merchant knows to start.
        const updated = milestones.map((m: any, idx: number) =>
          idx === 0 ? { ...m, status: "funded" } : m
        );

        const reference = `SR-${request_id.slice(0, 8)}-${Date.now()}`;
        await supabaseAdmin.from("transactions").insert({
          user_id: user.id,
          type: "service_request_escrow",
          amount,
          status: "completed",
          reference,
          metadata: { request_id, milestone_funded: updated[0]?.key, direction: "debit" },
        });

        const { data, error } = await supabaseAdmin
          .from("service_requests")
          .update({
            status: "in_progress",
            milestones: updated,
            escrow_held: amount,
            escrow_released: 0,
            approved_at: new Date().toISOString(),
          })
          .eq("id", request_id)
          .select().single();
        if (error) return json({ error: error.message }, 400);

        const { data: m } = await supabaseAdmin
          .from("merchants").select("user_id, business_name").eq("id", ctx.request.merchant_id).maybeSingle();
        if (m?.user_id) {
          await supabaseAdmin.rpc("create_notification", {
            p_user_id: m.user_id,
            p_title: "Order approved",
            p_message: `${ctx.request.title} — ₦${amount.toLocaleString()} in escrow. You can begin.`,
            p_type: "service_request",
            p_metadata: { request_id },
          });
        }
        return json({ success: true, request: data });
      }

      // ── MERCHANT: submit a milestone deliverable ─────────────────────
      case "submit_milestone": {
        const { request_id, milestone_key, files, note } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        if (!ctx.isMerchant) return json({ error: "Only the merchant can submit" }, 403);
        if (ctx.request.status !== "in_progress") return json({ error: "Order not in progress" }, 400);

        const milestones = (ctx.request.milestones || []).map((m: any) =>
          m.key === milestone_key
            ? { ...m, status: "submitted", files: [...(m.files || []), ...((files || []) as any[])] }
            : m
        );
        const allSubmitted = milestones.every((m: any) => ["submitted", "released"].includes(m.status));

        const { data, error } = await supabaseAdmin
          .from("service_requests")
          .update({
            milestones,
            status: allSubmitted ? "delivered" : "in_progress",
          })
          .eq("id", request_id)
          .select().single();
        if (error) return json({ error: error.message }, 400);

        if (note || (files && files.length)) {
          await supabaseAdmin.from("service_request_messages").insert({
            request_id,
            sender_id: user.id,
            sender_role: "merchant",
            milestone_key,
            body: note || null,
            attachments: files || [],
          });
        }

        await supabaseAdmin.rpc("create_notification", {
          p_user_id: ctx.request.student_id,
          p_title: "Deliverable ready for review",
          p_message: ctx.request.title,
          p_type: "service_request",
          p_metadata: { request_id, milestone_key },
        });
        return json({ success: true, request: data });
      }

      // ── STUDENT: approve milestone → release escrow + fund next ─────
      case "approve_milestone": {
        const { request_id, milestone_key } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        if (!ctx.isStudent) return json({ error: "Only the student can approve" }, 403);

        const milestones = ctx.request.milestones || [];
        const idx = milestones.findIndex((m: any) => m.key === milestone_key);
        if (idx === -1) return json({ error: "Milestone not found" }, 400);
        const ms = milestones[idx];
        if (!["submitted", "funded"].includes(ms.status)) {
          return json({ error: "Milestone not ready for release" }, 400);
        }
        const amount = Number(ms.amount || 0);
        if (!(amount > 0)) return json({ error: "Milestone amount missing" }, 400);

        // Pay merchant wallet
        const { data: merchant } = await supabaseAdmin
          .from("merchants").select("user_id, business_name").eq("id", ctx.request.merchant_id).maybeSingle();
        if (!merchant?.user_id) return json({ error: "Merchant wallet missing" }, 400);

        const { data: mw } = await supabaseAdmin
          .from("merchant_wallets").select("*").eq("user_id", merchant.user_id).maybeSingle();
        if (mw) {
          await supabaseAdmin
            .from("merchant_wallets")
            .update({
              balance: Number(mw.balance) + amount,
              available_balance: Number(mw.available_balance) + amount,
              total_earned: Number(mw.total_earned ?? 0) + amount,
              updated_at: new Date().toISOString(),
            })
            .eq("id", mw.id);
        }

        const updated = milestones.map((m: any, i: number) => {
          if (i === idx) return { ...m, status: "released", released_at: new Date().toISOString() };
          // Auto-fund the next pending milestone so merchant can keep going.
          if (i === idx + 1 && m.status === "pending") return { ...m, status: "funded" };
          return m;
        });
        const newReleased = Number(ctx.request.escrow_released || 0) + amount;
        const allReleased = updated.every((m: any) => m.status === "released");
        const newStatus = allReleased ? "completed" : "in_progress";

        const { data, error } = await supabaseAdmin
          .from("service_requests")
          .update({
            milestones: updated,
            escrow_released: newReleased,
            status: newStatus,
            completed_at: allReleased ? new Date().toISOString() : null,
          })
          .eq("id", request_id)
          .select().single();
        if (error) return json({ error: error.message }, 400);

        const reference = `SR-REL-${request_id.slice(0, 8)}-${Date.now()}`;
        await supabaseAdmin.from("transactions").insert({
          user_id: merchant.user_id,
          type: "service_request_payout",
          amount,
          status: "completed",
          reference,
          metadata: { request_id, milestone_key, direction: "credit" },
        });

        await supabaseAdmin.rpc("create_notification", {
          p_user_id: merchant.user_id,
          p_title: allReleased ? "Order completed" : "Milestone released",
          p_message: `₦${amount.toLocaleString()} credited for ${ctx.request.title}`,
          p_type: "service_request",
          p_metadata: { request_id },
        });
        return json({ success: true, request: data });
      }

      // ── STUDENT: request revision on submitted milestone ─────────────
      case "request_revision": {
        const { request_id, milestone_key, note } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        if (!ctx.isStudent) return json({ error: "Only the student can request revisions" }, 403);

        const milestones = (ctx.request.milestones || []).map((m: any) =>
          m.key === milestone_key ? { ...m, status: "funded" } : m
        );
        await supabaseAdmin.from("service_requests")
          .update({ milestones, status: "in_progress" })
          .eq("id", request_id);

        await supabaseAdmin.from("service_request_messages").insert({
          request_id,
          sender_id: user.id,
          sender_role: "student",
          milestone_key,
          body: note || "Please revise this milestone.",
          attachments: [],
        });

        const { data: m } = await supabaseAdmin
          .from("merchants").select("user_id").eq("id", ctx.request.merchant_id).maybeSingle();
        if (m?.user_id) {
          await supabaseAdmin.rpc("create_notification", {
            p_user_id: m.user_id,
            p_title: "Revision requested",
            p_message: ctx.request.title,
            p_type: "service_request",
            p_metadata: { request_id, milestone_key },
          });
        }
        return json({ success: true });
      }

      // ── EITHER: send chat message ────────────────────────────────────
      case "send_message": {
        const { request_id, body, attachments } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        const { data, error } = await supabaseAdmin
          .from("service_request_messages")
          .insert({
            request_id,
            sender_id: user.id,
            sender_role: ctx.isStudent ? "student" : "merchant",
            body: body || null,
            attachments: attachments || [],
          })
          .select().single();
        if (error) return json({ error: error.message }, 400);
        return json({ success: true, message: data });
      }

      // ── STUDENT/MERCHANT: cancel ─ refund any escrow back to student ─
      case "cancel":
      case "reject": {
        const { request_id, reason } = params;
        const ctx = await loadRequest(request_id);
        if ("error" in ctx) return json({ error: ctx.error }, 400);
        const r = ctx.request;
        if (["completed", "cancelled", "rejected"].includes(r.status)) {
          return json({ error: "Already finalized" }, 400);
        }
        const refund = Number(r.escrow_held || 0) - Number(r.escrow_released || 0);
        if (refund > 0) {
          const { data: w } = await supabaseAdmin
            .from("wallets").select("*").eq("user_id", r.student_id).maybeSingle();
          if (w) {
            await supabaseAdmin.from("wallets").update({
              balance: Number(w.balance) + refund,
              available_balance: Number(w.available_balance ?? w.balance) + refund,
              updated_at: new Date().toISOString(),
            }).eq("id", w.id);

            await supabaseAdmin.from("transactions").insert({
              user_id: r.student_id,
              type: "service_request_refund",
              amount: refund,
              status: "completed",
              reference: `SR-RFD-${request_id.slice(0, 8)}-${Date.now()}`,
              metadata: { request_id, reason: reason || action, direction: "credit" },
            });
          }
        }
        const newStatus = action === "cancel" ? "cancelled" : "rejected";
        const { data, error } = await supabaseAdmin
          .from("service_requests")
          .update({ status: newStatus })
          .eq("id", request_id).select().single();
        if (error) return json({ error: error.message }, 400);

        const { data: m } = await supabaseAdmin
          .from("merchants").select("user_id").eq("id", r.merchant_id).maybeSingle();
        const otherId = ctx.isStudent ? m?.user_id : r.student_id;
        if (otherId) {
          await supabaseAdmin.rpc("create_notification", {
            p_user_id: otherId,
            p_title: action === "cancel" ? "Order cancelled" : "Order rejected",
            p_message: r.title + (reason ? ` — ${reason}` : ""),
            p_type: "service_request",
            p_metadata: { request_id, refund },
          });
        }
        return json({ success: true, request: data, refunded: refund });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("manage-service-request error", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});
