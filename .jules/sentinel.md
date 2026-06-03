## 2025-05-15 - [XSS in CBT Content]
**Vulnerability:** Persistent and Reflected XSS through `dangerouslySetInnerHTML`.
**Learning:** Content fetched from Edge Functions or Supabase (like exam questions and AI-generated explanations) was being rendered directly using `dangerouslySetInnerHTML` without any sanitization, assuming it was safe because it contained KaTeX or basic HTML formatting.
**Prevention:** Always use a sanitization library like `dompurify` with a strict whitelist when rendering HTML from dynamic sources, even if the source is considered "internal" or "trusted".
