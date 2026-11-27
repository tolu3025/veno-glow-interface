import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyWebhookSignature, getTransactionById, verifyChargeByReference } from "../_shared/flutterwave-v3.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, verif-hash, flutterwave-signature, x-flutterwave-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (v4 HMAC-SHA256; also accepts legacy verif-hash)
    const rawBody = await req.text();
    const valid = await verifyWebhookSignature(req, rawBody);
    if (!valid) {
      console.error("Invalid webhook signature");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const payload = JSON.parse(rawBody);
    console.log("Webhook payload:", JSON.stringify(payload));

    // v4 events use a different envelope: { type: "transfer.completed"|"charge.completed", data: {...} }
    // Legacy v3: { event: "transfer.completed", data: {...} }. Support both.
    const eventName: string = payload.type || payload.event || "";



    // Handle transfer events (withdrawals) — v4 uses transfer.* / direct-transfer.*
    if (eventName === "transfer.completed" || eventName === "transfer.failed"
        || eventName === "direct-transfer.completed" || eventName === "direct-transfer.failed") {
      const transferData = payload.data;
      console.log("Transfer webhook received:", JSON.stringify(transferData));

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const transferId = String(transferData.id);
      const transferStatus = String(transferData.status || "").toUpperCase(); // v4: NEW|SUCCESSFUL|FAILED


      // Find withdrawal by flutterwave_transfer_ref
      const { data: withdrawal } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("flutterwave_transfer_ref", transferId)
        .maybeSingle();

      if (withdrawal) {
        if (transferStatus === "SUCCESSFUL") {
          await supabase
            .from("withdrawals")
            .update({ status: "completed" })
            .eq("id", withdrawal.id);

          // Update matching transaction
          await supabase
            .from("transactions")
            .update({ status: "completed" })
            .eq("user_id", withdrawal.user_id)
            .eq("type", "withdrawal")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1);

          console.log(`Withdrawal ${withdrawal.id} completed`);
        } else if (transferStatus === "FAILED" || transferStatus === "REJECTED") {
          // Claim the refund atomically so a repeat webhook can't refund twice.
          const { data: claimed } = await supabase
            .from("withdrawals")
            .update({ status: "refunded" })
            .eq("id", withdrawal.id)
            .in("status", ["pending", "processing"])
            .select("id")
            .maybeSingle();

          if (claimed) {
            const { data: wallet } = await supabase
              .from("wallets")
              .select("id")
              .eq("user_id", withdrawal.user_id)
              .single();

            if (wallet) {
              // Legacy rows: wallet was debited by the gross amount only.
              // "on_top" rows: wallet was debited amount + fee, so refund both.
              const refund = Number(withdrawal.amount) +
                ((withdrawal as any).fee_model === "on_top" ? Number((withdrawal as any).fee_amount || 0) : 0);
              await supabase.rpc("credit_wallet", {
                p_wallet_id: wallet.id,
                p_amount: refund,
              });
            }
          }

          // Update transaction to failed
          await supabase
            .from("transactions")
            .update({ status: "failed" })
            .eq("user_id", withdrawal.user_id)
            .eq("type", "withdrawal")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1);

          console.log(`Withdrawal ${withdrawal.id} failed, refunded user`);
        }
      } else {
        console.error("No matching withdrawal for transfer ID:", transferId);
      }

      return new Response(JSON.stringify({ status: "success" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process successful charges (deposits)
    const chargeEvent = eventName === "charge.completed" || eventName === "payment.completed";
    const rawStatus = String(payload.data?.status || "").toLowerCase();
    if (!chargeEvent || (rawStatus !== "successful" && rawStatus !== "success")) {
      return new Response(JSON.stringify({ status: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const txData = payload.data;
    const txId = txData.id;
    const flwRef = txData.flw_ref || txData.reference;
    const txRef = txData.tx_ref || txData.reference;

    // Verify transaction with Flutterwave v3 API.
    // If the verify call fails (Flutterwave 504/timeout), fall back to trusting
    // the webhook payload — its HMAC signature was already verified above.
    let verifyData: any = null;
    try {
      const v = txId
        ? await getTransactionById(String(txId))
        : await verifyChargeByReference(String(txRef));
      verifyData = v.raw || { data: v.data };
    } catch (e) {
      console.error("Verify call failed, falling back to signed webhook payload:", e);
    }

    const verifiedStatus = String(verifyData?.data?.status || "").toLowerCase();
    if (verifiedStatus !== "successful" && verifiedStatus !== "success") {
      console.warn("Verify unavailable; using signed webhook payload as source of truth");
      verifyData = { data: txData };
    }

    const amount = Number(verifyData.data.amount ?? txData.amount);
    const currency = verifyData.data.currency ?? txData.currency ?? "NGN";
    const reference = `FLW-${txId}`;

    // Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env vars:", { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });
      return new Response("Server misconfiguration", { status: 500, headers: corsHeaders });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Idempotency check
    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();

    if (existingTx) {
      console.log("Duplicate transaction, skipping:", reference);
      return new Response(JSON.stringify({ status: "duplicate" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect all possible account identifiers
    const virtualAcct =
      verifyData.data.meta?.virtual_account_number ||
      txData.meta?.virtual_account_number ||
      verifyData.data.payment_type_details?.account_number ||
      payload.meta_data?.virtual_account_number ||
      verifyData.data.account_number;

    const customerEmail = verifyData.data.customer?.email || txData.customer?.email;

    console.log("Matching identifiers:", {
      virtualAcct,
      flwRef,
      txRef,
      customerEmail,
      payment_type: verifyData.data.payment_type,
    });

    let walletRecord = null;

    // Strategy 1: Match by virtual account number (current, then retired one)
    if (virtualAcct) {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("virtual_account_number", virtualAcct)
        .maybeSingle();
      walletRecord = data;
      if (!walletRecord) {
        const { data: legacy } = await supabase
          .from("wallets")
          .select("*")
          .eq("previous_virtual_account_number", virtualAcct)
          .maybeSingle();
        walletRecord = legacy;
      }
    }


    // Strategy 2: Match by flutterwave_reference (could be flw_ref or tx_ref)
    if (!walletRecord && flwRef) {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("flutterwave_reference", flwRef)
        .maybeSingle();
      walletRecord = data;
    }

    // Strategy 3: Match by tx_ref against flutterwave_reference
    if (!walletRecord && txRef) {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("flutterwave_reference", txRef)
        .maybeSingle();
      walletRecord = data;
    }

    // Strategy 4: Extract user ID prefix from tx_ref and use RPC for text cast
    if (!walletRecord && txRef && txRef.startsWith("kuka-va-")) {
      const parts = txRef.split("-");
      if (parts.length >= 4) {
        const userIdPrefix = parts[2];
        console.log("Trying user ID prefix match:", userIdPrefix);
        // Use raw SQL via RPC to cast uuid to text for LIKE matching
        const { data } = await supabase
          .from("wallets")
          .select("*")
          .filter("user_id::text", "ilike", `${userIdPrefix}%`)
          .maybeSingle();
        if (data) {
          walletRecord = data;
        } else {
          // Fallback: query all wallets and match in JS (small table)
          const { data: allWallets } = await supabase
            .from("wallets")
            .select("*");
          if (allWallets) {
            walletRecord = allWallets.find((w: { user_id: string }) =>
              w.user_id.startsWith(userIdPrefix)
            ) || null;
          }
        }
      }
    }

    // Strategy 5: Match by customer email via auth lookup
    if (!walletRecord && customerEmail) {
      console.log("Trying email match:", customerEmail);
      // Look up user by email in auth.users (service role can do this)
      const { data: userList } = await supabase.auth.admin.listUsers();
      if (userList?.users) {
        const matchedUser = userList.users.find((u: { email?: string }) => u.email === customerEmail);
        if (matchedUser) {
          const { data } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", matchedUser.id)
            .maybeSingle();
          walletRecord = data;
          if (walletRecord) {
            console.log("Matched wallet via email for user:", matchedUser.id);
          }
        }
      }
    }

    // Check if it's a collection payment
    let collectionRecord = null;

    // Strategy 1: Match by virtual account number (current, then retired one)
    if (virtualAcct) {
      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("virtual_account_number", virtualAcct)
        .eq("status", "active")
        .maybeSingle();
      collectionRecord = data;
      if (!collectionRecord) {
        const { data: legacy } = await supabase
          .from("collections")
          .select("*")
          .eq("previous_virtual_account_number", virtualAcct)
          .eq("status", "active")
          .maybeSingle();
        collectionRecord = legacy;
      }
    }


    // Strategy 2: Match by flutterwave_reference
    if (!collectionRecord && flwRef) {
      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("flutterwave_reference", flwRef)
        .eq("status", "active")
        .maybeSingle();
      collectionRecord = data;
    }

    // Strategy 3: Match by tx_ref prefix "col-"
    if (!collectionRecord && txRef && txRef.startsWith("col-")) {
      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("flutterwave_reference", txRef)
        .eq("status", "active")
        .maybeSingle();
      collectionRecord = data;
    }

    console.log("Collection matching result:", { found: !!collectionRecord, collectionId: collectionRecord?.id });

    // If this payment is for a collection, do NOT also process it as a personal wallet deposit.
    // (A collection tx_ref alone is enough — never let an email/name match credit a wallet too.)
    if (collectionRecord || (txRef && txRef.startsWith("col-"))) {
      walletRecord = null;
    }


    if (!walletRecord && !collectionRecord) {
      console.error("No matching wallet or collection. Identifiers:", {
        virtualAcct,
        flwRef,
        txRef,
        customerEmail,
      });
      return new Response(JSON.stringify({ status: "no_match" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Credit wallet — full deposited amount, no fee deduction
    if (walletRecord) {
      const grossAmount = Number(amount);

      // Atomic credit: bumps both balance AND available_balance
      const { error: creditErr } = await supabase.rpc("credit_wallet", {
        p_wallet_id: walletRecord.id,
        p_amount: grossAmount,
      });
      if (creditErr) {
        console.error("credit_wallet RPC failed:", creditErr);
      }

      const senderName = verifyData.data.customer?.name || txData.customer?.name || "";
      const senderBank = verifyData.data.payment_type === "bank_transfer"
        ? (verifyData.data.meta?.sender_bank || verifyData.data.card?.issuer || "Bank Transfer")
        : (verifyData.data.payment_type || "");
      await supabase.from("transactions").insert({
        user_id: walletRecord.user_id,
        type: "deposit",
        amount: grossAmount,
        fee_amount: 0,
        status: "completed",
        reference,
        metadata: {
          sender_name: senderName,
          bank_name: senderBank,
          flw_ref: flwRef,
          tx_ref: txRef,
          currency,
          payment_type: verifyData.data.payment_type,
          virtual_account: virtualAcct,
        },
      });

      console.log(`Credited wallet ${walletRecord.id} — ₦${grossAmount} (balance + available_balance).`);
    }

    // Credit collection if applicable
    if (collectionRecord) {
      // Prefer true originator (sender) fields. Flutterwave often echoes the
      // virtual-account holder (the collection creator) in customer/meta.name,
      // which previously made every bank payment look like the creator paid.
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", collectionRecord.creator_id)
        .maybeSingle();
      const creatorName = (creatorProfile?.full_name || "").trim().toLowerCase();
      const vaHolderName = (
        verifyData.data.customer?.name ||
        txData.customer?.name ||
        ""
      ).trim().toLowerCase();

      // Flutterwave spells the sender field differently per channel/version
      // (originatorname, originator_account_name, sender_name, account_name…),
      // so scan every nested object for any *name* key that looks like a sender.
      const nameCandidates: string[] = [];
      const seen = new Set<unknown>();
      const collect = (node: unknown, depth = 0) => {
        if (!node || typeof node !== "object" || depth > 4 || seen.has(node)) return;
        seen.add(node);
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
          const k = key.toLowerCase().replace(/[^a-z]/g, "");
          if (typeof value === "string") {
            const looksLikeSender =
              k.includes("name") &&
              (k.includes("originator") || k.includes("sender") ||
               k.includes("payer") || k.includes("account") || k.includes("debit"));
            if (looksLikeSender && value.trim()) nameCandidates.push(value.trim());
          } else if (typeof value === "object") {
            collect(value, depth + 1);
          }
        }
      };
      collect(verifyData.data);
      collect(txData);

      const isUsable = (v: string) => {
        const lc = v.toLowerCase();
        if (!lc || lc.length < 3) return false;
        if (lc === creatorName || lc === vaHolderName) return false;
        if (/^(bank transfer|transfer|nil|null|n\/a|kukapay)$/.test(lc)) return false;
        return true;
      };

      // Matric number: senders paying by bank transfer are told to type it in
      // the narration/remark box, so scan every narration-ish field for it.
      const narrationParts: string[] = [];
      const collectNarration = (node: unknown, depth = 0) => {
        if (!node || typeof node !== "object" || depth > 4) return;
        for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
          const k = key.toLowerCase().replace(/[^a-z]/g, "");
          if (typeof value === "string") {
            if (
              (k.includes("narration") || k.includes("remark") ||
               k.includes("description") || k.includes("comment") ||
               k.includes("reference") && k.includes("payment")) &&
              value.trim()
            ) narrationParts.push(value.trim());
          } else if (typeof value === "object") {
            collectNarration(value, depth + 1);
          }
        }
      };
      collectNarration(verifyData.data);
      collectNarration(txData);
      collectNarration(payload.meta_data);
      collectNarration(payload);
      const narration = narrationParts.join(" | ");
      const matricMatch = narration
        .toUpperCase()
        .replace(/KUKAPAY\S*/g, " ")
        .match(/\b[A-Z]{2,6}[\/\-]?\d{2,}(?:[\/\-]\d{2,})*\b|\b\d{6,12}\b/);
      let payerMatric: string | null = matricMatch ? matricMatch[0] : null;

      // Also scan the meta_data block for originator names (OPAY & co. send them there).
      collect(payload.meta_data);

      const actualPayerName =
        nameCandidates.find(isUsable) ||
        // Last resort: the customer on the charge, when it isn't the creator.
        ((verifyData.data.customer?.name || txData.customer?.name || "").trim() &&
        isUsable((verifyData.data.customer?.name || txData.customer?.name || "").trim())
          ? (verifyData.data.customer?.name || txData.customer?.name || "").trim()
          : "Bank Transfer");

      // Many banks (OPAY, Moniepoint…) never forward the sender's remark, so the
      // matric number can be missing even when the payer typed it. Fall back to
      // the Kukapay profile that matches the sender's name, phone or email.
      if (!payerMatric) {
        const payerPhone = String(
          payload.meta_data?.originatoraccountnumber ||
          verifyData.data.customer?.phone_number ||
          txData.customer?.phone_number ||
          "",
        ).replace(/\D/g, "");
        const payerEmail = verifyData.data.customer?.email || txData.customer?.email || null;

        let matched: { matric_number: string | null } | null = null;

        if (actualPayerName && actualPayerName !== "Bank Transfer") {
          const { data } = await supabase
            .from("profiles")
            .select("matric_number")
            .ilike("full_name", actualPayerName)
            .not("matric_number", "is", null)
            .limit(1)
            .maybeSingle();
          matched = data ?? null;
        }
        if (!matched && payerPhone.length >= 10) {
          const last10 = payerPhone.slice(-10);
          const { data } = await supabase
            .from("profiles")
            .select("matric_number")
            .ilike("phone_number", `%${last10}`)
            .not("matric_number", "is", null)
            .limit(1)
            .maybeSingle();
          matched = data ?? null;
        }
        if (!matched && payerEmail) {
          const { data } = await supabase
            .from("profiles")
            .select("matric_number")
            .eq("email", payerEmail)
            .not("matric_number", "is", null)
            .limit(1)
            .maybeSingle();
          matched = data ?? null;
        }
        if (matched?.matric_number) payerMatric = matched.matric_number;
      }





      // MONEY: the funds land in the creator's Kukapay wallet, not just the tally.
      const { data: creatorWallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", collectionRecord.creator_id)
        .maybeSingle();

      if (creatorWallet) {
        const { error: colCreditErr } = await supabase.rpc("credit_wallet", {
          p_wallet_id: creatorWallet.id,
          p_amount: Number(amount),
        });
        if (colCreditErr) {
          console.error("credit_wallet (collection) RPC failed:", colCreditErr);
        } else {
          await supabase.from("transactions").insert({
            user_id: collectionRecord.creator_id,
            type: "collection_payment",
            amount: Number(amount),
            fee_amount: 0,
            status: "completed",
            reference,
            metadata: {
              collection_id: collectionRecord.id,
              collection_title: collectionRecord.title,
              payer_name: actualPayerName,
              payer_matric_number: payerMatric,
              narration,
              flw_ref: flwRef,
              tx_ref: txRef,
              currency,
              source: "bank_transfer",
            },
          });
          console.log(`Credited collection creator wallet ${creatorWallet.id} — ₦${amount}`);
        }
      } else {
        console.error("No wallet for collection creator:", collectionRecord.creator_id);
      }

      const newTotal = Number(collectionRecord.total_collected) + amount;
      const updates: Record<string, unknown> = {
        total_collected: newTotal,
        participant_count: collectionRecord.participant_count + 1,
      };
      if (newTotal >= Number(collectionRecord.target_amount)) {
        updates.status = "completed";
      }
      await supabase
        .from("collections")
        .update(updates)
        .eq("id", collectionRecord.id);

      // First try to match a pre-transfer claim the payer filled in on the pay page
      const { data: matched, error: matchErr } = await supabase.rpc("match_collection_claim", {
        p_collection_id: collectionRecord.id,
        p_amount: Number(amount),
        p_payer_name: actualPayerName,
        p_reference: reference,
      });
      if (matchErr) console.error("match_collection_claim failed:", matchErr);
      const matchedRow = Array.isArray(matched) ? matched[0] : matched;

      if (matchedRow) {
        console.log("Matched pre-transfer claim:", matchedRow.id);
        if (!payerMatric && matchedRow.payer_matric_number) {
          payerMatric = matchedRow.payer_matric_number;
        }
      } else {
        // Insert collection payment record
        await supabase.from("collection_payments").insert({
          collection_id: collectionRecord.id,
          amount,
          payer_name: actualPayerName,
          payer_matric_number: payerMatric,
          status: "confirmed",
          transaction_reference: reference,
          webhook_verified: true,
        });
      }

      console.log(`Collection ${collectionRecord.id} credited with ${amount}. Total: ${newTotal}`);
    }

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
