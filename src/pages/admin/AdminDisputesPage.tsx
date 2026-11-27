import { useState, useEffect } from "react";
import { Loader2, Flag, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import EmptyState from "@/components/shared/EmptyState";

const AdminDisputesPage = () => {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await supabase.from("transaction_disputes")
      .select("*").order("created_at", { ascending: false });
    setDisputes(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleResolve = async (disputeId: string, resolution: "resolved" | "rejected") => {
    setActionLoading(disputeId);
    try {
      await friendlyInvoke("manage-disputes", {
        body: { action: "resolve_dispute", dispute_id: disputeId, resolution, admin_notes: adminNotes },
      }, "Failed to resolve dispute");
      toast.success(`Dispute ${resolution}`);
      setSelected(null);
      setAdminNotes("");
      fetchDisputes();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: typeof Clock }> = {
      open: { color: "bg-yellow-500/10 text-yellow-600", icon: Clock },
      under_review: { color: "bg-primary/10 text-primary", icon: Eye },
      resolved: { color: "bg-accent/10 text-accent", icon: CheckCircle },
      rejected: { color: "bg-destructive/10 text-destructive", icon: XCircle },
    };
    const c = config[status] || config.open;
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} border-0 gap-1 text-[10px]`}>
        <Icon className="h-3 w-3" /> {status.replace("_", " ")}
      </Badge>
    );
  };

  const reasonLabel: Record<string, string> = {
    wrong_recipient: "Wrong Recipient",
    duplicate: "Duplicate",
    fraud: "Suspected Fraud",
    other: "Other",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Transaction Disputes</h2>

      {disputes.length === 0 ? (
        <EmptyState icon={Flag} title="No disputes" description="No transaction disputes have been filed." />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <Card key={d.id} className="cursor-pointer hover:shadow-soft transition-shadow" onClick={() => { setSelected(d); setAdminNotes(d.admin_notes || ""); }}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{reasonLabel[d.reason] || d.reason}</span>
                  {statusBadge(d.status)}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(d.created_at), "MMM d, yyyy · h:mm a")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium">{reasonLabel[selected.reason]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {statusBadge(selected.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(selected.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">User Description</label>
                <p className="text-sm bg-muted rounded-lg p-3 mt-1">{selected.description}</p>
              </div>

              {(selected.status === "open" || selected.status === "under_review") && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground">Admin Notes</label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add resolution notes..."
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleResolve(selected.id, "rejected")}
                      disabled={actionLoading === selected.id}
                    >
                      {actionLoading === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleResolve(selected.id, "resolved")}
                      disabled={actionLoading === selected.id}
                    >
                      {actionLoading === selected.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Resolve
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputesPage;
