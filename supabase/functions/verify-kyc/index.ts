import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { provisionVirtualAccount } from "../_shared/flutterwave-v3.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Production Youverify endpoint. Token lives in YOUVERIFY_API_TOKEN secret.
const YV_BASE = "https://api.youverify.co";

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAuth(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { error: "Unauthorized" as const };

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return { error: "Invalid token" as const };

  return { user, supabaseAdmin };
}

async function yvFetch(path: string, body: any) {
  const token = Deno.env.get("YOUVERIFY_API_TOKEN");
  if (!token) throw new Error("YOUVERIFY_API_TOKEN not configured");
  const res = await fetch(`${YV_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", token },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* leave empty */ }
  return { ok: res.ok, status: res.status, json, raw: text };
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z\s]/g, "").trim().split(/\s+/).filter(Boolean);
}

function namesMatch(profileName: string, ninFirst: string, ninLast: string, ninMiddle = "") {
  const profileParts = normalize(profileName);
  const ninParts = normalize(`${ninFirst} ${ninMiddle} ${ninLast}`);
  if (profileParts.length === 0 || ninParts.length === 0) return false;
  const matches = profileParts.filter((p) => ninParts.some((n) => n === p || n.includes(p) || p.includes(n)));
  return matches.length >= Math.min(2, profileParts.length);
}

// Sign a storage path for a temporary public URL so Youverify can fetch it.
async function signedUrl(supabaseAdmin: any, bucket: string, path: string, ttlSeconds = 600) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) throw new Error(error?.message || "Could not sign storage URL");
  return data.signedUrl as string;
}

async function createFlutterwaveVA(user: any, profile: any, nin: string, supabaseAdmin: any) {
  const nameParts = (profile.full_name || "").split(" ");
  const txRef = `kuka-va-${user.id.slice(0, 8)}-${Date.now()}`;
  const r = await provisionVirtualAccount({
    email: user.email,
    first_name: nameParts[0] || "User",
    last_name: nameParts.slice(1).join(" ") || "KukaPay",
    phone: profile.phone_number || undefined,
    nin,
    reference: txRef,
    narration: "Kukapay",
  });
  if (!r.ok) {
    console.error("Flutterwave VA error:", r.raw);
    return { ok: false, error: r.error };
  }
  await supabaseAdmin.from("wallets").update({
    virtual_account_number: r.account_number,
    virtual_bank_name: r.bank_name,
    virtual_account_name: r.account_name,
    flutterwave_reference: txRef,
  }).eq("user_id", user.id);
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await getAuth(req);
    if ("error" in auth) return jsonRes({ error: auth.error }, 401);
    const { user, supabaseAdmin } = auth;

    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    // ==============================
    // ACTION: verify_nin (Level 1) — Flutterwave v3 NIN lookup
    // (temporarily replacing YouVerify)
    // ==============================
    if (action === "verify_nin" || body.level === 1) {
      const { nin_number, nin_image_path } = body;
      if (!nin_number || typeof nin_number !== "string" || nin_number.length !== 11) {
        return jsonRes({ error: "NIN must be 11 digits" }, 400);
      }
      // NIN slip is optional — many students only have the 11-digit number.
      const slipPath = typeof nin_image_path === "string" && nin_image_path ? nin_image_path : null;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", user.id)
        .single();
      if (!profile) return jsonRes({ error: "Profile not found" }, 404);

      // Manual admin verification: always store the submission as pending.
      const { error: docInsertError } = await supabaseAdmin.from("kyc_documents").upsert({
        user_id: user.id,
        nin_number,
        nin_image_url: slipPath,
        kyc_level: 1,
        verification_status: "pending",
        admin_notes: null,
      }, { onConflict: "user_id,kyc_level" });
      if (docInsertError) {
        console.error("Level 1 KYC insert error:", docInsertError);
        if (/DUPLICATE_NIN/i.test(docInsertError.message || "")) {
          return jsonRes({
            error: "This NIN is already linked to another KukaPay account. Each person can only have one account.",
          }, 400);
        }
        return jsonRes({ error: "Could not save your KYC submission. Please try again." }, 500);
      }

      const { error: profileUpdateError } = await supabaseAdmin.from("profiles").update({
        kyc_status: "submitted",
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (profileUpdateError) {
        console.error("Level 1 profile update error:", profileUpdateError);
        return jsonRes({ error: "Could not update your KYC status. Please try again." }, 500);
      }

      // Instant approval: use the NIN to issue the account number right away.
      const { data: wallet } = await supabaseAdmin.from("wallets")
        .select("virtual_account_number, virtual_bank_name").eq("user_id", user.id).maybeSingle();
      let acct = wallet?.virtual_account_number as string | null;
      let bank = wallet?.virtual_bank_name as string | null;

      if (!acct) {
        const parts = (profile.full_name || "").trim().split(/\s+/);
        const txRef = `kuka-va-${user.id.slice(0, 8)}-${Date.now()}`;
        let r: any;
        try {
          r = await provisionVirtualAccount({
            email: user.email!, first_name: parts[0] || "User",
            last_name: parts.slice(1).join(" ") || "KukaPay",
            phone: profile.phone_number || undefined, nin: nin_number,
            reference: txRef, narration: "Kukapay",
          });
        } catch (e) {
          console.error("VA provisioning threw:", e);
          r = { ok: false, error: "network", raw: null };
        }

        if (!r.ok) {
          // Flutterwave explicitly rejected the NIN/details → send back to KYC form.
          if (r.raw?.status === "error") {
            const reason = `We couldn't verify your NIN: ${r.error}. Please check your NIN and that your registered name matches it, then try again.`;
            await supabaseAdmin.from("kyc_documents").update({
              verification_status: "rejected", admin_notes: reason,
            }).eq("user_id", user.id).eq("kyc_level", 1);
            await supabaseAdmin.from("profiles").update({ kyc_status: "rejected", kyc_level: 0 }).eq("id", user.id);
            return jsonRes({ nin_failed: true, message: reason });
          }
          // Provider unreachable → leave it with admins rather than blame the student.
          return jsonRes({
            verified: false, pending_review: true,
            message: "We couldn't reach the bank right now. Your NIN is saved and our team will finish your approval shortly.",
          });
        }

        acct = r.account_number; bank = r.bank_name;
        await supabaseAdmin.from("wallets").update({
          virtual_account_number: r.account_number, virtual_bank_name: r.bank_name,
          virtual_account_name: r.account_name, flutterwave_reference: txRef,
        }).eq("user_id", user.id);
      }

      await supabaseAdmin.from("kyc_documents").update({ verification_status: "approved", admin_notes: null })
        .eq("user_id", user.id).eq("kyc_level", 1);
      const { data: cur } = await supabaseAdmin.from("profiles").select("kyc_level").eq("id", user.id).single();
      await supabaseAdmin.from("profiles").update({
        kyc_status: "verified", kyc_level: Math.max(1, cur?.kyc_level || 0),
      }).eq("id", user.id);
      await supabaseAdmin.from("notifications").insert({
        user_id: user.id, title: "Your account is ready",
        body: `KYC Level 1 approved. Your account number ${acct} (${bank}) is now active.`, type: "kyc",
      });
      try {
        const { kycApprovedEmail } = await import("../_shared/kyc-approved-email.ts");
        const { sendEmail } = await import("../_shared/email.ts");
        const { subject, html } = kycApprovedEmail({ fullName: profile.full_name, level: 1, accountNumber: acct, bankName: bank });
        if (user.email) await sendEmail(user.email, subject, html);
      } catch (e) { console.error("Approval email failed:", e); }

      return jsonRes({ verified: true, account_number: acct, bank_name: bank,
        message: "You're verified! Your account number is ready." });
    }

    // ==============================
    // ACTION: verify_face (Level 2) — Student ID + selfie face match
    // ==============================
    if (action === "verify_face" || body.level === 2) {
      const { id_card_path, selfie_path } = body;
      if (!id_card_path || !selfie_path) {
        return jsonRes({ error: "id_card_path and selfie_path are required" }, 400);
      }

      const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("kyc_level")
          .eq("id", user.id)
          .single();
      if (!profile || profile.kyc_level < 1) {
        return jsonRes({ error: "Complete NIN verification first" }, 400);
      }

      let idUrl: string, selfieUrl: string;
      try {
        idUrl = await signedUrl(supabaseAdmin, "kyc-documents", id_card_path);
        selfieUrl = await signedUrl(supabaseAdmin, "kyc-documents", selfie_path);
      } catch (e: any) {
        return jsonRes({ error: e?.message || "Could not access uploaded documents" }, 400);
      }

      // Youverify face comparison is advisory only. Level 2 must always go to
      // admin review; an automatic face mismatch must not reject the student.
      const yv = await yvFetch("/v2/api/identity/face-comparison", {
        firstImage: selfieUrl,
        secondImage: idUrl,
      });

      const status = "pending";
      let confidence: number | null = null;
      let message = "Student ID and selfie submitted for admin review.";

      if (yv.ok && yv.json?.success !== false) {
        const d = yv.json?.data ?? {};
        confidence = typeof d.confidence === "number" ? d.confidence
          : typeof d.matchPercentage === "number" ? d.matchPercentage
          : typeof d.similarity === "number" ? d.similarity * 100
          : null;
        message = "Student ID and selfie submitted for admin review.";
      } else {
        console.error("Youverify face-comparison error:", yv.json || yv.raw);
        message = "Student ID and selfie submitted for admin review.";
      }

      const { error: docInsertError } = await supabaseAdmin.from("kyc_documents").upsert({
        user_id: user.id,
        id_card_image_url: id_card_path,
        selfie_image_url: selfie_path,
        face_match_confidence: confidence,
        kyc_level: 2,
        verification_status: status,
        admin_notes: null,
      }, { onConflict: "user_id,kyc_level" });
      if (docInsertError) {
        console.error("Level 2 KYC insert error:", docInsertError);
        return jsonRes({ error: "Could not save your Level 2 KYC submission. Please try again." }, 500);
      }

      const { error: profileUpdateError } = await supabaseAdmin.from("profiles").update({
        kyc_status: "submitted",
        face_match_score: confidence,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (profileUpdateError) {
        console.error("Level 2 profile update error:", profileUpdateError);
        return jsonRes({ error: "Could not update your Level 2 KYC status. Please try again." }, 500);
      }

      return jsonRes({
        verified: false,
        pending_review: true,
        confidence,
        message,
      });
    }

    // ==============================
    // ACTION: verify_bvn_address (Level 3) — BVN + Address (admin reviews address)
    // ==============================
    if (action === "verify_bvn_address" || action === "verify_bvn" || body.level === 3) {
      const { bvn_number, address_proof_path, address_text } = body;
      if (!bvn_number || typeof bvn_number !== "string" || bvn_number.length !== 11) {
        return jsonRes({ error: "BVN must be 11 digits" }, 400);
      }
      if (!address_proof_path || !address_text) {
        return jsonRes({ error: "Address proof and address text are required" }, 400);
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, kyc_level")
        .eq("id", user.id)
        .single();
      if (!profile) return jsonRes({ error: "Profile not found" }, 404);
      if (profile.kyc_level < 2) {
        return jsonRes({ error: "Complete face verification first" }, 400);
      }

      const yv = await yvFetch("/v2/api/identity/ng/bvn", {
        id: bvn_number,
        isSubjectConsent: true,
      });

      let extractedName = "";
      let nameMatch = false;
      let bvnAutoOk = false;
      let bvnMessage = "";

      if (yv.ok && yv.json?.success !== false && yv.json?.data) {
        const d = yv.json.data;
        const first = d.firstName || d.first_name || "";
        const last = d.lastName || d.last_name || d.surname || "";
        const middle = d.middleName || d.middle_name || "";
        extractedName = [first, middle, last].filter(Boolean).join(" ").trim();
        nameMatch = namesMatch(profile.full_name, first, last, middle);
        bvnAutoOk = nameMatch;
        bvnMessage = nameMatch
          ? "BVN verified."
          : `Name mismatch: BVN shows "${extractedName}" but your profile says "${profile.full_name}".`;
      } else {
        console.error("Youverify BVN lookup error:", yv.json || yv.raw);
        bvnMessage = "Could not verify BVN automatically.";
      }

      // Address always needs admin review; BVN may auto-pass or be flagged.
      const { error: docInsertError } = await supabaseAdmin.from("kyc_documents").upsert({
        user_id: user.id,
        bvn_number,
        extracted_name: extractedName || null,
        name_match: nameMatch,
        address_proof_url: address_proof_path,
        address_text,
        kyc_level: 3,
        verification_status: "pending",
        admin_notes: null,
      }, { onConflict: "user_id,kyc_level" });
      if (docInsertError) {
        console.error("Level 3 KYC insert error:", docInsertError);
        return jsonRes({ error: "Could not save your Level 3 KYC submission. Please try again." }, 500);
      }

      const { error: profileUpdateError } = await supabaseAdmin.from("profiles").update({
        kyc_status: "submitted",
        updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (profileUpdateError) {
        console.error("Level 3 profile update error:", profileUpdateError);
        return jsonRes({ error: "Could not update your Level 3 KYC status. Please try again." }, 500);
      }

      return jsonRes({
        verified: false,
        pending_review: true,
        bvn_auto_ok: bvnAutoOk,
        message: `${bvnMessage} Address proof submitted for admin review — you'll be notified once approved.`,
      });
    }

    return jsonRes({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("[verify-kyc] Error:", error);
    return jsonRes({ error: "Verification failed. Please try again." }, 500);
  }
});
