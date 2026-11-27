# KukaPay Cloudflare Security Checklist

Apply these in the Cloudflare dashboard for `kukapay.com.ng` (and `app.kukapay.com.ng`).
The app-side protections (session risk scoring, step-up PIN, adaptive limits, IP blocklist)
are already live; Cloudflare is the outer edge layer.

## 1. Managed rules (WAF)
- Security > WAF > Managed rules: enable **Cloudflare Managed Ruleset** (action: Managed Challenge)
  and **Cloudflare OWASP Core Ruleset** (paranoia level: PL2, score threshold: Medium).
- Review the WAF events weekly for false positives on `/api/*`.

## 2. Rate limiting rules
Create one rule per entry point (Security > WAF > Rate limiting rules):

| Name | Match | Limit | Action |
|---|---|---|---|
| login | URI path contains `/auth/v1/token` or `/login` | 10 req / 1 min per IP | Block 15 min |
| otp | URI path contains `/functions/v1/phone-otp` | 5 req / 5 min per IP | Block 30 min |
| pin | path contains `/verify-login-pin` or `/verify-transaction-pin` | 8 req / 5 min per IP | Managed Challenge |
| payments | path contains `/p2p-transfer`, `/initiate-withdrawal`, `/pay-` | 15 req / 5 min per IP | Block 15 min |

## 3. Bot protection
- Security > Bots: enable **Bot Fight Mode** (or Super Bot Fight Mode on Pro:
  Definitely automated = Block, Likely automated = Managed Challenge, Verified bots = Allow).

## 4. Webhook allow-list (do this BEFORE enabling the rules above)
- Security > WAF > Custom rules > Create: **Skip** all remaining rules (WAF, rate limiting, bots)
  when `http.request.uri.path contains "/functions/v1/flutterwave-webhook"`
  or `contains "/functions/v1/breet-webhook"` or `starts_with "/api/public/"`.
- Optionally tighten with Flutterwave's published egress IPs. Signature verification
  already runs inside the webhook, so this skip is safe.

## 5. Emergency: under attack
- Overview > Quick actions > **Under Attack Mode** — turn on only during an active DDoS.
  It challenges every visitor, so real students will see a 5-second interstitial.
- Turn it off as soon as traffic normalises; keep the webhook skip rule in place so
  payments keep settling while it is on.

## 6. DDoS response plan (short form)
1. Confirm the attack in Analytics > Security (spike in blocked/challenged requests).
2. Enable Under Attack Mode.
3. Check Supabase health; if the origin is fine, keep serving.
4. Add a temporary custom rule blocking the offending ASN/country if the traffic is narrow.
5. Use the in-app Admin > Security > Blocked IPs panel for individual abusers.
6. After 30 minutes of normal traffic, disable Under Attack Mode and write up the incident.
