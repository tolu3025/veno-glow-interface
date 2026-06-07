## 2025-05-15 - [Securing Edge Functions and Credentials]
**Vulnerability:** Hardcoded Supabase credentials and JWT tokens in the frontend, combined with disabled JWT verification on sensitive backend Edge Functions.
**Learning:** Manual `fetch` calls for streaming responses (like in AI assistants) often bypass the Supabase client's automatic auth handling, leading developers to hardcode tokens.
**Prevention:** Always use `supabase.auth.getSession()` to retrieve dynamic tokens for manual `fetch` calls and ensure `verify_jwt = true` is set in `supabase/config.toml` for all sensitive functions. Wrap associated routes in `ProtectedRoute` to prevent unauthenticated triggers.
