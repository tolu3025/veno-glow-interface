## 2026-05-30 - [Edge Function Secret Exposure & Hardcoded JWTs]
**Vulnerability:** Discovery of an Edge Function (`get-openai-key`) specifically designed to return a server-side secret (OPENAI_API_KEY) to the client, along with hardcoded JWT tokens in frontend components (`AIStudyAssistant.tsx`).
**Learning:** Even with JWT verification enabled, server-side secrets should NEVER be exposed to the client. Hardcoded tokens bypass user session management and create permanent backdoors.
**Prevention:** Use Edge Functions as a secure proxy to interact with 3rd party APIs, never as a delivery mechanism for keys. Always use dynamic session tokens from `supabase.auth.getSession()` for authenticated requests and enforce `verify_jwt = true` in `supabase/config.toml` for all sensitive endpoints.
