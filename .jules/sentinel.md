## 2025-05-15 - Hardcoded JWT in Frontend
**Vulnerability:** A hardcoded Supabase JWT was found in `src/pages/AIStudyAssistant.tsx`, providing anonymous but unauthorized-like access to AI Edge Functions.
**Learning:** Developers sometimes hardcode tokens during testing or to bypass authentication hurdles (like streaming support issues with `supabase.functions.invoke()`).
**Prevention:** Use `supabase.auth.getSession()` to retrieve dynamic access tokens for manual `fetch` calls and ensure Edge Functions have `verify_jwt = true` in `config.toml`.

## 2025-05-15 - Anonymous Access to Sensitive Edge Functions
**Vulnerability:** Several Edge Functions providing AI features and data fetching (`ai-study-assistant`, `extract-document-text`, `fetch-jamb-questions`) had `verify_jwt = false` in `supabase/config.toml`.
**Learning:** Defaulting to `verify_jwt = false` exposes costly or sensitive backend logic to unauthorized public access, increasing risk of abuse or data leakage.
**Prevention:** Always default to `verify_jwt = true` for functions unless they are explicitly intended for unauthenticated public use.
