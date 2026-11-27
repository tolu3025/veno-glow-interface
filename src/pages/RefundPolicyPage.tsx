import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Receipt } from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content: `This Refund Policy sets out the terms and conditions under which KUKA TECHNOLOGY AND INNOVATION LTD ("KukaPay," "we," "us," or "our") processes refunds for Transactions conducted through the KukaPay Platform.

By using KukaPay, you agree to this Refund Policy. We reserve the right to amend this Policy at any time with prior notice.

Legal Entity: KUKA TECHNOLOGY AND INNOVATION LTD
CAC Number: RC9563845
Registered Address: 47A Lawoyin Street, Ilesha Garage, Osogbo Area, Osogbo, Osun State, Nigeria`,
  },
  {
    title: "2. Definitions",
    content: `Refund — The return of funds to a User for a disputed, failed, or erroneous Transaction.
Transaction — Any payment, transfer, or financial operation on the KukaPay Platform.
Merchant — A business or individual that accepts payments via KukaPay.
User — Any person who initiates a Transaction on the Platform.
Business Day — Monday to Friday, excluding public holidays in Nigeria.`,
  },
  {
    title: "3. General Refund Principles",
    content: `3.1 Eligibility: Refunds are considered only under the circumstances outlined in this Policy. KukaPay reserves the right to deny refund requests that do not meet the specified criteria.

3.2 Time Limit: All refund requests must be submitted within 7 calendar days of the Transaction date, except where otherwise stated.

3.3 Refund Method: Approved refunds shall be credited to: (a) the User's KukaPay Wallet; or (b) the original payment method (bank account, card, or mobile money), depending on the nature of the Transaction and regulatory requirements.

3.4 Processing Time: Refunds are typically processed within 5–10 Business Days of approval. Complex cases may require up to 30 days.

3.5 Non-Refundable Fees: Certain fees are non-refundable, including: (a) transaction processing fees already paid to Flutterwave or partner banks; (b) currency conversion fees; (c) penalty fees for Terms violations.`,
  },
  {
    title: "4. Circumstances Eligible for Refund",
    content: `Failed Transaction (debited but not completed) — Full refund. Required: Transaction ID, bank statement, screenshot.

Duplicate Transaction — Full refund of duplicate. Required: both Transaction IDs, bank statements.

Unauthorized Transaction — Full refund if verified. Required: police report, affidavit, identity verification.

Merchant Non-Delivery — Full or partial refund. Required: proof of purchase, communication with Merchant.

Incorrect Amount Sent — Case-by-case review. Required: transaction details, recipient confirmation.

User Error (wrong recipient, wrong amount) — Generally not refundable. User bears responsibility.

Successful Completed Transaction — Not refundable.`,
  },
  {
    title: "5. Refund Process",
    content: `Step 1 — Submission: Submit your refund request via:
(a) Email: support@kukapay.com.ng;
(b) In-app support ticket;
(c) Phone: +2348148698.

Required Information:
• Full name and registered email;
• Transaction ID or reference number;
• Date and amount of Transaction;
• Detailed description of the issue;
• Supporting documentation (receipts, screenshots, bank statements).

Step 2 — Review: Our support team will acknowledge receipt within 24 hours and initiate investigation.

Step 3 — Investigation: We will: (a) verify Transaction records; (b) contact relevant parties (Merchants, Flutterwave, banks); (c) review supporting documentation; (d) assess compliance with this Policy.

Step 4 — Decision: You will be notified of the decision via email within 5 Business Days of submission (or 10 Business Days for complex cases).

Step 5 — Processing: If approved, the refund will be processed according to Section 3.3.`,
  },
  {
    title: "6. Merchant-Related Refunds",
    content: `6.1 Merchant Responsibility: Merchants are responsible for fulfilling orders and delivering goods/services as described. KukaPay acts as a payment facilitator and is not liable for Merchant failures.

6.2 Merchant Refund Obligation: Merchants agree to process refunds for: (a) non-delivery of goods/services; (b) defective or misdescribed products; (c) cancellations in accordance with Merchant's own policy.

6.3 KukaPay Intervention: If a Merchant fails to resolve a valid refund request within 7 days, KukaPay may: (a) debit the Merchant's settlement account; (b) issue a refund to the User from KukaPay reserves; (c) suspend the Merchant's account pending resolution.

6.4 Chargebacks: Where a User disputes a card payment through their card issuer, KukaPay will cooperate with Flutterwave and the issuing bank. The Merchant may be liable for chargeback fees and may be required to provide evidence of delivery.`,
  },
  {
    title: "7. Disputed and Fraudulent Transactions",
    content: `7.1 Unauthorized Transactions: If you believe your Account was used without authorization:
(a) immediately freeze your Account via the app or by calling +2348148698;
(b) report to support@kukapay.com.ng within 24 hours;
(c) file a police report and provide a copy to KukaPay.

7.2 Investigation Period: We will investigate unauthorized Transaction claims within 10 Business Days. If verified, a full refund will be issued.

Refunds may be denied if: (a) you shared your login credentials; (b) you failed to report unauthorized access promptly; (c) you authorized the Transaction but later changed your mind.`,
  },
  {
    title: "8. Currency and Exchange Rate Refunds",
    content: `8.1 Naira Transactions: Refunds for Naira (NGN) Transactions will be issued in NGN at the original Transaction amount.

8.2 Foreign Currency Transactions: For USD, GBP, EUR, or other currency Transactions:
(a) refunds will be issued in the original currency where possible;
(b) if refunded in NGN, the exchange rate applied will be the rate on the refund processing date, which may differ from the original Transaction rate;
(c) KukaPay is not responsible for exchange rate fluctuations.`,
  },
  {
    title: "9. Exceptions and Limitations",
    content: `9.1 No Refund For:
• Cryptocurrency or virtual asset purchases (where offered);
• Gambling, betting, or lottery Transactions;
• Transactions prohibited by CBN regulations;
• Transactions where the User violated KukaPay's Terms and Conditions.

9.2 Partial Refunds: We may issue partial refunds where: (a) only part of the order was undelivered; (b) the Merchant agrees to a partial settlement; (c) fees or charges are legitimately retained per this Policy.`,
  },
  {
    title: "10. Complaints and Escalation",
    content: `If you are dissatisfied with a refund decision:

Step 1 — Contact support for reconsideration. Timeline: within 7 days of decision.
Step 2 — Request escalation to management. Timeline: within 14 days of initial decision.
Step 3 — File complaint with CBN Consumer Protection Department. Timeline: if unresolved after 30 days.
Step 4 — Seek legal redress. Timeline: as a last resort.`,
  },
  {
    title: "11. Contact Information",
    content: `For refund requests, inquiries, or complaints:

Email: support@kukapay.com.ng
Phone: +2348148698
Address: 47A Lawoyin Street, Ilesha Garage, Osogbo Area, Osogbo, Osun State, Nigeria
Legal Entity: KUKA TECHNOLOGY AND INNOVATION LTD
CAC Number: RC9563845`,
  },
  {
    title: "12. Governing Law",
    content: `This Refund Policy is governed by the laws of the Federal Republic of Nigeria and is subject to the jurisdiction of Nigerian courts.`,
  },
];

const RefundPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Refund Policy</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">KUKA TECHNOLOGY AND INNOVATION LTD</p>
          <p className="text-sm text-muted-foreground mt-1">
            Last Updated: May 31, 2026 · Effective: May 31, 2026 · CAC No. RC9563845
          </p>
        </div>

        <div className="space-y-6 pb-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RefundPolicyPage;
