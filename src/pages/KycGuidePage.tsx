import { ArrowLeft, ShieldCheck, CreditCard, ScanFace, MapPin, CheckCircle, AlertTriangle, Lightbulb, Camera, Upload, FileText, MessageCircle, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SUPPORT_WHATSAPP_LINK, SUPPORT_EMAIL_LINK, SUPPORT_WHATSAPP, SUPPORT_EMAIL } from "@/lib/support";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const KycGuidePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-5 py-10 pb-24 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold">KYC Verification Guide</h1>
          <p className="text-sm text-muted-foreground">Complete your identity verification</p>
        </div>
      </div>

      {/* Why KYC */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-sm">Why Verify Your Identity?</h2>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>Get a <strong>virtual bank account</strong> to receive money</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>Send & receive money, buy airtime, and more</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>Higher levels unlock features like <strong>events</strong> and <strong>withdrawals</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <span>Protects you and others from fraud</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Limits Table */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-5 space-y-3">
          <h2 className="font-bold text-sm">Transaction Limits</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 font-medium">Level</th>
                  <th className="p-2 font-medium">Max balance</th>
                  <th className="p-2 font-medium">Daily tx</th>
                </tr>
              </thead>
              <tbody className="font-mono-num">
                <tr className="border-t border-border"><td className="p-2 font-sans">L1 NIN</td><td className="p-2">₦50,000</td><td className="p-2">₦20,000</td></tr>
                <tr className="border-t border-border"><td className="p-2 font-sans">L2 Face</td><td className="p-2">₦200,000</td><td className="p-2">₦150,000</td></tr>
                <tr className="border-t border-border"><td className="p-2 font-sans">L3 BVN</td><td className="p-2">₦20,000,000</td><td className="p-2">₦10,000,000</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Level Overview */}
      <div className="space-y-3">
        <h2 className="font-bold text-base">Verification Levels</h2>

        {/* Level 1: NIN */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">Level 1: NIN Verification</h3>
                  <Badge variant="outline" className="text-[10px]">Required</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Unlocks wallet + virtual account</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Your <strong>11-digit NIN</strong> — validated live with Flutterwave</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                <span>A <strong>Flutterwave virtual bank account</strong> is created automatically</span>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent" />
                <p className="text-xs font-semibold text-accent">Tips</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• The name on your NIN must match your Kuka Pay profile name</li>
                <li>• Dial <span className="font-mono">*346#</span> on your NIN-linked SIM to retrieve your NIN</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Level 2: Face */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ScanFace className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">Level 2: Face Verification</h3>
                  <Badge variant="outline" className="text-[10px]">Recommended</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Higher limits + event creation</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4 mt-0.5 shrink-0" />
                <span>A clear photo of your <strong>student ID card</strong></span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Camera className="h-4 w-4 mt-0.5 shrink-0" />
                <span>A <strong>live selfie</strong> — matched against the ID by Youverify Face Biometrics</span>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent" />
                <p className="text-xs font-semibold text-accent">Tips</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Good lighting, neutral expression, no glasses or hats</li>
                <li>• ID photo must be sharp and unscratched</li>
                <li>• No filters or beauty mode on the selfie</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Level 3: BVN + Address */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">Level 3: BVN + Address</h3>
                  <Badge variant="outline" className="text-[10px]">Full access</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Highest balance + transaction limits</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Your <strong>11-digit BVN</strong> — validated live with Youverify</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4 mt-0.5 shrink-0" />
                <span><strong>Proof of address</strong> — utility bill, bank statement, or hostel letter (reviewed by admin)</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Address proof is reviewed manually and usually takes a few hours to one business day.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="font-bold text-base">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="q1" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium py-3">How long does verification take?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              Level 1 (NIN) and Level 2 (Face) are <strong>instant</strong> — results come back within seconds. Level 3 (Address) requires admin review and usually takes a few hours to 1 business day.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q2" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium py-3">What if my name doesn't match?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              If the name on your NIN doesn't closely match your profile name, the verification may fail or be sent for admin review. Make sure your Kuka Pay profile name matches your official documents. <a href={SUPPORT_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-primary underline">Contact support</a> if you need to update your profile name.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q3" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium py-3">Can I retry if verification fails?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              Yes! You can retry as many times as needed. Take a better photo with good lighting and make sure the document details are clearly visible.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q4" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium py-3">Is my data safe?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              Absolutely. Your documents are stored securely and encrypted. Only authorized admins can view your KYC documents. We never share your data with third parties.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q5" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium py-3">I don't have my NIN. What do I do?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              You can retrieve your NIN by dialing <strong>*346#</strong> on any phone number linked to your NIN. You can also visit any NIMC enrollment center to get a fresh NIN slip printed.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="q6" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium py-3">What features need each KYC level?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              <strong>Level 1:</strong> Wallet, send/receive money, airtime, collections, errands<br/>
              <strong>Level 2:</strong> Create events, sell tickets, higher transaction limits<br/>
              <strong>Level 3:</strong> Full access, highest limits, merchant features
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Support */}
      <Card className="border-muted">
        <CardContent className="p-5 space-y-3">
          <h2 className="font-bold text-sm">Still Need Help?</h2>
          <p className="text-xs text-muted-foreground">
            Contact our support team if you're having trouble with verification.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={SUPPORT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">{SUPPORT_WHATSAPP}</p>
              </div>
            </a>
            <a
              href={SUPPORT_EMAIL_LINK}
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">{SUPPORT_EMAIL}</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Button className="w-full" size="lg" onClick={() => navigate("/kyc")}>
        Start Verification
      </Button>
    </div>
  );
};

export default KycGuidePage;
