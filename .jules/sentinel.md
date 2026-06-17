## 2026-06-17 - Hardcoded Secrets and Missing JWT Verification
**Vulnerability:** Hardcoded Supabase credentials and JWT tokens were found in the frontend code. Additionally, several sensitive Edge Functions were configured with `verify_jwt = false`.
**Learning:** Hardcoding secrets is a common mistake that exposes the entire infrastructure. Manual `fetch` calls to Edge Functions often bypass the automatic authentication handled by `supabase.functions.invoke()`, leading developers to hardcode tokens to "make it work."
**Prevention:** Always use environment variables for connection strings. For manual `fetch` calls, dynamically retrieve the session token using `supabase.auth.getSession()`. Enforce `verify_jwt = true` in `supabase/config.toml` for all sensitive endpoints.
