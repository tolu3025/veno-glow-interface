# Context-Aware Security: Session Risk, Step-Up Auth, Adaptive Limits

Goal: KukaPay should stop treating "signed in" as "trusted". Every sensitive action is judged on context — device, location, hour, behaviour — and a risky session gets challenged and money-limited, never silently welcomed.

Scope for this first pass (per your choices): risk scoring + step-up PIN + adaptive rate limiting + tighter money limits on risky sessions, plus the Cloudflare settings to switch on. The full attribute policy engine, zero-trust rewrite of every internal call, and the written DDoS playbook follow in a second pass.

## What exists today (verified)

- `security_logs` already records user, action, IP and device fingerprint.
- `device_fingerprints` tracks known devices per user with a trusted flag.
- `login_attempts` locks by email after failures; `rate_limits` counts per key/action; `check_rate_limit`, `check_login_lock`, `check_pin_lockout` exist.
- `velocity_counters` tracks daily outflow and count per user; `fraud_flags` records suspicions.
- Nothing today scores a session, compares device/location against history, or changes behaviour based on context. A stolen password plus the login PIN gets full access.

So the raw signals are mostly already being collected — they are just never evaluated.

## 1. Session risk scoring

New `session_risk` record created at sign-in and updated as the session runs. Score is built from:

- Device: fingerprint unseen for this user, or seen but never trusted.
- Location: IP country/region differs from the user's recent history; impossible travel (two locations too far apart for the time between them).
- Time: activity in the user's dead hours (e.g. 1–5 a.m. local) when they have no such history.
- Behaviour during the session: burst of transfers, repeated PIN failures, sudden jump in data reads, any attempt to hit admin-only paths.

Score bands: low / elevated / high. The score is recalculated on each sensitive request, not once at login.

## 2. Step-up, never a hard block

Per your choice, risky context never locks a legitimate student out:

- Elevated: PIN challenge before the action proceeds, and the user gets a notification naming the device and city.
- High: PIN challenge plus email alert, and the money limits below.
- Repeated PIN failure on a high-risk session ends the session and forces a fresh sign-in.

Users get a "Recent activity" view listing sessions with device, city and time, and a "This wasn't me" button that ends all other sessions and flags the account.

## 3. Tighter money limits on risky sessions

Enforced in the database posting engine, not the screen, so it cannot be bypassed:

- High-risk session: daily outflow capped at a low ceiling, PIN required on every transfer and withdrawal regardless of amount, new-beneficiary payouts blocked until the session is verified.
- Elevated: PIN on every money action; normal ceilings.
- Withdrawals attempted from a brand-new device within minutes of a password change are held and flagged rather than sent.

## 4. Adaptive rate limiting and IP reputation

Extends the existing counter table instead of replacing it:

- Per-IP and per-user counters on auth, OTP, PIN, payment and public collection endpoints.
- Escalation ladder: normal → throttle (slowed responses) → temporary ban (minutes) → extended ban (hours) on repeat, driven by pattern shift (sudden frequency spike, many accounts from one IP, many IPs on one account), not raw volume alone.
- Bans recorded in a blocklist table checked on every request; admins can view and lift them.

## 5. Cloudflare edge protection (settings you switch on)

Since you have Cloudflare, the true DDoS wall belongs there — the app cannot absorb a flood it still has to receive. I'll give you an exact checklist to apply on the KukaPay zone:

- Managed WAF ruleset enabled, plus OWASP core rules in blocking mode.
- Rate-limiting rules on the sign-in, OTP, PIN-verify and payment paths.
- Bot Fight Mode, "Under Attack" mode as the emergency toggle.
- Country/ASN challenge rules for regions you don't serve.
- Webhook paths allow-listed to the provider's IP ranges so Flutterwave callbacks are never challenged.

## Admin visibility

New admin screen: risky sessions, recent step-up challenges, blocked IPs, fraud flags — with a one-click "terminate session" and "unblock IP".

## Technical notes

- New tables: `user_sessions` (device, IP, geo, risk score, status), `session_risk_events`, `ip_blocklist`, `ip_reputation`. All with RLS: a user sees only their own rows; admins via `has_role`.
- Risk evaluation runs server-side in a database function called from the existing money functions (`post_ledger_entry` path) and from a shared server-side guard used by sensitive server functions — the client never supplies its own risk verdict.
- IP geolocation from Cloudflare's request headers (country/city), so no third-party lookup call is added.
- Device fingerprint reuses the existing `device_fingerprints` table.
- Existing lockout functions stay; the new ladder wraps them rather than duplicating.

## Order of work

1. Session and risk tables, plus session creation on sign-in.
2. Risk scoring function and step-up challenge in the app.
3. Risk-aware limits inside the money path.
4. Adaptive rate limiting and IP blocklist.
5. Admin security screen.
6. Cloudflare checklist handed to you.

## Deferred to the next pass

Full attribute-based policy engine covering every data-sensitivity tier, re-verification on every internal service call, and the written DDoS response playbook (who is notified, what is toggled, where traffic is redirected).
