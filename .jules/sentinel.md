## 2025-05-14 - [XSS Protection in JAMB CBT]
**Vulnerability:** Cross-Site Scripting (XSS) via `dangerouslySetInnerHTML`.
**Learning:** The JAMB CBT interface was rendering exam questions and sections directly from the database using `dangerouslySetInnerHTML`. While the content is expected to be safe, any compromise of the data source or inclusion of malicious scripts in the question bank could lead to XSS.
**Prevention:** Always sanitize any HTML content rendered via `dangerouslySetInnerHTML` using a library like `DOMPurify`. Created a `sanitizeHtml` utility to centralize this logic.
