# Sentinel Security Journal

## 2025-05-19 - [Critical Credential Leakage & Resource Exposure]
**Vulnerability:** A hardcoded Supabase 'anon' JWT was found in `AIStudyAssistant.tsx`, and the `get-openai-key` Edge Function was explicitly serving the `OPENAI_API_KEY` to the client. Additionally, multiple AI Edge Functions had `verify_jwt = false` in `supabase/config.toml`.
**Learning:** Hardcoding secrets and creating "helper" functions to fetch server-side keys are common but dangerous shortcuts that compromise the entire security model. The `verify_jwt = false` configuration was likely a remnant of development that never got hardened.
**Prevention:**
- Never hardcode JWTs or API keys.
- Use `supabase.auth.getSession()` to retrieve user tokens dynamically for authenticated requests.
- Ensure all Edge Functions performing sensitive or expensive operations (like AI) have `verify_jwt = true` in `supabase/config.toml`.
- Remove any Edge Function that returns raw secrets like `OPENAI_API_KEY`.
