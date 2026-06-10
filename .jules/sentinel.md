## 2025-05-22 - [Remediation of Hardcoded Credentials]
**Vulnerability:** Hardcoded Supabase URL, Publishable Key, and JWT tokens in frontend source files.
**Learning:** Hardcoded credentials (even "publishable" ones) can lead to misuse and lack of proper security context. Using a static JWT prevents proper authentication-based RLS and user auditing on Edge Functions.
**Prevention:** Always use environment variables for service URLs and keys. Retrieve dynamic user session tokens via `supabase.auth.getSession()` for internal API/Edge Function calls to ensure authenticated context and defense in depth.
