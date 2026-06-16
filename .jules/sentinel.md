
## 2025-05-15 - [Edge Function Security and Hardcoded JWTs]
**Vulnerability:** Hardcoded Supabase anonymous JWTs were found in `src/pages/AIStudyAssistant.tsx` and Edge Functions were configured with `verify_jwt = false`.
**Learning:** Manual `fetch` calls to Supabase Edge Functions often lead to developers hardcoding tokens or using publishable keys insecurely when they need features like streaming that `supabase.functions.invoke()` might not support as easily.
**Prevention:** Always use `supabase.auth.getSession()` to retrieve dynamic user tokens for manual `fetch` calls, and ensure `verify_jwt = true` in `supabase/config.toml` for all functions that process user-specific or sensitive data.
