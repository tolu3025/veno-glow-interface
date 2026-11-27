import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Paperclip, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type Merchant = { id: string; business_name: string; category: string; service_categories?: string[] | null };

const CATEGORIES = [
  { value: "thesis", label: "Thesis" },
  { value: "project", label: "Final-year project" },
  { value: "research", label: "Research" },
  { value: "freelance", label: "Freelance / other" },
  { value: "custom", label: "Custom request" },
];

const RequestServicePage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantId, setMerchantId] = useState(params.get("merchant") || "");
  const [category, setCategory] = useState("thesis");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const [merchantsLoading, setMerchantsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setMerchantsLoading(true);
      try {
        // Merchants are only readable through the edge function (campus-scoped, RLS-safe).
        const res = await friendlyInvoke<{ merchants: Merchant[] }>(
          "manage-merchant",
          { body: { action: "get_directory", params: { category: "all", limit: 100 } } },
          "Could not load merchants.",
        );
        setMerchants((res?.merchants || []) as Merchant[]);
      } catch {
        setMerchants([]);
      } finally {
        setMerchantsLoading(false);
      }
    })();
  }, []);

  // Show every active merchant on the campus; service categories are advisory only.
  const eligibleMerchants = merchants;

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const allowed = selected.filter((f) => f.size <= 15 * 1024 * 1024);
    if (allowed.length < selected.length) {
      toast.error("Some files exceeded the 15 MB limit and were skipped.");
    }
    setFiles((prev) => [...prev, ...allowed].slice(0, 6));
    e.target.value = "";
  };

  const removeFile = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!user) return toast.error("Sign in first");
    if (!merchantId) return toast.error("Pick a merchant");
    if (!title.trim()) return toast.error("Add a title");
    if (description.trim().length < 20) return toast.error("Describe the work in at least 20 characters");

    setLoading(true);
    try {
      // 1. Create the request shell first to get an ID for the storage folder.
      const created = await friendlyInvoke<{ request: { id: string } }>(
        "manage-service-request",
        {
          body: {
            action: "create_request",
            merchant_id: merchantId,
            category,
            title: title.trim(),
            description: description.trim(),
            deadline: deadline || null,
            proposed_budget: budget ? Number(budget) : null,
            attachments: [],
          },
        },
        "Could not create the request.",
      );
      const requestId = created.request.id;

      // 2. Upload attachments under {request_id}/ — RLS lets the merchant read.
      const uploaded: { name: string; path: string }[] = [];
      for (const file of files) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${requestId}/brief/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("service-attachments")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          toast.error(`Upload failed for ${file.name}: ${error.message}`);
          continue;
        }
        uploaded.push({ name: file.name, path });
      }

      // 3. Patch the request with attachment metadata.
      if (uploaded.length) {
        await supabase
          .from("service_requests")
          .update({ attachments: uploaded })
          .eq("id", requestId);
      }

      toast.success("Request sent. The merchant will reply with a quote.");
      navigate(`/services/requests/${requestId}`);
    } catch (e: any) {
      toast.error(e?.message || "Could not send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <button onClick={() => navigate(-1)} aria-label="Back" className="-ml-2 rounded-full p-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">Request a service</h1>
      </header>

      <main className="mx-auto max-w-xl space-y-4 p-4 pb-32">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Merchant</Label>
              <Select value={merchantId} onValueChange={setMerchantId}>
                <SelectTrigger>
                  <SelectValue placeholder={merchantsLoading ? "Loading merchants…" : eligibleMerchants.length ? "Pick a merchant" : "No merchants available"} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMerchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.business_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {merchantsLoading
                  ? "Fetching merchants on your campus…"
                  : eligibleMerchants.length
                  ? "Pick any merchant on your campus — they'll reply with a quote."
                  : "No merchants found on your campus yet. Try again later."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solar Power System Final Year Project"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label>Describe the work</Label>
              <Textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope, requirements, length, formatting…"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">{description.length} / 5000</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Proposed budget (₦)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:bg-accent">
                <Paperclip className="h-4 w-4" /> Add files (briefs, templates) — max 6, 15 MB each
                <input type="file" multiple className="hidden" onChange={handleAttach} />
              </label>
              {files.length > 0 && (
                <ul className="space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                      <span className="truncate">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={loading} className="h-12 w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send request
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              No payment yet. You'll pay 50% upfront once you approve a quote.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RequestServicePage;
