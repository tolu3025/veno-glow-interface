## 2025-05-15 - [Hardcoded Supabase Credentials and JWTs]
**Vulnerability:** Found hardcoded `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` in the client configuration, and a hardcoded JWT token in `src/pages/AIStudyAssistant.tsx`.
**Learning:** Hardcoding secrets is a common but critical oversight that allows unauthorized access to backend services and bypasses per-user security controls like Row Level Security (RLS).
**Prevention:** Always use environment variables for public credentials and dynamic session tokens (via `supabase.auth.getSession()`) for authenticated API requests. Use automated linting or secret scanning to catch these patterns early.
