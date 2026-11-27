import {
  ArrowLeft, Plus, Users, Loader2, Copy, Share2, CheckCircle,
  Download, XCircle, Clock, ChevronRight, Trash2, PartyPopper, Gift,
} from "lucide-react";
import { bonusForTotal, nextBonusTier, fmtNgn } from "@/lib/collectionBonus";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "sonner";

interface Collection {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  amount_per_person: number | null;
  total_collected: number;
  participant_count: number;
  status: string;
  deadline: string | null;
  category: string | null;
  virtual_account_number: string | null;
  virtual_bank_name: string | null;
  virtual_account_name?: string | null;
  require_matric?: boolean | null;
  created_at: string;
}

interface Payment {
  id: string;
  payer_name: string;
  payer_matric_number: string | null;
  amount: number;
  status: string;
  created_at: string;
}

const CollectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [params, setParams] = useSearchParams();
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchCollections();
  }, [user]);

  // Success state: after creating a collection we land here with ?new=<id>
  useEffect(() => {
    const id = params.get("new");
    if (!id || loading) return;
    setJustCreatedId(id);
    openDetail(id);
    params.delete("new");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Realtime: update collection progress when payments come in
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`collections-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "collections", filter: `creator_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Collection;
          setCollections((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Realtime: append new payments for the open collection
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`collection-payments-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "collection_payments", filter: `collection_id=eq.${selectedId}` },
        (payload) => {
          setPayments((prev) => [payload.new as Payment, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // Refetch when window regains focus (fallback)
  useEffect(() => {
    const onFocus = () => {
      if (user) fetchCollections();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);


  const fetchCollections = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("collections")
      .select("*")
      .eq("creator_id", user!.id)
      .order("created_at", { ascending: false });
    setCollections((data as Collection[]) || []);
    setLoading(false);
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setPaymentsLoading(true);
    const [paymentsRes, payoutRes] = await Promise.all([
      supabase
        .from("collection_payments")
        .select("*")
        .eq("collection_id", id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false }),
      supabase.rpc("get_collection_payout_details", { p_collection_id: id }),
    ]);
    setPayments((paymentsRes.data as Payment[]) || []);
    const payout = Array.isArray(payoutRes.data) ? payoutRes.data[0] : null;
    if (payout) {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, virtual_account_number: payout.virtual_account_number, virtual_bank_name: payout.virtual_bank_name }
            : c
        )
      );
    }
    setPaymentsLoading(false);
  };

  const selected = collections.find((c) => c.id === selectedId);

  const copyAccountNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    toast.success("Account number copied!");
  };

  // Flutterwave sometimes returns its own merchant label — fall back to our naming.
  const accountLabel = (col: Collection) => {
    const stored = (col.virtual_account_name || "").trim();
    if (!stored || !/kukapay/i.test(stored)) return `Kukapay/${col.title}`;
    return stored;
  };

  const shareCollection = (col: Collection) => {
    const payUrl = `${window.location.origin}/pay/${col.id}`;
    const text = `Pay for "${col.title}" on Kuka Pay!\n\nAmount: ${
      col.amount_per_person ? `₦${col.amount_per_person.toLocaleString()}` : "Any amount"
    }\n\nPay here: ${payUrl}\n\nHow to pay:\n• Kukapay users — tap the link and pay with your wallet.\n• No Kukapay? Tap the link, enter your name${
      col.require_matric ? " and matric number" : ""
    }, and you'll see a bank account to transfer to.\n\nYour payment is confirmed automatically.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  };

  const exportCSV = () => {
    if (!selected || payments.length === 0) return;
    const header = "Name,Matric Number,Amount,Date,Status\n";
    const rows = payments
      .map(
        (p) =>
          `"${p.payer_name}","${p.payer_matric_number || ""}",${p.amount},"${new Date(
            p.created_at
          ).toLocaleString()}","${p.status}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.title.replace(/\s+/g, "_")}_payments.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const closeCollection = async () => {
    if (!selected) return;
    setClosing(true);
    try {
      await friendlyInvoke("manage-collection", {
        body: { action: "close", collection_id: selected.id },
      }, "Failed to close collection");
      toast.success("Collection closed!");
      setSelectedId(null);
      fetchCollections();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setClosing(false);
    }
  };

  const progressPercent = selected
    ? Math.min(100, (selected.total_collected / selected.target_amount) * 100)
    : 0;

  // ── Detail View ──
  if (selected) {
    return (
      <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedId(null)}
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold truncate flex-1">{selected.title}</h1>
          <Badge variant={selected.status === "active" ? "default" : "secondary"}>
            {selected.status}
          </Badge>
        </div>

        {justCreatedId === selected.id && (
          <div className="rounded-2xl p-4 bg-grad-collections shadow-soft flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-background/40 flex items-center justify-center shrink-0">
              <PartyPopper className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">Collection created 🎉</p>
              <p className="text-xs text-foreground/70 mt-0.5">
                Share the payment link or the account number below — money lands straight in your wallet.
              </p>
            </div>
          </div>
        )}

        {/* Progress Card */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collected</span>
              <span className="font-mono font-bold">
                ₦{selected.total_collected.toLocaleString()} / ₦{selected.target_amount.toLocaleString()}
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{selected.participant_count} contributors</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Collection bonus */}
        {(() => {
          const earned = bonusForTotal(selected.total_collected);
          const next = nextBonusTier(selected.total_collected);
          return (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-accent" />
                  <p className="text-sm font-semibold">Collection bonus</p>
                </div>
                {earned > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Bonus earned so far: <span className="font-semibold text-accent">{fmtNgn(earned)}</span>. Close this collection, then complete your next one of ₦100,000 or more to unlock it.
                  </p>
                )}
                {next ? (
                  <p className="text-xs text-muted-foreground">
                    {fmtNgn(Math.max(0, next.threshold - selected.total_collected))} more to unlock a{" "}
                    <span className="font-semibold text-accent">{fmtNgn(next.bonus)}</span> bonus.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">You've unlocked the highest bonus. Well done!</p>
                )}
              </CardContent>
            </Card>
          );
        })()}



        {/* Virtual Account */}
        {selected.virtual_account_number && selected.status === "active" && (
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-accent">Collection Account</p>
              <p className="font-mono text-lg font-bold">{selected.virtual_account_number}</p>
              {selected.virtual_bank_name && (
                <p className="text-sm font-medium text-muted-foreground">{selected.virtual_bank_name}</p>
              )}
              <p className="text-sm font-medium">
                {accountLabel(selected)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => copyAccountNumber(selected.virtual_account_number!)}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => shareCollection(selected)}
                >
                  <Share2 className="h-3.5 w-3.5" /> WhatsApp
                </Button>

              </div>
            </CardContent>
          </Card>
        )}

        {/* Share Link */}
        {selected.status === "active" && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              const url = `${window.location.origin}/pay/${selected.id}`;
              navigator.clipboard.writeText(url);
              toast.success("Payment link copied!");
            }}
          >
            <Copy className="h-4 w-4" /> Copy Payment Link
          </Button>
        )}

        {/* Paid List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">
              Payments ({payments.length})
            </h2>
            {payments.length > 0 && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            )}
          </div>

          {paymentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No payments yet</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{p.payer_name}</p>
                      {p.payer_matric_number && (
                        <p className="text-xs font-medium text-foreground/80">
                          {p.payer_matric_number}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-accent">
                    ₦{p.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Collection */}
        {selected.status === "active" && (
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={closeCollection}
            disabled={closing}
          >
            {closing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Close Collection
          </Button>
        )}

        {/* Delete Collection — always available to the creator */}
        {(
          <Button
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={async () => {
              if (
                !confirm(
                  `Delete "${selected.title}"?\n\nThis permanently removes the collection and ALL its payment records. The payment link and account number will stop working. Money already paid into your wallet is not affected. This cannot be undone.`
                )
              )
                return;
              setDeleting(true);
              const { error } = await supabase
                .from("collections")
                .delete()
                .eq("id", selected.id);
              setDeleting(false);
              if (error) {
                toast.error("Failed to delete collection");
                return;
              }
              toast.success("Collection deleted");
              setSelectedId(null);
              fetchCollections();
            }}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Collection
          </Button>
        )}
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Collections</h1>
        <Button size="sm" className="gap-1" onClick={() => navigate("/collect/new")}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>


      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No collections yet"
          description="Create a collection to start receiving group payments."
        >
          <Button className="gap-1" onClick={() => navigate("/collect/new")}>
            <Plus className="h-4 w-4" /> Create Collection
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {collections.map((col) => {
            const pct = Math.min(100, (col.total_collected / col.target_amount) * 100);
            return (
              <button
                key={col.id}
                onClick={() => openDetail(col.id)}
                className="w-full text-left"
              >
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate flex-1">{col.title}</h3>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={col.status === "active" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {col.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        ₦{col.total_collected.toLocaleString()} / ₦{col.target_amount.toLocaleString()}
                      </span>
                      <span>{col.participant_count} paid</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollectPage;
