import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { activateMonnifyAccount } from "@/lib/monnify-accounts.functions";
import { monnifyActivationSchema } from "@/lib/monnify-deposit";

export function MonnifyActivationForm({ onActivated }: { onActivated: () => Promise<void> }) {
  const activate = useServerFn(activateMonnifyAccount);
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = monnifyActivationSchema.safeParse({ nin });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Check your NIN.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await activate({ data: parsed.data });
      setNin("");
      if (!result.success) {
        setError(result.error || "Please try again shortly.");
        return;
      }
      await onActivated();
    } catch {
      setNin("");
      setError("Your account could not be confirmed. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 text-left">
      <fieldset disabled={busy} className="space-y-1.5">
        <label htmlFor="monnify-nin" className="text-sm font-medium">National Identification Number (NIN)</label>
        <Input
          id="monnify-nin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Enter your 11-digit NIN"
          maxLength={11}
          required
          value={nin}
          onChange={(event) => setNin(event.target.value.replace(/\D/g, "").slice(0, 11))}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">Monnify checks your NIN before creating your account. Your NIN is not stored by KukaPay.</p>
      </fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || nin.length !== 11} className="w-full gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "Verifying your NIN…" : "Verify NIN & Activate Account"}
      </Button>
    </form>
  );
}
