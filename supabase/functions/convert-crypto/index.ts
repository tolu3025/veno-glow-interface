// Breet crypto → NGN conversion
// Actions:
//   list-assets    → returns supported deposit assets with networks + NGN rates
//   create-address → generates/retrieves a Breet wallet address for the user
//   get-deposit    → returns the latest status of a given deposit row (poll fallback)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BREET_BASE = "https://api.breet.io/v1";

interface BreetHeaderVariant {
  headers: Record<string, string>;
  env: "development" | "production";
  secretName: "BREET_APP_SECRET" | "BREET_SECRET_KEY";
}

function breetHeaderVariants(): BreetHeaderVariant[] {
  const appId = (Deno.env.get("BREET_APP_ID") ?? "").trim();
  const appSecret = (Deno.env.get("BREET_APP_SECRET") ?? "").trim();
  const legacySecretKey = (Deno.env.get("BREET_SECRET_KEY") ?? "").trim();
  const secretCandidates: Array<{ name: "BREET_APP_SECRET" | "BREET_SECRET_KEY"; value: string }> = [];
  if (appSecret) secretCandidates.push({ name: "BREET_APP_SECRET", value: appSecret });
  if (legacySecretKey && legacySecretKey !== appSecret) {
    secretCandidates.push({ name: "BREET_SECRET_KEY", value: legacySecretKey });
  }
  const configuredEnv = (Deno.env.get("BREET_ENV") ?? "production").toLowerCase() === "development"
    ? "development"
    : "production";

  if (!appId || secretCandidates.length === 0) {
    console.error(
      `[convert-crypto] Breet credentials missing — BREET_APP_ID:${appId ? "set" : "MISSING"} BREET_APP_SECRET:${appSecret ? "set" : "MISSING"} BREET_SECRET_KEY:${legacySecretKey ? "set" : "MISSING"} BREET_ENV:${configuredEnv}`,
    );
    return [];
  }

  console.log(
    `[convert-crypto] Breet credential check — appIdLen:${appId.length} appSecretLen:${appSecret.length || 0} legacySecretLen:${legacySecretKey.length || 0} appSecretEqualsAppId:${appSecret === appId} legacySecretEqualsAppId:${legacySecretKey === appId} env:${configuredEnv}`,
  );

  const fallbackEnv = configuredEnv === "production" ? "development" : "production";
  return secretCandidates.flatMap((secret) => [configuredEnv, fallbackEnv].map((env) => ({
      headers: {
        "x-app-id": appId,
        "x-app-secret": secret.value,
        "X-Breet-Env": env,
        "Content-Type": "application/json",
      },
      env,
      secretName: secret.name,
    })));
}

async function fetchBreet(input: string, init: RequestInit = {}) {
  const variants = breetHeaderVariants();
  if (variants.length === 0) {
    return {
      response: new Response(
        JSON.stringify({ success: false, message: "Breet credentials are not configured" }),
        { status: 500 },
      ),
      text: "",
    };
  }
  let lastResult: { response: Response; text: string } | null = null;
  for (const variant of variants) {
    const response = await fetch(input, {
      ...init,
      headers: { ...variant.headers, ...(init.headers ?? {}) },
    });
    const text = await response.text();
    lastResult = { response, text };

    if (response.status !== 401) return lastResult;

    console.error(
      `[convert-crypto] Breet auth failed (env=${variant.env}, secret=${variant.secretName}, status=${response.status}): ${text.slice(0, 200)}`,
    );
  }

  return lastResult!;
}

