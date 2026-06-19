# Sentinel Security Journal 🛡️

This journal documents critical security learnings and vulnerability patterns specific to this codebase.

## 2025-05-14 - Hardcoded Supabase Credentials and JWTs
**Vulnerability:** Hardcoded Supabase URL and Publishable Key in the client initialization, and a hardcoded JWT in the AI Study Assistant page. Additionally, the `.env` file was tracked by Git.
**Learning:** Initial bootstrapping often leads to hardcoding secrets for speed, which then persist in the codebase.
**Prevention:** Always use environment variables for secrets from the start. Ensure `.env` is in `.gitignore` and not tracked by Git. Use dynamic session tokens for authenticated API calls.
