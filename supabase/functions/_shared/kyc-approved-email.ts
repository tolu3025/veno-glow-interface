// Branded "KYC approved — fund your account" email.
import { renderEmail } from "./email.ts";

export interface KycApprovedEmailInput {
  fullName?: string | null;
  level: number;
  accountNumber?: string | null;
  bankName?: string | null;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function kycApprovedEmail({ fullName, level, accountNumber, bankName }: KycApprovedEmailInput) {
  const first = esc((fullName || "").trim().split(/\s+/)[0] || "there");
  const name = esc((fullName || "").trim());

  const accountBox = accountNumber
    ? `<div style="background:#f0fbfa;border:2px solid #22b9ad;border-radius:16px;padding:20px 24px;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;font-weight:600;">Your KukaPay account number</p>
        <p style="margin:0;font-size:30px;font-weight:800;letter-spacing:3px;color:#1a2b6b;font-family:'SF Mono','Roboto Mono',Menlo,monospace;">${esc(accountNumber)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border-top:1px solid #c9eeea;">
          <tr><td style="padding:10px 0 4px;font-size:13px;color:#64748b;">Bank</td><td style="padding:10px 0 4px;font-size:13px;color:#1a2b6b;font-weight:600;text-align:right;">${esc(bankName || "")}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Account name</td><td style="padding:4px 0;font-size:13px;color:#1a2b6b;font-weight:600;text-align:right;">KukaPay - ${name}</td></tr>
        </table>
      </div>`
    : `<div style="background:#f0fbfa;border:2px solid #22b9ad;border-radius:16px;padding:20px 24px;">
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1a2b6b;">Open the KukaPay app and tap <strong>Add Money</strong> to see your personal account number for funding.</p>
      </div>`;

  const step = (n: number, title: string, text: string) => `
    <tr><td style="padding:10px 0;vertical-align:top;width:40px;">
      <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#1a2b6b 0%,#5b4ce0 100%);color:#ffffff;font-weight:700;font-size:14px;line-height:30px;text-align:center;">${n}</div>
    </td><td style="padding:10px 0 10px 8px;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#1a2b6b;">${title}</p>
      <p style="margin:2px 0 0;font-size:13px;line-height:1.6;color:#475569;">${text}</p>
    </td></tr>`;

  const body = `
    ${accountBox}
    <h2 style="margin:28px 0 6px;font-size:17px;color:#1a2b6b;">What to do next</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${step(1, "Fund your account", "Transfer any amount from any bank app (OPay, PalmPay, Kuda, GTBank, Access and more) to your KukaPay account number. Your balance updates automatically.")}
      ${step(2, "Pay and collect on campus", "Pay class dues, buy event tickets, send money to friends and create collections for your department.")}
      ${step(3, "Keep your account safe", "Never share your PIN or login code with anyone. KukaPay staff will never ask for it.")}
    </table>
    <div style="text-align:center;margin-top:24px;">
      <a href="https://app.kukapay.com.ng" style="display:inline-block;background:linear-gradient(135deg,#1a2b6b 0%,#5b4ce0 100%);color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 32px;border-radius:12px;box-shadow:0 4px 14px rgba(34,185,173,0.35);">Open KukaPay &amp; fund account</a>
    </div>`;

  const html = renderEmail({
    title: "Your KukaPay account is approved",
    heading: `Congratulations ${first}, you're verified 🎉`,
    intro: `Your identity verification (KYC Level ${level}) has been approved by our team. Your KukaPay account is now fully active.`,
    body,
    footer: `Need help? Call <strong>08148698365</strong> or email <a href="mailto:support@kukapay.com.ng" style="color:#22b9ad;text-decoration:none;font-weight:600;">support@kukapay.com.ng</a>.`,
  });

  return { subject: "Your KukaPay account is approved 🎉 Fund it now", html };
}
