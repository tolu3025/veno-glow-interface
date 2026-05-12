## 2025-05-14 - [CRITICAL] OpenAI API Key Leak and Unauthenticated Edge Function Access
**Vulnerability:** A Supabase Edge Function `get-openai-key` was exposing the full `OPENAI_API_KEY` to any authenticated user. Additionally, multiple AI-related Edge Functions lacked JWT verification, allowing unauthenticated users to consume AI credits.
**Learning:** Returning server-side secrets to the client is a major security risk. Furthermore, failing to enable `verify_jwt` on expensive or sensitive Edge Functions leads to unauthorized resource consumption.
**Prevention:** Never expose secrets via API endpoints. Always ensure sensitive Edge Functions have `verify_jwt = true` in `supabase/config.toml` to enforce authentication.
