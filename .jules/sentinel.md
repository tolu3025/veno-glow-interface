# Sentinel Security Journal 🛡️

## 2025-05-15 - [Hardcoded JWT and Unprotected Routes]
**Vulnerability:** Found a hardcoded admin-level JWT in `src/pages/AIStudyAssistant.tsx` and sensitive AI-related Edge Functions with `verify_jwt = false`. Also discovered the `/ai-assistant` frontend route was not wrapped in `ProtectedRoute`.
**Learning:** Development speed often leads to hardcoding credentials for quick testing, which are then accidentally committed. Defaulting Edge Functions to `verify_jwt = false` is a common but dangerous configuration.
**Prevention:** Always use dynamic session tokens for Edge Function calls and ensure all sensitive frontend routes are protected by authentication guards. Periodically audit `supabase/config.toml` for `verify_jwt` status.
