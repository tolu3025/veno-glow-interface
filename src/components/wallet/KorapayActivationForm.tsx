import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activateKorapayAccount } from "@/lib/korapay-accounts.functions";
import { korapayActivationSchema } from "@/lib/korapay-deposit";

interface Props {
  /** Whether BVN is required by account tier (true) or NIN is acceptable (false/undefined). */
  requiresBvn?: boolean;
  onActivated: () => Promise<void>;
}

export function KorapayActivationForm({ requiresBvn, onActivated }: Props) {
  const activate = useServerFn(activateKorapayAccount);
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const useBvn = requiresBvn ?? false;
  const value = useBvn ? bvn : nin;
  const isReady = value.length === 11;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = useBvn ? { bvn: bvn || undefined } : { nin: nin || undefined };
    const parsed = korapayActivationSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Check your details.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await activate({ data: parsed.data });
      setBvn("");
      setNin("");
      if (!result.success) {
        setError(result.error || "Please try again shortly.");
        return;
      }
      await onActivated();
    } catch {
      setBvn("");
      setNin("");
      setError("Your account could not be confirmed. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <fieldset disabled={busy} className="space-y-1.5">
        {useBvn ? (
          <>
            <Label htmlFor="korapay-bvn" className="text-sm font-medium">
              Bank Verification Number (BVN)
            </Label>
            <Input
              id="korapay-bvn"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter your 11-digit BVN"
              maxLength={11}
              required
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Korapay requires your BVN to issue a permanent virtual account. Your BVN is not stored by KukaPay.
            </p>
          </>
        ) : (
          <>
            <Label htmlFor="korapay-nin" className="text-sm font-medium">
              National Identification Number (NIN)
            </Label>
            <Input
              id="korapay-nin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter your 11-digit NIN"
              maxLength={11}
              required
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Korapay verifies your NIN before creating your account. Your NIN is not stored by KukaPay.
            </p>
          </>
        )}
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={busy || !isReady}
        className="w-full gap-2"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy
          ? `Verifying your ${useBvn ? "BVN" : "NIN"}…`
          : `Verify ${useBvn ? "BVN" : "NIN"} & Activate Account`}
      </Button>
    </form>
  );
}