interface BreetAsset {
  id: string;
  name: string;
  identifier: string;
  symbol: string;
  icon?: string;
  minimum?: number;
  network: string;
  rate?: { NGN?: number; GHS?: number };
  type?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // ── LIST ASSETS ──
    if (action === "list-assets") {
      const { response: res, text } = await fetchBreet(`${BREET_BASE}/trades/assets`);
      let parsed: any;
      try { parsed = JSON.parse(text); } catch {
        console.error("[convert-crypto] non-JSON from breet list-assets:", text.slice(0, 300));
        return json({ success: false, error: "Upstream error" }, 502);
      }
      if (!res.ok || !parsed?.success) {
        console.error("[convert-crypto] list-assets failed:", res.status, text.slice(0, 300));
        return json({ success: false, error: parsed?.message || "Could not load assets" }, 502);
      }
      const assets = ((parsed.data ?? []) as BreetAsset[]).map((a) => ({
        id: a.id,
        name: a.name,
        identifier: a.identifier,
        symbol: a.symbol,
        icon: a.icon ?? null,
        network: a.network,
        minimum: a.minimum ?? null,
        rate_ngn: a.rate?.NGN ?? null,
      }));
      // Pin USDT first
      assets.sort((a, b) => {
        if (a.symbol === "USDT" && b.symbol !== "USDT") return -1;
        if (b.symbol === "USDT" && a.symbol !== "USDT") return 1;
        return a.symbol.localeCompare(b.symbol);
      });
      return json({ success: true, assets });
    }

