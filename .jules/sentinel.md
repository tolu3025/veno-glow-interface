## 2025-05-14 - [CRITICAL] OpenAI API Key Leak and Hardcoded JWT Token
**Vulnerability:**
1. A Supabase Edge Function `get-openai-key` was exposing the full `OPENAI_API_KEY` to any authenticated user.
2. Multiple AI-related Edge Functions lacked JWT verification, allowing unauthenticated usage.
3. A hardcoded Bearer token (JWT) was found in `src/pages/AIStudyAssistant.tsx`, bypasssing proper authentication flows and leaking a valid session token.

**Learning:** Server-side secrets must never be returned to the client. Frontend code should never contain hardcoded authentication tokens; instead, use established client libraries (like `supabase-js`) that handle token management automatically.

**Prevention:**
- Remove all "key-leaking" server functions.
- Enforce `verify_jwt = true` for all sensitive Edge Functions in `supabase/config.toml`.
- Use `supabase.functions.invoke` instead of manual `fetch` with hardcoded headers in the frontend.
