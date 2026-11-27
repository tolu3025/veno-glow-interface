// Shared KukaPay branded email layout + Brevo sender.
// Mirrors the design in /email-templates/*.html so every email looks the same.

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const SENDER = { name: "KukaPay", email: "noreply@app.kukapay.com.ng" };
const BANNER = "https://app.kukapay.com.ng/email-banner.png";

export interface LayoutOptions {
  title: string;
  heading: string;
  intro: string;
  /** Raw HTML for the main body block (code box, amount card, details table...) */
  body?: string;
  /** Small muted note under the body */
  note?: string;
  /** Footer line (defaults to the support line) */
  footer?: string;
}

export function renderEmail({ title, heading, intro, body = "", note, footer }: LayoutOptions): string {
  const footerHtml = footer ??
    `Didn't request this? Contact <a href="mailto:support@kukapay.com.ng" style="color:#22b9ad;text-decoration:none;font-weight:600;">support@kukapay.com.ng</a> immediately.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${title}</title></head>
  <body style="margin:0;padding:0;background:#eef2fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2fb;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(26,43,107,0.08);">
          <tr><td style="padding:0;line-height:0;font-size:0;">
            <img src="${BANNER}" alt="KukaPay — Smarter Payments, Greater Possibilities" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
          </td></tr>
          <tr><td style="padding:32px 32px 8px;">
            <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:#1a2b6b;">${heading}</h1>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#475569;">${intro}</p>
          </td></tr>
          ${body ? `<tr><td style="padding:24px 32px;">${body}</td></tr>` : ""}
          ${note ? `<tr><td style="padding:0 32px 24px;"><p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">${note}</p></td></tr>` : ""}
          <tr><td style="padding:20px 32px;border-top:2px solid #22b9ad;background:#f7f9ff;">
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6;">${footerHtml}</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#1a2b6b;font-weight:600;">&copy; KukaPay &middot; Smarter Payments, Greater Possibilities</p>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Key/value details table used in receipt-style emails. */
export function detailsTable(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
    ${rows.map(([label, value], i) => `<tr style="background:${i % 2 ? "#ffffff" : "#f7f9ff"};">
      <td style="padding:12px 16px;font-size:13px;color:#64748b;">${label}</td>
      <td style="padding:12px 16px;font-size:13px;color:#1a2b6b;font-weight:600;text-align:right;">${value}</td>
    </tr>`).join("")}
  </table>`;
}

/** Big highlighted amount block. */
export function amountBlock(amount: string, caption: string): string {
  return `<div style="background:#f0fbfa;border:2px solid #22b9ad;border-radius:14px;padding:20px 24px;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;">${caption}</p>
    <p style="margin:0;font-size:32px;font-weight:800;color:#1a2b6b;">${amount}</p>
  </div>`;
}

/** Monospaced OTP code block, same look as the reauthentication template. */
export function codeBlock(code: string): string {
  return `<div style="display:inline-block;background:#f0fbfa;border:2px solid #22b9ad;color:#1a2b6b;font-size:32px;font-weight:800;letter-spacing:8px;padding:18px 28px;border-radius:14px;font-family:'SF Mono','Roboto Mono',Menlo,monospace;">${code}</div>`;
}

export interface SendResult {
  ok: boolean;
  status: number;
  data: unknown;
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<SendResult> {
  if (!BREVO_API_KEY) {
    console.error("[email] BREVO_API_KEY is not configured.");
    return { ok: false, status: 503, data: { error: "Email service is not configured yet." } };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": BREVO_API_KEY },
    body: JSON.stringify({ sender: SENDER, to: [{ email: to }], subject, htmlContent }),
  });

  const raw = await response.text();
  if (!response.ok) console.error("[email] brevo send failed", response.status, raw);
  let data: unknown = raw;
  try { data = JSON.parse(raw); } catch (_) { /* keep raw */ }
  return { ok: response.ok, status: response.status, data };
}

export function formatNaira(value: number): string {
  return `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