    // ── CREATE / REUSE DEPOSIT ADDRESS ──
    if (action === "create-address") {
      const assetId = String(body.asset_id ?? "");
      if (!assetId) return json({ success: false, error: "asset_id required" }, 400);

      // Serialize concurrent callers for the same (user, asset) via a Postgres
      // advisory lock so double-clicks / retries don't both hit Breet's
      // generate-address or insert duplicate pending rows.
      const { error: lockErr } = await admin.rpc("acquire_convert_crypto_lock", {
        _user: userId,
        _asset: assetId,
      });
      if (lockErr) {
        console.error("[convert-crypto] acquire lock failed:", lockErr);
        return json({ success: false, error: "Could not start deposit" }, 500);
      }

      try {
        // Look at the latest deposit row for this user+asset.
        const { data: existing } = await admin
          .from("crypto_deposits")
          .select("*")
          .eq("user_id", userId)
          .eq("asset_id", assetId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Reuse only if the latest row is still active (pending or detected).
        const ACTIVE = new Set(["pending", "detected"]);
        if (existing && ACTIVE.has(String(existing.status))) {
          return json({ success: true, deposit: existing, reused: true });
        }

        // If we have a previous row for this asset, reuse the same Breet wallet
        // (the address is permanent) but insert a fresh deposit row.
        if (existing?.breet_wallet_id && existing?.deposit_address) {
          const { text: assetsText2 } = await fetchBreet(`${BREET_BASE}/trades/assets`);
          let assetSnapshot: BreetAsset | undefined;
          try {
            const parsed = JSON.parse(assetsText2 || "null");
            assetSnapshot = (parsed?.data as BreetAsset[] | undefined)?.find((a) => a.id === assetId);
          } catch { /* ignore */ }

          const freshLabel = `${existing.label}_${Date.now().toString(36)}`;
          const { data: reinserted, error: reinsErr } = await admin
            .from("crypto_deposits")
            .insert({
              user_id: userId,
              asset_id: assetId,
              asset_identifier: existing.asset_identifier,
              asset_symbol: existing.asset_symbol,
              asset_name: existing.asset_name,
              network: existing.network,
              breet_wallet_id: existing.breet_wallet_id,
              deposit_address: existing.deposit_address,
              label: freshLabel,
              minimum_ngn: assetSnapshot?.minimum ?? existing.minimum_ngn,
              rate_ngn_at_creation: assetSnapshot?.rate?.NGN ?? existing.rate_ngn_at_creation,
              status: "pending",
            })
            .select()
            .single();
          if (reinsErr) {
            console.error("[convert-crypto] re-insert failed:", reinsErr);
            return json({ success: false, error: "Could not start a new deposit" }, 500);
          }
          return json({ success: true, deposit: reinserted, reused: false });
        }

        // First time for this asset — fetch metadata and generate a Breet address.
        const { response: assetsRes, text: assetsText } = await fetchBreet(`${BREET_BASE}/trades/assets`);
        const assetsJson = JSON.parse(assetsText || "null");
        if (!assetsRes.ok || !assetsJson?.success) {
          return json({ success: false, error: "Could not load assets" }, 502);
        }
        const asset = (assetsJson.data as BreetAsset[]).find((a) => a.id === assetId);
        if (!asset) return json({ success: false, error: "Unknown asset" }, 400);

        const baseLabel = `kuka_${userId.replace(/-/g, "").slice(0, 12)}_${asset.identifier}`;

        const generate = async (lbl: string) => {
          const { response, text } = await fetchBreet(
            `${BREET_BASE}/trades/sell/assets/${assetId}/generate-address`,
            { method: "POST", body: JSON.stringify({ label: lbl }) },
          );
          let parsed: any = null;
          try { parsed = JSON.parse(text); } catch {}
          return { response, text, parsed };
        };

        let label = baseLabel;
        let { response: genRes, text: genText, parsed: genJson } = await generate(label);

        // Retry on Breet's transient lock error with a fresh label + small backoff.
        for (let attempt = 0; attempt < 4; attempt++) {
          const msg = typeof genJson?.message === "string" ? genJson.message : "";
          const isLock = /could not acquire lock/i.test(msg);
          const isDup = /already exists/i.test(msg);
          if (genRes.ok && genJson?.success) break;
          if (!isLock && !isDup) break;
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          label = `${baseLabel}_${Date.now().toString(36)}_${attempt}`;
          ({ response: genRes, text: genText, parsed: genJson } = await generate(label));
        }

        if (!genJson || typeof genJson !== "object") {
          console.error("[convert-crypto] generate-address non-JSON:", genText.slice(0, 300));
          return json({ success: false, error: "Upstream error" }, 502);
        }
        if (!genRes.ok || !genJson?.success || !genJson?.data?.address) {
          console.error("[convert-crypto] generate-address failed:", genRes.status, genText.slice(0, 300));
          return json({ success: false, error: genJson?.message || "Could not generate address" }, 502);
        }

        const { data: inserted, error: insErr } = await admin
          .from("crypto_deposits")
          .insert({
            user_id: userId,
            asset_id: asset.id,
            asset_identifier: asset.identifier,
            asset_symbol: asset.symbol,
            asset_name: asset.name,
            network: asset.network,
            breet_wallet_id: String(genJson.data.id ?? ""),
            deposit_address: String(genJson.data.address),
            label,
            minimum_ngn: asset.minimum ?? null,
            rate_ngn_at_creation: asset.rate?.NGN ?? null,
            status: "pending",
          })
          .select()
          .single();

        if (insErr) {
          console.error("[convert-crypto] insert failed:", insErr);
          return json({ success: false, error: "Could not save deposit" }, 500);
        }

        return json({ success: true, deposit: inserted, reused: false });
      } finally {
        const { error: unlockErr } = await admin.rpc("release_convert_crypto_lock", {
          _user: userId,
          _asset: assetId,
        });
        if (unlockErr) console.error("[convert-crypto] release lock failed:", unlockErr);
      }
    }


    // ── GET DEPOSIT STATUS (poll fallback when realtime is not available) ──
    if (action === "get-deposit") {
      const id = String(body.id ?? "");
      if (!id) return json({ success: false, error: "id required" }, 400);
      const { data: dep } = await admin
        .from("crypto_deposits")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!dep) return json({ success: false, error: "Not found" }, 404);
      return json({ success: true, deposit: dep });
    }

