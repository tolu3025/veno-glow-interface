## 2025-06-18 - [Hardening Edge Functions and Auth Logic]
**Vulnerability:** Hardcoded JWT tokens in frontend code and insecure Edge Function configurations (`verify_jwt = false`).
**Learning:** Hardcoding "anon" keys as Bearer tokens bypasses proper user authentication and relies on obscure strings for security. Additionally, exposing Edge Functions without JWT verification allows unauthorized access to backend logic.
**Prevention:** Always use `supabase.auth.getSession()` to retrieve dynamic user tokens for manual `fetch` calls. For `supabase.functions.invoke()`, ensure the route is protected by `ProtectedRoute` so the client can automatically attach the authenticated session JWT. Enable `verify_jwt = true` in `supabase/config.toml` for all sensitive functions.
