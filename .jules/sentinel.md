## 2026-05-15 - [Hardcoded Anon Key and Insecure Edge Functions]
**Vulnerability:** Hardcoded Supabase 'anon' key used in frontend authorization headers and 'verify_jwt = false' for sensitive AI-related Edge Functions.
**Learning:** Hardcoding keys in the frontend makes them easily discoverable. Disabling JWT verification on Edge Functions allows unauthenticated users to consume resources and potentially access sensitive AI capabilities or leak context.
**Prevention:** Always use dynamic session tokens for Edge Function calls and ensure 'verify_jwt = true' for all functions that require authentication.
