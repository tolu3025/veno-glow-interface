Sentinel Journal initialized.

## 2025-05-14 - [Insecure Edge Function Configuration and Secret Leakage]
**Vulnerability:** Several sensitive Edge Functions were configured with `verify_jwt = false`, and a specific function (`get-openai-key`) was leaking the `OPENAI_API_KEY` to the client.
**Learning:** Hardcoding `anon` keys and disabling JWT verification on serverless functions can lead to unauthorized resource consumption and credential theft.
**Prevention:** Always enable JWT verification for sensitive backend endpoints and never expose server-side API keys to the frontend. Use `supabase.auth.getSession()` to provide dynamic authentication tokens for manual `fetch` calls.
