## 2025-05-15 - Hardcoded Anon JWT and Unprotected Edge Functions
**Vulnerability:** Edge Functions were using `verify_jwt = false` while the frontend was using a hardcoded "anon" JWT in the Authorization header.
**Learning:** This pattern likely emerged because `supabase.functions.invoke()` handles authentication automatically, but developers switching to manual `fetch` (e.g., for streaming) might resort to hardcoding tokens found in environment variables or client initialization.
**Prevention:** Always use `supabase.auth.getSession()` to get the current user's token for manual `fetch` calls to Edge Functions, and ensure `verify_jwt = true` is set in `supabase/config.toml` for all functions that don't explicitly need to be public.
