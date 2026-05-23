## 2025-05-14 - [Securing Edge Functions with Manual Fetch]
**Vulnerability:** Cost-incurring Edge Functions (like AI study assistant) were configured with `verify_jwt = false`, and call sites used hardcoded tokens.
**Learning:** Functions using manual `fetch` for streaming support do not benefit from `supabase.functions.invoke()`'s automatic auth handling. They must be secured with `verify_jwt = true` and call sites must explicitly retrieve the session token.
**Prevention:** Always verify if an Edge Function is called via `invoke()` or `fetch`. If `fetch` is used, ensure manual JWT handling is implemented and `verify_jwt` is enabled in `supabase/config.toml`.
