# Sentinel Security Journal

## 2025-05-15 - [Critical] Hardcoded JWT and Unprotected AI Endpoints
**Vulnerability:** A hardcoded Supabase 'anon' token was used in `src/pages/AIStudyAssistant.tsx`, and several AI-related Edge Functions had `verify_jwt = false`.
**Learning:** Even if a function is meant for "all users", failing to verify JWTs allows anyone with the URL to consume expensive AI resources without being a registered user.
**Prevention:** Always use dynamic session tokens for Edge Function calls and ensure `verify_jwt = true` in `supabase/config.toml` for any resource-heavy or sensitive operation.

## 2025-05-15 - [Enhancement] Route Protection for AI Features
**Vulnerability:** The `/ai-assistant` route was not wrapped in `ProtectedRoute`, leading to unnecessary client-side errors when trying to fetch data without a session.
**Learning:** Frontend route protection should match backend API protection for a consistent user experience and reduced attack surface.
**Prevention:** Audit `App.tsx` regularly to ensure all routes interacting with protected Edge Functions are wrapped in `ProtectedRoute`.
