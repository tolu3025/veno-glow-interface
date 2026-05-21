## 2025-05-15 - [Securing Edge Functions with JWT and Removing Hardcoded Tokens]
**Vulnerability:** Edge Functions were configured with `verify_jwt = false`, allowing unauthorized access. Additionally, a static 'anon' JWT was hardcoded in the frontend for Edge Function calls, bypassing intended security controls.
**Learning:** Hardcoding 'anon' keys in frontend code for Edge Function `Authorization` headers effectively disables the protection offered by Supabase's JWT verification, even when enabled, if the key is easily discoverable.
**Prevention:** Always use dynamic session tokens retrieved via `supabase.auth.getSession()` for Edge Function authorization and ensure `verify_jwt = true` in `config.toml` for all sensitive endpoints.
