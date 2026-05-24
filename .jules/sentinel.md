# Sentinel Security Journal 🛡️

## 2025-05-15 - Insecure Edge Function Configuration and Token Misuse
**Vulnerability:** Several sensitive Supabase Edge Functions (e.g., `ai-study-assistant`, `extract-document-text`) had `verify_jwt = false` in `supabase/config.toml`. Additionally, the frontend was using a hardcoded anon JWT in one place and the public `apikey` in another to authorize requests, instead of dynamic user-specific session tokens.
**Learning:** Default configurations or rapid prototyping can lead to leaving security verification disabled. Using static tokens in place of session-specific ones bypasses the intended security model and can lead to unauthorized access if those tokens are misused or exposed.
**Prevention:** Always ensure `verify_jwt = true` for any Edge Function that handles user data or performs sensitive operations. Always use dynamic session tokens from the authentication provider (e.g., `supabase.auth.getSession()`) for client-to-function communication.
