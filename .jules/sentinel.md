## 2025-05-14 - Hardcoded JWT and Missing Function Authorization
**Vulnerability:** Hardcoded Bearer tokens and Edge Functions with `verify_jwt = false` allowed potential unauthorized access and credential leakage.
**Learning:** During rapid development, developers may use hardcoded tokens for testing Edge Functions and forget to enable standard Supabase JWT verification, leaving endpoints exposed to anyone with the project URL.
**Prevention:** Always use `supabase.auth.getSession()` for dynamic token retrieval and ensure `supabase/config.toml` has `verify_jwt = true` for all sensitive Edge Functions. Scan for hardcoded "eyJ" strings regularly.
