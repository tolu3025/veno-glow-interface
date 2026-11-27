import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";

const privacySections = [
  {
    title: "1. Introduction",
    content: `KUKA TECHNOLOGY AND INNOVATION LTD ("KukaPay," "we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use the KukaPay website, mobile application, and services (collectively, the "Platform").

This Privacy Policy is made in compliance with the Nigeria Data Protection Regulation (NDPR) 2019, the Nigeria Data Protection Act 2023, and the General Data Protection Regulation (GDPR) where applicable to our operations.

Legal Entity: KUKA TECHNOLOGY AND INNOVATION LTD
CAC Number: RC9563845
Registered Address: 47A Lawoyin Street, Ilesha Garage, Osogbo Area, Osogbo, Osun State, Nigeria`,
  },
  {
    title: "2. Data Controller",
    content: `KUKA TECHNOLOGY AND INNOVATION LTD is the data controller responsible for your personal data under the NDPR and NDPA. We determine the purposes and means of processing your personal data on the Platform.`,
  },
  {
    title: "3. Information We Collect",
    content: `We collect the following categories of personal data:

Identity Data — Full name, date of birth, gender, photograph, NIN, BVN. Purpose: KYC verification, fraud prevention, regulatory compliance.

Contact Data — Email address, phone number, residential address. Purpose: Account communication, service delivery, verification.

Financial Data — Bank account details, transaction history. Purpose: Payment processing, wallet funding, transaction records.

Technical Data — IP address, device ID, browser type, operating system. Purpose: Security, fraud detection, platform optimization.

Usage Data — Login times, features used, transaction patterns. Purpose: Service improvement, personalization, risk assessment.

Location Data — GPS coordinates (with consent), billing address. Purpose: Fraud prevention, regulatory compliance, service customization.

Biometric Data — Fingerprint, facial recognition (where enabled). Purpose: Enhanced security authentication.`,
  },
  {
    title: "4. How We Collect Your Data",
    content: `Direct Input — Information you provide during registration, KYC, or support requests.
Automated Technologies — Cookies, web beacons, server logs, and analytics tools.
Third Parties — BVN and identity verification services via Flutterwave/approved verification partners.
Partners — Flutterwave (payment processing), Breet, and regulatory bodies.`,
  },
  {
    title: "5. Legal Basis for Processing",
    content: `Under NDPR and NDPA, we process your personal data based on:

Consent — Marketing communications, biometric data, optional features.
Contractual Necessity — Account creation, transaction processing, service delivery.
Legal Obligation — CBN regulations, AML/CFT compliance, tax reporting.
Legitimate Interests — Fraud prevention, platform security, business analytics.
Vital Interests — Emergency situations involving your safety.`,
  },
  {
    title: "6. How We Use Your Data",
    content: `• To create and manage your Account — Contractual Necessity.
• To process payments and transfers — Contractual Necessity.
• To verify your identity (KYC/AML) — Legal Obligation.
• To detect and prevent fraud — Legitimate Interests / Legal Obligation.
• To comply with CBN and regulatory requirements — Legal Obligation.
• To communicate with you about your Account — Contractual Necessity.
• To send marketing communications (with consent) — Consent.
• To improve our Platform and services — Legitimate Interests.`,
  },
  {
    title: "7. Data Sharing and Third Parties",
    content: `We share your personal data with the following categories of recipients:

Flutterwave Technology Solutions Limited — Payment processing, card authorization, settlement. Data shared: transaction details, card data, contact information.

Nigerian Inter-Bank Settlement System (NIBSS) — BVN verification, interbank transfers. Data shared: BVN, account details.

Central Bank of Nigeria (CBN) — Regulatory reporting, AML/CFT compliance. Data shared: transaction records, KYC data.

Nigeria Financial Intelligence Unit (NFIU) — Suspicious transaction reporting. Data shared: transaction patterns, identity data.

Cloud Service Providers — Data hosting and storage. Data shared: encrypted data backups.

Professional Advisors — Legal, accounting, audit services. Data shared: relevant business records.

Safeguards: All third-party recipients are contractually bound to protect your data in accordance with NDPR standards. We do not sell your personal data to any party.`,
  },
  {
    title: "8. International Data Transfers",
    content: `KukaPay primarily stores and processes data within Nigeria. However, some of our service providers (including Flutterwave and cloud hosting partners) may process data outside Nigeria.

When data is transferred internationally, we ensure:
• Adequate protection standards in the destination country;
• Standard contractual clauses (SCCs) with recipients;
• Compliance with NDPR Section 2.7 (cross-border data transfer requirements).`,
  },
  {
    title: "9. Data Security",
    content: `We implement appropriate technical and organizational measures to protect your data:

Encryption — AES-256 encryption for data at rest; TLS 1.3 for data in transit.
Access Controls — Role-based access, multi-factor authentication (MFA).
Firewalls & Intrusion Detection — Enterprise-grade network security.
Regular Audits — Quarterly security assessments and penetration testing.
Staff Training — Annual data protection and cybersecurity training.
Incident Response — 24-hour breach notification protocol.

Breach Notification: In the event of a data breach affecting your personal data, we will notify you and the Nigeria Data Protection Commission (NDPC) within 72 hours of discovery, as required by NDPR.`,
  },
  {
    title: "10. Data Retention",
    content: `We retain your personal data for as long as necessary to fulfill the purposes for which it was collected, including:

Account and KYC data — 7 years after account closure (CBN/AML requirement).
Transaction records — 7 years (tax and regulatory compliance).
Marketing preferences — Until withdrawn or account closure.
Support tickets and communications — 3 years after resolution.
Log files and technical data — 1 year (security and analytics).

After the retention period expires, data is securely deleted or anonymized.`,
  },
  {
    title: "11. Your Rights Under NDPR",
    content: `As a data subject, you have the following rights:

Right to Access — Request a copy of your personal data. How: email support@kukapay.com.ng.
Right to Rectification — Correct inaccurate or incomplete data. How: update via Account settings or contact support.
Right to Erasure — Request deletion of your data ("Right to be Forgotten"). How: submit request to support (subject to legal retention).
Right to Restrict Processing — Limit how we use your data. How: contact support with specific request.
Right to Data Portability — Receive your data in a machine-readable format. How: request via email.
Right to Object — Object to processing based on legitimate interests or direct marketing. How: unsubscribe or contact support.
Right to Withdraw Consent — Withdraw previously given consent. How: contact support or adjust Account settings.
Right to Lodge a Complaint — File a complaint with the NDPC. How: contact Nigeria Data Protection Commission.

Response Time: We will respond to all data subject requests within 30 days of receipt.`,
  },
  {
    title: "12. Cookies and Tracking Technologies",
    content: `We use cookies and similar technologies to:

Essential Cookies — Platform functionality, security. Duration: session.
Analytics Cookies — Understand usage patterns. Duration: 1 year.
Preference Cookies — Remember your settings. Duration: 1 year.
Marketing Cookies — Deliver relevant advertisements. Duration: 1 year.

You can manage cookie preferences through your browser settings. Disabling essential cookies may impair Platform functionality.`,
  },
  {
    title: "13. Children's Privacy",
    content: `KukaPay is not intended for use by individuals under 18 years of age. We do not knowingly collect data from minors. If you believe we have inadvertently collected data from a minor, please contact us immediately for deletion.`,
  },
  {
    title: "14. Changes to This Privacy Policy",
    content: `We may update this Privacy Policy periodically. Material changes will be communicated via: (a) email notification; (b) prominent notice on the Platform; (c) updated "Last Updated" date at the top of this Policy. Continued use after changes constitutes acceptance.`,
  },
  {
    title: "15. Contact Us",
    content: `For privacy-related inquiries, data subject requests, or complaints:

Email: support@kukapay.com.ng
Phone: +2348148698
Address: 47A Lawoyin Street, Ilesha Garage, Osogbo Area, Osogbo, Osun State, Nigeria
Legal Entity: KUKA TECHNOLOGY AND INNOVATION LTD
CAC Number: RC9563845`,
  },
];

