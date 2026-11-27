# KukaPay Auth Email Templates

These HTML templates are pasted into **Supabase Dashboard → Authentication → Email Templates**. They render against Supabase's built-in mailer using your configured SMTP provider.

## Paste mapping

| Supabase template slot       | File                       |
| ---------------------------- | -------------------------- |
| Confirm signup               | `confirm-signup.html`      |
| Magic Link                   | `magic-link.html`          |
| Reset Password               | `reset-password.html`      |
| Change Email Address         | `change-email.html`        |
| Invite user                  | `invite.html`              |
| Reauthentication             | `reauthentication.html`    |

## Variables used

- `{{ .ConfirmationURL }}` — action link (all templates except reauthentication)
- `{{ .Token }}` — 6-digit code (reauthentication only)
- `{{ .Email }}` / `{{ .NewEmail }}` — change-email template

## Setup checklist

1. **Authentication → SMTP Settings** → enable Custom SMTP, paste your provider creds, set the From address to `noreply@kukapay.com.ng` (or your verified sender).
2. **Authentication → Email Templates** → paste each file above into its matching slot, save.
3. **Authentication → URL Configuration** → Site URL = `https://app.kukapay.com.ng`; add preview URL to Redirect URLs.
4. **Authentication → Rate Limits** → confirm email sends/hour matches your SMTP plan.
5. Send yourself a test password reset to verify delivery.

## Removing Lovable's NS delegation

Lovable provisioned `notify.app.kukapay.com.ng` and added NS records at your domain registrar pointing to `ns3.lovable.cloud` and `ns4.lovable.cloud`. Since you're no longer using Lovable Emails:

1. In **Lovable → Cloud → Emails** — toggle emails OFF.
2. At your DNS provider, delete the two NS records for the host `notify.app.kukapay.com.ng` (or `notify` if your registrar shows relative names).
3. Propagation can take up to 72h — Supabase SMTP works regardless, this is just cleanup.
