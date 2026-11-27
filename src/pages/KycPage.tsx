import { useState, useEffect } from "react";
import { ShieldCheck, Upload, AlertTriangle, CheckCircle, Loader2, ArrowLeft, CreditCard, MapPin, Lock, ScanFace, Banknote, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useServerFn } from "@tanstack/react-start";
import { activateMonnifyAccount } from "@/lib/monnify-accounts.functions";
import { monnifyActivationSchema } from "@/lib/monnify-deposit";
import { KYC_LIMITS, formatNaira } from "@/lib/kyc-limits";

const KycPage = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const reverifyMode = searchParams.get("reverify") === "1";
  const levelParam = searchParams.get("level");
  const [activeLevel, setActiveLevel] = useState<number>(1);

  useEffect(() => {
    if (!profile) return;
    if (reverifyMode) { setActiveLevel(1); return; }
    if (levelParam) {
      const parsed = parseInt(levelParam, 10);
      if (parsed >= 1 && parsed <= 3) { setActiveLevel(parsed); return; }
    }
    const current = profile.kyc_level || 0;
    if (current === 0) setActiveLevel(1);
    else if (current === 1) setActiveLevel(2);
    else setActiveLevel(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const levels = [
    { level: 1, title: "NIN", icon: CreditCard, desc: "Identity verification" },
    { level: 2, title: "Face", icon: ScanFace, desc: "Student ID + selfie" },
    { level: 3, title: "BVN", icon: Banknote, desc: "BVN + address" },
  ];

  const currentLimit = KYC_LIMITS[(profile?.kyc_level ?? 0) as 0 | 1 | 2 | 3];

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen px-5 py-10 max-w-sm mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={handleBack} aria-label="Back" className="p-1 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Identity Verification</h1>
          <p className="text-sm text-muted-foreground">
            Level {profile?.kyc_level || 0} • {currentLimit.label}
          </p>
        </div>
      </div>

      {/* Current limits */}
      <Card className="bg-muted/40 border-border/60">
        <CardContent className="p-3 flex justify-between text-xs">
          <div>
            <p className="text-muted-foreground">Max balance</p>
            <p className="font-semibold font-mono-num">{currentLimit.maxBalance ? formatNaira(currentLimit.maxBalance) : "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Daily transactions</p>
            <p className="font-semibold font-mono-num">{currentLimit.dailyTx ? formatNaira(currentLimit.dailyTx) : "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Level Progress */}
      <div className="flex gap-2">
        {levels.map(({ level, icon: Icon }) => {
          const completed = (profile?.kyc_level || 0) >= level;
          const current = activeLevel === level;
          const locked = (profile?.kyc_level || 0) < level - 1;
          return (
            <button
              key={level}
              onClick={() => !locked && setActiveLevel(level)}
              disabled={locked}
              className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                completed ? "bg-accent/10 border-accent/30"
                : current ? "bg-primary/10 border-primary/30"
                : locked ? "bg-muted/50 border-border opacity-50"
                : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                {completed ? <CheckCircle className="h-5 w-5 text-accent" />
                  : locked ? <Lock className="h-5 w-5 text-muted-foreground" />
                  : <Icon className="h-5 w-5 text-primary" />}
                <span className="text-[10px] font-medium">Level {level}</span>
              </div>
            </button>
          );
        })}
      </div>

      {activeLevel === 1 && <Level1Nin />}
      {activeLevel === 2 && <Level2Face />}
      {activeLevel === 3 && <Level3BvnAddress />}

      <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground" onClick={() => navigate("/kyc/guide")}>
        <ShieldCheck className="h-4 w-4" /> Need help? Read the KYC Guide
      </Button>

      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={signOut}>Sign Out</Button>
    </div>
  );
};

type LatestKycDocument = {
  verification_status: string;
  admin_notes?: string | null;
  face_match_confidence?: number | null;
  created_at?: string | null;
};

const isUnderAdminReview = (status?: string | null) =>
  status === "pending" || status === "submitted";

const useLatestKycDocument = (userId: string | undefined, level: number) => {
  const [latestDoc, setLatestDoc] = useState<LatestKycDocument | null>(null);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setLatestDoc(null);
      setDocLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setDocLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("kyc_documents")
          .select("verification_status, admin_notes, face_match_confidence, created_at")
          .eq("user_id", userId)
          .eq("kyc_level", level)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          console.warn(`[kyc] latest level ${level} document load failed:`, error);
          setLatestDoc(null);
        } else {
          setLatestDoc((data as LatestKycDocument | null) ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn(`[kyc] latest level ${level} document load failed:`, error);
          setLatestDoc(null);
        }
      } finally {
        if (!cancelled) setDocLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, level]);

  return { latestDoc, setLatestDoc, docLoading };
};

// ==============================
// LEVEL 1: NIN verification (Monnify) → instant reserved account
// ==============================
const Level1Nin = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const activate = useServerFn(activateMonnifyAccount);
  const [nin, setNin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const { latestDoc, setLatestDoc, docLoading } = useLatestKycDocument(user?.id, 1);

  if (profile && profile.kyc_level >= 1) {
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-5 text-center space-y-3">
          <CheckCircle className="h-8 w-8 text-accent mx-auto" />
          <p className="font-semibold">Level 1 KYC Approved</p>
          <p className="text-sm text-muted-foreground">
            Your NIN was verified by Monnify. You can now access your dashboard.
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <Button className="w-full" onClick={() => navigate("/")}>Proceed to Dashboard</Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/kyc?level=2")}>
              Continue to Level 2
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }


  // While we check for existing submissions, don't flash the form.
  if (docLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const status = latestDoc?.verification_status;
  const underReview = isUnderAdminReview(status);
  const wasRejected = status === "rejected" && !verifying;
  const rejectionReason =
    latestDoc?.admin_notes ||
    "Your previous submission was rejected. Please check your details and try again.";

  if (underReview) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center space-y-2">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="font-semibold">Under Admin Review</p>
          <p className="text-sm text-muted-foreground">
            Your verification is being reviewed by our team. You'll be notified once approved (usually within 24 hours).
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = monnifyActivationSchema.safeParse({ nin });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your NIN."); return; }
    setVerifying(true);
    setError("");
    try {
      const result = await activate({ data: parsed.data });
      setNin("");
      if (!result.success) {
        if (result.rejected) {
          setLatestDoc({ verification_status: "rejected", admin_notes: result.error, created_at: new Date().toISOString() });
          await refreshProfile();
        }
        setError(result.error || "Please try again shortly.");
        return;
      }
      toast.success("Verified! Your KukaPay account number is ready.");
      await refreshProfile();
      navigate("/");
    } catch {
      setNin("");
      setError("Your account could not be confirmed. Please try again shortly.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {wasRejected && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-destructive">Previous submission rejected</p>
            <p className="text-xs text-muted-foreground mt-0.5">{rejectionReason}</p>
          </div>
        </div>
      )}
      <Card>
        <CardContent className="p-4 space-y-1">
          <h3 className="font-semibold text-sm">Level 1: NIN Verification</h3>
          <p className="text-xs text-muted-foreground">
            Monnify verifies your National Identification Number, then creates your KukaPay account number instantly. Your NIN is not stored by KukaPay.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <fieldset disabled={verifying} className="space-y-1.5">
            <label htmlFor="kyc-nin" className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> National Identification Number (NIN)
            </label>
            <Input
              id="kyc-nin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter your 11-digit NIN"
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              maxLength={11}
              required
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Use your own NIN. Monnify checks it against the national identity record.</p>
          </fieldset>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={verifying || nin.length !== 11}>
            {verifying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying with Monnify…</> : "Verify NIN & Create My Account"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
};

// ==============================
// LEVEL 2: Student ID + selfie face match (Youverify Face Biometrics)
// ==============================
const Level2Face = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { latestDoc, setLatestDoc, docLoading } = useLatestKycDocument(user?.id, 2);

  if (profile && profile.kyc_level >= 2) {
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-5 text-center space-y-2">
          <CheckCircle className="h-8 w-8 text-accent mx-auto" />
          <p className="font-semibold">Face Verified</p>
          <p className="text-sm text-muted-foreground">Proceed to BVN + address for full access.</p>
        </CardContent>
      </Card>
    );
  }

  if (docLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const status = latestDoc?.verification_status;
  const underReview = isUnderAdminReview(status);
  const wasRejected = status === "rejected";
  const rejectionReason =
    latestDoc?.admin_notes ||
    "Your previous Level 2 submission was rejected. Please resubmit clearer Student ID and selfie photos.";

  if (underReview) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center space-y-2">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="font-semibold">Under Review</p>
          <p className="text-sm text-muted-foreground">Your Student ID and selfie are being reviewed by an admin.</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile || profile.kyc_level < 1) {
    return (
      <Card className="border-border">
        <CardContent className="p-5 text-center space-y-2">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-semibold">Level 1 Required</p>
          <p className="text-sm text-muted-foreground">Complete BVN verification first.</p>
        </CardContent>
      </Card>
    );
  }

  const pick = (setter: (f: File) => void, prev: (s: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setter(f);
    prev(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile || !user) return;
    setLoading(true);
    setResult(null);
    try {
      const idPath = `${user.id}/id-${Date.now()}.jpg`;
      const selfiePath = `${user.id}/selfie-${Date.now()}.jpg`;
      const up1 = await supabase.storage.from("kyc-documents").upload(idPath, idFile, { contentType: idFile.type });
      if (up1.error) throw new Error(up1.error.message);
      const up2 = await supabase.storage.from("kyc-documents").upload(selfiePath, selfieFile, { contentType: selfieFile.type });
      if (up2.error) throw new Error(up2.error.message);

      const data = await friendlyInvoke<any>("verify-kyc", {
        body: { action: "verify_face", id_card_path: idPath, selfie_path: selfiePath },
      }, "Couldn't submit Level 2 KYC. Please try again.");
      setResult(data);
      if (data.verified) { toast.success("Face match verified!"); await refreshProfile(); }
      else if (data.pending_review) {
        toast.info("Submitted for admin review");
        setLatestDoc({
          verification_status: "pending",
          face_match_confidence: data.confidence ?? null,
          created_at: new Date().toISOString(),
        });
        await refreshProfile();
      }
      else toast.error(data.message || "Couldn't submit Level 2 KYC");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {wasRejected && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-destructive">Previous Level 2 submission rejected</p>
            <p className="text-xs text-muted-foreground mt-0.5">{rejectionReason}</p>
          </div>
        </div>
      )}
      <Card>
        <CardContent className="p-4 space-y-1">
          <h3 className="font-semibold text-sm">Level 2: Face Verification</h3>
          <p className="text-xs text-muted-foreground">
            Upload a clear photo of your student ID card and take a live selfie. An admin will review your Level 2 submission.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Student ID card</label>
        {idPreview ? (
          <div className="relative rounded-xl overflow-hidden border">
            <img src={idPreview} alt="ID" className="w-full h-40 object-cover" />
            <button onClick={() => { setIdFile(null); setIdPreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full px-2 py-1 text-xs font-medium">Change</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50">
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Upload ID front</span>
            <input type="file" accept="image/*" className="hidden" onChange={pick(setIdFile, setIdPreview)} />
          </label>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Live selfie</label>
        {selfiePreview ? (
          <div className="relative rounded-xl overflow-hidden border">
            <img src={selfiePreview} alt="Selfie" className="w-full h-40 object-cover" />
            <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full px-2 py-1 text-xs font-medium">Retake</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50">
            <Camera className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Take selfie</span>
            <input type="file" accept="image/*" capture="user" className="hidden" onChange={pick(setSelfieFile, setSelfiePreview)} />
          </label>
        )}
      </div>

      {result && (
        <div className={`p-3 rounded-lg flex items-start gap-2 ${result.verified ? "bg-accent/10" : result.pending_review ? "bg-yellow-500/10" : "bg-destructive/10"}`}>
          {result.verified ? <CheckCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" /> : result.pending_review ? <Loader2 className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
          <div>
            <p className="text-xs font-medium">{result.verified ? "Verified" : result.pending_review ? "Under review" : "Failed"}</p>
            <p className="text-xs text-muted-foreground">{result.message}</p>
          </div>
        </div>
      )}

      <Button className="w-full" disabled={!idFile || !selfieFile || loading} onClick={handleSubmit}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</> : "Submit for Review"}
      </Button>
    </div>
  );
};

// ==============================
// LEVEL 3: BVN + Address (Youverify BVN + admin address review)
// ==============================
const Level3BvnAddress = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [bvn, setBvn] = useState("");
  const [addressText, setAddressText] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { latestDoc, setLatestDoc, docLoading } = useLatestKycDocument(user?.id, 3);

  if (profile && profile.kyc_level >= 3) {
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-5 text-center space-y-2">
          <CheckCircle className="h-8 w-8 text-accent mx-auto" />
          <p className="font-semibold">Fully Verified</p>
          <p className="text-sm text-muted-foreground">Highest limits unlocked.</p>
        </CardContent>
      </Card>
    );
  }

  if (docLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const status = latestDoc?.verification_status;
  const underReview = isUnderAdminReview(status);
  const wasRejected = status === "rejected";
  const rejectionReason =
    latestDoc?.admin_notes ||
    "Your previous Level 3 submission was rejected. Please resubmit with clearer BVN/address details.";

  if (!profile || profile.kyc_level < 2) {
    return (
      <Card className="border-border">
        <CardContent className="p-5 text-center space-y-2">
          <Lock className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-semibold">Level 2 Required</p>
          <p className="text-sm text-muted-foreground">Complete face verification first.</p>
        </CardContent>
      </Card>
    );
  }

  if (underReview) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-5 text-center space-y-2">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="font-semibold">Under Review</p>
          <p className="text-sm text-muted-foreground">Your BVN + address documents are being reviewed by an admin.</p>
        </CardContent>
      </Card>
    );
  }

  const onProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setProof(f); setProofPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (bvn.length !== 11) { toast.error("BVN must be 11 digits"); return; }
    if (!addressText || !proof || !user) { toast.error("Address text and proof are required"); return; }
    setLoading(true);
    setResult(null);
    try {
      const path = `${user.id}/address-${Date.now()}.jpg`;
      const up = await supabase.storage.from("kyc-documents").upload(path, proof, { contentType: proof.type });
      if (up.error) throw new Error(up.error.message);

      const data = await friendlyInvoke<any>("verify-kyc", {
        body: { action: "verify_bvn_address", bvn_number: bvn, address_proof_path: path, address_text: addressText },
      }, "Couldn't submit KYC. Please try again.");
      setResult(data);
      toast.info("Submitted for admin review");
      setLatestDoc({ verification_status: "pending", created_at: new Date().toISOString() });
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {wasRejected && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-destructive">Previous Level 3 submission rejected</p>
            <p className="text-xs text-muted-foreground mt-0.5">{rejectionReason}</p>
          </div>
        </div>
      )}
      <Card>
        <CardContent className="p-4 space-y-1">
          <h3 className="font-semibold text-sm">Level 3: BVN + Address</h3>
          <p className="text-xs text-muted-foreground">
            We use Youverify to validate your BVN and an admin reviews your proof of address. Dial <span className="font-mono">*565*0#</span> on your registered SIM if you don't know your BVN.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            <h4 className="font-semibold text-sm">BVN (11 digits)</h4>
          </div>
          <Input
            placeholder="22222222222"
            value={bvn}
            onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
            maxLength={11}
            className="font-mono"
          />
        </CardContent>
      </Card>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Your address</label>
        <Textarea
          placeholder="Full residential address (street, city, state)"
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Proof of address</label>
        <p className="text-xs text-muted-foreground">Utility bill, bank statement, or hostel letter</p>
        {proofPreview ? (
          <div className="relative rounded-xl overflow-hidden border">
            <img src={proofPreview} alt="Proof" className="w-full h-40 object-cover" />
            <button onClick={() => { setProof(null); setProofPreview(null); }} className="absolute top-2 right-2 bg-background/80 rounded-full px-2 py-1 text-xs font-medium">Change</button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50">
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Upload document</span>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={onProof} />
          </label>
        )}
      </div>

      {result && (
        <div className="p-3 rounded-lg bg-primary/10 flex items-start gap-2">
          <Loader2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{result.message}</p>
        </div>
      )}

      <Button className="w-full" onClick={handleSubmit} disabled={bvn.length !== 11 || !addressText || !proof || loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</> : "Submit for Verification"}
      </Button>
    </div>
  );
};

export default KycPage;