const PrivacyConsentPage = () => {
  const [consented, setConsented] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const fromRegister = location.state?.fromRegister;

  const handleProceed = () => {
    const timestamp = new Date().toISOString();
    toast.success(`Privacy consent recorded at ${new Date(timestamp).toLocaleString()}`);
    navigate("/register", { state: { consentsGiven: true, consentTimestamp: timestamp } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Privacy Policy</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">KUKA TECHNOLOGY AND INNOVATION LTD</p>
          <p className="text-sm text-muted-foreground mt-1">
            Last Updated: May 31, 2026 · Effective: May 31, 2026 · CAC No. RC9563845
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            In compliance with the Nigeria Data Protection Regulation (NDPR) 2019 and the Nigeria Data Protection Act 2023.
          </p>
        </div>

        <div className="space-y-6">
          {privacySections.map((section) => (
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
                id="consent-privacy"
                checked={consented}
                onCheckedChange={(v) => setConsented(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="consent-privacy" className="text-sm leading-relaxed cursor-pointer">
                I explicitly consent to the collection, processing, and storage of my personal data as described in this Privacy Policy. I understand my rights under the NDPR and NDPA, and I acknowledge that this consent will be recorded with a timestamp.
              </label>
            </div>

            <Button
              className="w-full mt-4"
              disabled={!consented}
              onClick={handleProceed}
            >
              I Consent — Proceed to Registration
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default PrivacyConsentPage;
