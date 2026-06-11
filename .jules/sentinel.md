# Sentinel Security Journal

## 2025-05-22 - [Hardcoded Credentials and Unsecured Edge Functions]
**Vulnerability:** Hardcoded Supabase Anon Key and a static JWT token were found in the frontend code. Additionally, several sensitive Edge Functions had `verify_jwt = false` in `supabase/config.toml`, allowing unauthenticated access.
**Learning:** Hardcoding credentials often happens during rapid development or when trying to support features like streaming that might seem easier with manual `fetch` calls. Securing Edge Functions requires both backend configuration changes and frontend call-site updates.
**Prevention:** Always use environment variables for Supabase configuration. For Edge Functions requiring streaming (where `supabase.functions.invoke` might not be suitable), use `supabase.auth.getSession()` to dynamically retrieve the user's access token for the `Authorization` header. Ensure `verify_jwt = true` for all sensitive backend endpoints.
