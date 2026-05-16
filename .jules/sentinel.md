## 2026-05-16 - Hardcoded JWT and Unsecured Edge Function
**Vulnerability:** A hardcoded Supabase anonymous JWT was used in the frontend to call the `ai-study-assistant` Edge Function, which was configured with `verify_jwt = false`.
**Learning:** Hardcoding credentials in the frontend exposes them to anyone who inspects the application. Disabling JWT verification on Edge Functions allows unauthenticated access, potentially leading to resource abuse and increased costs.
**Prevention:** Always use dynamic session tokens (e.g., via `supabase.auth.getSession()`) for authenticated requests from the frontend. Ensure all sensitive Edge Functions have `verify_jwt = true` in `supabase/config.toml` to enforce authentication.
