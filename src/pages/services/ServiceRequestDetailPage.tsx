import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, MessageSquare, X, Download, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatNaira } from "@/lib/fees";

type Milestone = {
  key: string;
  label: string;
  pct: number;
  amount: number;
  status: "pending" | "funded" | "submitted" | "released";
  files?: { name: string; path: string }[];
  released_at?: string | null;
};

type ServiceRequest = {
  id: string;
  student_id: string;
  merchant_id: string;
  category: string;
  title: string;
  description: string;
  deadline: string | null;
  proposed_budget: number | null;
  attachments: { name: string; path: string }[];
  status: string;
  quote_amount: number | null;
  quote_timeline_days: number | null;
  deliverables: string[] | null;
  merchant_note: string | null;
  milestones: Milestone[];
  negotiation_history: any[];
  escrow_held: number;
  escrow_released: number;
  created_at: string;
  merchants?: { business_name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  quoted: "bg-blue-500/15 text-blue-600",
  negotiating: "bg-amber-500/15 text-amber-700",
  in_progress: "bg-emerald-500/15 text-emerald-700",
  delivered: "bg-indigo-500/15 text-indigo-700",
  completed: "bg-emerald-600/15 text-emerald-700",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-destructive/15 text-destructive",
};

const ServiceRequestDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [req, setReq] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [negoOpen, setNegoOpen] = useState(false);
  const [negoAmount, setNegoAmount] = useState("");
  const [negoDays, setNegoDays] = useState("");
  const [negoNote, setNegoNote] = useState("");
  const [revisionOpen, setRevisionOpen] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  const reload = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("service_requests")
      .select("*, merchants(business_name)")
      .eq("id", id)
      .maybeSingle();
    setReq(data as any);
  };

  useEffect(() => { reload(); }, [id]);

  const isStudent = user?.id === req?.student_id;

  const downloadFile = async (path: string, name: string) => {
    const { data, error } = await supabase.storage
      .from("service-attachments")
      .createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  };

  const callAction = async (action: string, extra: Record<string, any> = {}, successMsg?: string) => {
    if (!req) return;
    setLoading(true);
    try {
      await friendlyInvoke("manage-service-request", {
        body: { action, request_id: req.id, ...extra },
      });
      if (successMsg) toast.success(successMsg);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const milestoneNote = useMemo(() => {
    if (!req) return null;
    const next = req.milestones?.find((m) => m.status !== "released");
    if (!next) return null;
    if (next.status === "pending") return `Next: ${next.label} (${formatNaira(next.amount)}) — funds release when prior milestone clears.`;
    if (next.status === "funded") return `${next.label} is funded. Waiting for the merchant to deliver.`;
    if (next.status === "submitted") return `${next.label} delivered — review and release ${formatNaira(next.amount)}.`;
    return null;
  }, [req]);

  if (!req) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="-ml-2 rounded-full p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold leading-tight">{req.title}</h1>
            <p className="text-xs text-muted-foreground">{req.merchants?.business_name}</p>
          </div>
        </div>
        <Badge className={STATUS_STYLES[req.status] || ""}>{req.status.replace("_", " ")}</Badge>
      </header>

      <main className="mx-auto max-w-xl space-y-4 p-4 pb-32">
        {/* Brief */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your brief</h2>
            <p className="whitespace-pre-wrap text-sm">{req.description}</p>
            {req.deadline && <p className="text-xs text-muted-foreground">Deadline: {new Date(req.deadline).toLocaleDateString()}</p>}
            {req.proposed_budget && <p className="text-xs text-muted-foreground">Proposed budget: {formatNaira(req.proposed_budget)}</p>}
            {req.attachments?.length ? (
              <div className="space-y-1">
                {req.attachments.map((a, i) => (
                  <button key={i} onClick={() => downloadFile(a.path, a.name)} className="flex w-full items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-left text-sm hover:bg-muted">
                    <Paperclip className="h-4 w-4" /> <span className="truncate">{a.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Quote */}
        {req.quote_amount != null && (
          <Card>
            <CardContent className="space-y-3 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Merchant quote</h2>
              <p className="text-2xl font-bold">{formatNaira(req.quote_amount)}</p>
              {req.quote_timeline_days && <p className="text-sm">Timeline: {req.quote_timeline_days} days</p>}
              {req.deliverables?.length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {req.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              ) : null}
              {req.merchant_note && (
                <p className="rounded-md bg-muted/50 p-3 text-sm italic">{req.merchant_note}</p>
              )}

              {req.milestones?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Milestone schedule</p>
                  {req.milestones.map((m) => (
                    <div key={m.key} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{m.label}</p>
                        <Badge variant="outline" className="text-xs">{m.pct}% · {formatNaira(m.amount)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">{m.status}</p>
                      {m.files?.length ? (
                        <div className="mt-2 space-y-1">
                          {m.files.map((f, i) => (
                            <button key={i} onClick={() => downloadFile(f.path, f.name)} className="flex w-full items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-left text-xs hover:bg-muted">
                              <Download className="h-3.5 w-3.5" /> <span className="truncate">{f.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {isStudent && m.status === "submitted" && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            disabled={loading}
                            onClick={async () => {
                              if (!confirm(`Release ${formatNaira(m.amount)} to the merchant for "${m.label}"?`)) return;
                              setLoading(true);
                              try {
                                const { data, error } = await supabase.rpc("release_service_milestone", {
                                  _request_id: req.id,
                                  _milestone_key: m.key,
                                });
                                if (error) throw error;
                                const res = data as any;
                                if (!res?.success) throw new Error(res?.error || "Release failed");
                                toast.success(res.all_released ? "Order completed — merchant paid in full" : "Released to merchant");
                                await reload();
                              } catch (e: any) {
                                toast.error(e?.message || "Could not release escrow");
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            <Check className="mr-1 h-4 w-4" /> Approve & release
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setRevisionOpen(m.key); setRevisionNote(""); }} disabled={loading}>
                            Request revision
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
              {milestoneNote && <p className="text-xs text-muted-foreground">{milestoneNote}</p>}
            </CardContent>
          </Card>
        )}

        {/* Negotiation history */}
        {req.negotiation_history?.length ? (
          <Card>
            <CardContent className="space-y-2 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Negotiation</h2>
              {req.negotiation_history.map((h: any, i: number) => (
                <div key={i} className="rounded-md bg-muted/50 p-3 text-sm">
                  <p className="text-xs font-medium capitalize">{h.by} · {new Date(h.at).toLocaleString()}</p>
                  {h.amount != null && <p>Amount: {formatNaira(h.amount)}</p>}
                  {h.timeline_days && <p>Timeline: {h.timeline_days} days</p>}
                  {h.note && <p className="italic">"{h.note}"</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Escrow status */}
        {req.escrow_held > 0 && (
          <Card>
            <CardContent className="p-4 text-sm">
              <p className="text-muted-foreground">In escrow</p>
              <p className="text-xl font-bold">{formatNaira(req.escrow_held - req.escrow_released)}</p>
              <p className="text-xs text-muted-foreground">Released so far: {formatNaira(req.escrow_released)}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {isStudent && ["quoted", "negotiating"].includes(req.status) && (
          <div className="grid grid-cols-1 gap-2">
            <Button
              className="h-12"
              disabled={loading}
              onClick={() => callAction("approve_and_pay", {}, `${formatNaira(req.quote_amount || 0)} placed in escrow`)}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve & pay {formatNaira((req.milestones?.[0]?.amount) || (req.quote_amount || 0) * 0.5)} now
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setNegoOpen(true)} disabled={loading}>
                <MessageSquare className="mr-1 h-4 w-4" /> Negotiate
              </Button>
              <Button variant="ghost" onClick={() => callAction("reject", { reason: "Declined by student" }, "Order rejected")} disabled={loading}>
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        )}

        {isStudent && ["pending"].includes(req.status) && (
          <Button variant="ghost" onClick={() => callAction("cancel", { reason: "Cancelled by student" }, "Request cancelled")} disabled={loading}>
            Cancel request
          </Button>
        )}

        {isStudent && req.status === "in_progress" && (
          <Button variant="ghost" onClick={() => callAction("cancel", { reason: "Cancelled by student" }, "Request cancelled — escrow refunded")} disabled={loading}>
            Cancel & refund remaining escrow
          </Button>
        )}
      </main>

      {/* Negotiate dialog */}
      <Dialog open={negoOpen} onOpenChange={setNegoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Counter-offer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>New amount (₦)</Label>
              <Input type="number" inputMode="numeric" value={negoAmount} onChange={(e) => setNegoAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>New timeline (days)</Label>
              <Input type="number" inputMode="numeric" value={negoDays} onChange={(e) => setNegoDays(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea rows={3} value={negoNote} onChange={(e) => setNegoNote(e.target.value)} placeholder="e.g. Can you do ₦22,000 in 2.5 weeks?" />
            </div>
            <Button
              className="w-full"
              disabled={loading}
              onClick={async () => {
                await callAction("negotiate", {
                  amount: negoAmount ? Number(negoAmount) : null,
                  timeline_days: negoDays ? Number(negoDays) : null,
                  note: negoNote,
                }, "Counter-offer sent");
                setNegoOpen(false);
              }}
            >
              Send counter-offer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision dialog */}
      <Dialog open={!!revisionOpen} onOpenChange={(v) => !v && setRevisionOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request revision</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea rows={4} value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="What needs to change?" />
            <Button
              className="w-full"
              disabled={loading}
              onClick={async () => {
                if (revisionOpen) {
                  await callAction("request_revision", { milestone_key: revisionOpen, note: revisionNote }, "Revision requested");
                  setRevisionOpen(null);
                }
              }}
            >
              Send revision request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceRequestDetailPage;