    // ── RECONCILE: query Breet directly for trades on this deposit's wallet/address
    //    and credit via the same idempotent RPC the webhook uses.
    if (action === "reconcile") {
      const id = String(body.deposit_id ?? body.id ?? "");
      if (!id) return json({ success: false, error: "deposit_id required" }, 400);

      const { data: dep } = await admin
        .from("crypto_deposits")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!dep) return json({ success: false, error: "Not found" }, 404);
      if (dep.status === "credited") {
        return json({ success: true, deposit: dep, reconciled: false, reason: "already_credited" });
      }

      const candidates = [
        dep.breet_wallet_id ? `${BREET_BASE}/trades/sell/wallets/${encodeURIComponent(dep.breet_wallet_id)}/transactions` : "",
        dep.breet_wallet_id ? `${BREET_BASE}/trades/sell/wallets/${encodeURIComponent(dep.breet_wallet_id)}` : "",
        `${BREET_BASE}/trades/sell?address=${encodeURIComponent(dep.deposit_address)}`,
        `${BREET_BASE}/trades?destinationAddress=${encodeURIComponent(dep.deposit_address)}`,
        `${BREET_BASE}/trades/sell/transactions?address=${encodeURIComponent(dep.deposit_address)}`,
      ].filter(Boolean);

      let trades: any[] = [];
      for (const url of candidates) {
        try {
          const { response, text } = await fetchBreet(url);
          if (!response.ok) {
            console.log("[convert-crypto] reconcile non-ok:", response.status, url);
            continue;
          }
          let parsed: any;
          try { parsed = JSON.parse(text); } catch { continue; }
          if (!parsed?.success) continue;
          const d = parsed.data;
          const arr = Array.isArray(d) ? d
                    : Array.isArray(d?.transactions) ? d.transactions
                    : Array.isArray(d?.trades) ? d.trades
                    : d ? [d] : [];
          if (arr.length) { trades = arr; console.log("[convert-crypto] reconcile hit", url, arr.length); break; }
        } catch (e) {
          console.error("[convert-crypto] reconcile fetch error:", url, e);
        }
      }

      let credited = false;
      for (const t of trades) {
        const tradeId = String(t.id ?? t.tradeId ?? t.trade_id ?? "");
        if (!tradeId) continue;
        const destinationAddress = String(
          t.destinationAddress ?? t.depositAddress ?? t.address ?? dep.deposit_address,
        );
        if (destinationAddress && destinationAddress !== dep.deposit_address) continue;

        const amountUsd = Number(t.amountInUSD ?? t.amount_usd ?? t.usdAmount ?? t.valueUSD ?? 0);
        const rate = Number(t.rate ?? t.exchangeRate ?? t.rate_ngn ?? 0);
        const ngn = Math.round(amountUsd * rate * 0.99 * 100) / 100;
        const cryptoAmount = Number(t.cryptoAmount ?? t.amount ?? t.amountReceived ?? 0);
        const txHash = String(t.txHash ?? t.tx_hash ?? "");
        const confirmations = Number(t.confirmations ?? 0);
        const status = String(t.status ?? "");
        const event = `reconcile.${status || "unknown"}`;

        const { data: rpcData, error: rpcErr } = await admin.rpc("credit_breet_deposit", {
          _trade_id: tradeId,
          _deposit_address: dep.deposit_address,
          _crypto_amount: cryptoAmount,
          _amount_usd: amountUsd,
          _rate: rate,
          _ngn_amount: ngn,
          _tx_hash: txHash,
          _confirmations: confirmations,
          _event: event,
          _status: status,
          _payload: t,
        });
        if (rpcErr) { console.error("[convert-crypto] reconcile rpc error:", rpcErr); continue; }
        if (String((rpcData as any)?.status ?? "") === "credited") credited = true;
        console.log("[convert-crypto] reconcile rpc:", tradeId, (rpcData as any)?.status);
      }

      const { data: fresh } = await admin
        .from("crypto_deposits")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      return json({ success: true, deposit: fresh ?? dep, reconciled: credited, checked: trades.length });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[convert-crypto] error:", e);
    return json({ success: false, error: "Unexpected error" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
