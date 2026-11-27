import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activateMonnifyAccount } from "@/lib/monnify-accounts.functions";
import { squadActivationSchema } from "@/lib/squad-deposit";

export function SquadActivationForm({ onActivated }: { onActivated: () => Promise<void> }) {
  const activate = useServerFn(activateMonnifyAccount);
  const [bvn, setBvn] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = squadActivationSchema.safeParse({ bvn, dob, gender, address });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Check your details."); return; }
    setBusy(true);
    setError("");
    try {
      const result = await activate({ data: parsed.data });
      setBvn("");
      if (!result.success) { setError(result.error || "Please try again shortly."); return; }
      await onActivated();
    } catch {
      setBvn("");
      setError("Your account could not be confirmed. Please try again shortly.");
    } finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="space-y-4 text-left">
    <fieldset disabled={busy} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="squad-bvn" className="text-sm font-medium">BVN</label>
        <Input id="squad-bvn" type="password" inputMode="numeric" autoComplete="off" maxLength={11} required value={bvn} onChange={(event) => setBvn(event.target.value.replace(/\D/g, ""))} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="squad-dob" className="text-sm font-medium">Date of birth</label>
        <Input id="squad-dob" type="date" required value={dob} onChange={(event) => setDob(event.target.value)} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="squad-gender" className="text-sm font-medium">Gender</label>
        <Select value={gender} onValueChange={setGender} disabled={busy} required>
          <SelectTrigger id="squad-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
          <SelectContent><SelectItem value="1">Male</SelectItem><SelectItem value="2">Female</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="squad-address" className="text-sm font-medium">Residential address</label>
        <Input id="squad-address" autoComplete="street-address" required minLength={5} maxLength={200} value={address} onChange={(event) => setAddress(event.target.value)} />
      </div>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={busy || bvn.length !== 11 || !dob || !gender || address.trim().length < 5} className="w-full gap-2">
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Checking your details…" : "Activate Account Number"}
    </Button>
  </form>;
}