import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Shield } from "lucide-react";

const sections = [
  {
    title: "1. Introduction",
    content: `Welcome to KukaPay, a digital payment platform operated by KUKA TECHNOLOGY AND INNOVATION LTD ("we," "us," "our," or "KukaPay"). KUKA TECHNOLOGY AND INNOVATION LTD is a Limited Liability Company registered in Nigeria under CAC Number RC9563845, with its registered office at 47A Lawoyin Street, Ilesha Garage, Osogbo Area, Osogbo, Osun State, Nigeria.

These Terms and Conditions ("Terms") govern your access to and use of the KukaPay website, mobile application, and all related services (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.`,
  },
  {
    title: "2. Definitions",
    content: `Account — Your registered user profile on the KukaPay Platform.
Business Day — Any day from Monday to Friday, excluding public holidays in Nigeria.
CBN — Central Bank of Nigeria.
Flutterwave — Flutterwave Technology Solutions Limited, our payment processing partner.
KYC — Know Your Customer verification requirements.
Merchant — A business or individual using KukaPay to accept payments.
NDPR — Nigeria Data Protection Regulation 2019.
NIN — National Identification Number.
Transaction — Any payment, transfer, or financial operation conducted via the Platform.
User, you, your — Any person who accesses or uses the Platform.
Wallet — Your digital stored-value account within KukaPay.`,
  },
  {
    title: "3. Eligibility and Account Registration",
    content: `3.1 Eligibility: To use KukaPay, you must:
• Be at least 18 years old;
• Be a resident of Nigeria or a jurisdiction where KukaPay is legally available;
• Possess a valid Bank Verification Number (BVN) and National Identification Number (NIN);
• Provide accurate, complete, and current information during registration;
• Not have been previously suspended or prohibited from using KukaPay.

3.2 Account Security: You are responsible for:
• Maintaining the confidentiality of your login credentials;
• All activities occurring under your Account;
• Immediately notifying us of any unauthorized access or security breach.

3.3 KYC Verification: We are required by CBN regulations and AML/CFT laws to verify your identity. You agree to provide:
• Valid government-issued ID;
• BVN and NIN;
• Proof of address;
• Any additional documentation we may reasonably request.

Failure to complete KYC verification may result in account limitations or closure.`,
  },
  {
    title: "4. Services",
    content: `4.1 KukaPay provides the following services:
• Digital wallet creation and management;
• Peer-to-peer money transfers;
• Bill payments (utilities, airtime, data, TV subscriptions);
• Merchant payment collection via payment links, QR codes, and API integration;
• Bank transfers to Nigerian bank accounts;
• Transaction history and financial reporting.

4.2 Service Availability: While we strive for 24/7 availability, we do not guarantee uninterrupted access. Maintenance, system upgrades, or factors beyond our control may cause temporary disruptions.`,
  },
  {
    title: "5. Fees and Charges",
    content: `5.1 Transaction Fees: KukaPay charges fees for certain services as displayed on the Platform at the time of the Transaction. All fees are inclusive of applicable taxes unless stated otherwise.

5.2 Fee Changes: We may modify fees upon 14 days' prior notice via email or Platform notification. Continued use after the effective date constitutes acceptance.

5.3 Third-Party Charges: Your bank or mobile network operator may charge additional fees independent of KukaPay.`,
  },
  {
    title: "6. Payment Processing and Flutterwave Integration",
    content: `6.1 Payment Partner: KukaPay uses Flutterwave Technology Solutions Limited as its primary payment processing partner for card transactions, bank transfers, and other payment methods.

6.2 Data Sharing: By using KukaPay, you consent to the sharing of your personal and financial data with Flutterwave as necessary to:
• Process and authorize Transactions;
• Settle funds to Merchants;
• Detect and prevent fraud;
• Comply with regulatory requirements.

6.3 Flutterwave Terms: Your use of payment services is also subject to Flutterwave's Terms of Service (https://flutterwave.com/ng/terms). In the event of any conflict between these Terms and Flutterwave's terms regarding payment processing, Flutterwave's terms shall prevail for the payment transaction itself.

6.4 Settlement: Funds collected on behalf of Merchants shall be settled to the Merchant's designated bank account according to the settlement schedule agreed upon during Merchant onboarding.`,
  },
  {
    title: "7. Transactions",
    content: `7.1 Authorization: You authorize KukaPay to debit your Wallet or linked payment method for the amount of any Transaction, plus applicable fees.

7.2 Transaction Limits: We may impose daily, weekly, or monthly Transaction limits based on your KYC tier, account history, and regulatory requirements.

7.3 Irreversibility: Once a Transaction is confirmed, it generally cannot be reversed except: (a) at our sole discretion; (b) where required by law; (c) in cases of proven fraud or error.

7.4 Disputed Transactions: You must report unauthorized or erroneous Transactions within 24 hours of occurrence. We will investigate in accordance with CBN dispute resolution guidelines.`,
  },
  {
    title: "8. Prohibited Activities",
    content: `You agree NOT to use KukaPay for:
• Money laundering, terrorism financing, or fraud — Immediate account termination + legal reporting.
• Processing payments for illegal goods/services — Account suspension + law enforcement notification.
• Circumventing KYC/AML verification — Permanent account ban.
• Using the Platform to harm minors — Criminal prosecution.
• Transmitting malware, viruses, or malicious code — Account termination + civil liability.
• Impersonating another person or entity — Legal action + account closure.
• Engaging in activities that violate CBN regulations — Regulatory reporting + account restriction.`,
  },
  {
    title: "9. Refunds and Disputes",
    content: `9.1 Refund Policy: Please refer to our separate Refund Policy for detailed refund procedures.

9.2 General Principle: Refunds are granted at KukaPay's discretion and subject to: (a) verification of the refund claim; (b) compliance with our Refund Policy; (c) regulatory requirements; (d) confirmation that funds are recoverable.

9.3 Chargebacks: Where a card payment is disputed through the card issuer, we will cooperate with Flutterwave and the issuing bank to resolve the dispute. You agree to provide all requested documentation within 72 hours.`,
  },
  {
    title: "10. Intellectual Property",
    content: `10.1 Ownership: All content, software, trademarks, logos, and materials on the Platform are the exclusive property of KUKA TECHNOLOGY AND INNOVATION LTD or its licensors.

10.2 License: We grant you a limited, non-exclusive, non-transferable license to use the Platform for personal or business purposes in accordance with these Terms.

10.3 Restrictions: You may not copy, modify, distribute, sell, or lease any part of the Platform without our prior written consent.`,
  },
  {
    title: "11. Privacy and Data Protection",
    content: `11.1 Privacy Policy: Your use of KukaPay is governed by our Privacy Policy, which explains how we collect, use, store, and protect your personal data.

11.2 NDPR Compliance: We process personal data in compliance with the Nigeria Data Protection Regulation 2019 and the Nigeria Data Protection Act 2023.

11.3 Consent: By using the Platform, you consent to our data processing practices as described in the Privacy Policy.`,
  },
  {
    title: "12. Limitation of Liability",
    content: `To the maximum extent permitted by law, KUKA TECHNOLOGY AND INNOVATION LTD shall not be liable for:
• Indirect, incidental, special, consequential, or punitive damages;
• Loss of profits, revenue, data, or goodwill;
• Damages arising from third-party services (including Flutterwave);
• Damages exceeding the total amount of fees you paid to KukaPay in the 6 months preceding the claim.

12.2 Force Majeure: We are not liable for failures caused by events beyond our reasonable control, including but not limited to: natural disasters, war, terrorism, government actions, internet failures, or banking system disruptions.`,
  },
  {
    title: "13. Indemnification",
    content: `You agree to indemnify and hold harmless KUKA TECHNOLOGY AND INNOVATION LTD, its directors, officers, employees, and agents from any claims, losses, damages, or expenses (including legal fees) arising from:
• Your violation of these Terms;
• Your misuse of the Platform;
• Your infringement of any third-party rights;
• Your fraudulent or illegal activities.`,
  },
  {
    title: "14. Termination",
    content: `14.1 By You: You may close your Account at any time by contacting support@kukapay.com.ng. Outstanding obligations must be settled before closure.

14.2 By Us: We may suspend or terminate your Account immediately if you: (a) violate these Terms; (b) engage in fraudulent or illegal activity; (c) fail to complete KYC verification; (d) pose a risk to our Platform, users, or regulatory compliance.

14.3 Effect of Termination: Upon termination: (a) your access to the Platform ceases; (b) any outstanding fees become immediately due; (c) we may retain your data as required by law or for fraud prevention; (d) Sections 10, 11, 12, 13, and 15 survive termination.`,
  },
  {
    title: "15. Governing Law and Dispute Resolution",
    content: `15.1 Governing Law: These Terms are governed by the laws of the Federal Republic of Nigeria.

15.2 Dispute Resolution:
1. Step 1 — Negotiation: Parties shall attempt to resolve disputes amicably within 30 days of written notification.
2. Step 2 — Mediation: If negotiation fails, mediation under the Negotiation and Conflict Management Group (NCMG) rules.
3. Step 3 — Arbitration: If mediation fails, binding arbitration in Osogbo, Osun State, under the Arbitration and Conciliation Act, Cap A18, LFN 2004.

15.3 Court Jurisdiction: Nothing in this clause prevents either party from seeking urgent injunctive relief from a court of competent jurisdiction.`,
  },
  {
    title: "16. Amendments",
    content: `We may update these Terms at any time. Material changes will be notified via: (a) email to your registered address; (b) prominent notice on the Platform; (c) push notification (if enabled). Continued use after the effective date constitutes acceptance.`,
  },
  {
    title: "17. Contact Information",
    content: `Email: support@kukapay.com.ng
Phone: +2348148698
Address: 47A Lawoyin Street, Ilesha Garage, Osogbo Area, Osogbo, Osun State, Nigeria
Legal Entity: KUKA TECHNOLOGY AND INNOVATION LTD
CAC Number: RC9563845`,
  },
  {
    title: "18. Acknowledgment",
    content: `By clicking "I Agree" or using the KukaPay Platform, you acknowledge that:
• You have read, understood, and agree to these Terms;
• You are at least 18 years old;
• You consent to data sharing with Flutterwave as described herein;
• You agree to comply with all applicable laws and regulations.`,
  },
];

const TermsPage = () => {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const fromRegister = location.state?.fromRegister;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Terms & Conditions</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">KUKA TECHNOLOGY AND INNOVATION LTD</p>
          <p className="text-sm text-muted-foreground mt-1">
            Last Updated: May 31, 2026 · Effective: May 31, 2026 · CAC No. RC9563845
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {fromRegister && (
          <div className="mt-8 pb-24">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
              <Checkbox
                id="agree-terms"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="agree-terms" className="text-sm leading-relaxed cursor-pointer">
                I have read, understood, and agree to be bound by these Terms and Conditions. I acknowledge that violation of these terms may result in account suspension or termination.
              </label>
            </div>

            <Button
              className="w-full mt-4"
              disabled={!agreed}
              onClick={() => navigate("/privacy-consent", { state: { fromRegister: true } })}
            >
              Continue to Privacy Policy
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default TermsPage;
