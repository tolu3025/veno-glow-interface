import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/shared/EmptyState";
import { formatNaira } from "@/lib/fees";

type SR = {
  id: string;
  title: string;
  status: string;
  category: string;
  quote_amount: number | null;
  created_at: string;
  merchant_id: string;
  merchants?: { business_name: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  quoted: "bg-blue-500/15 text-blue-600",
  negotiating: "bg-amber-500/15 text-amber-700",
  approved: "bg-emerald-500/15 text-emerald-700",
  in_progress: "bg-emerald-500/15 text-emerald-700",
  delivered: "bg-indigo-500/15 text-indigo-700",
  completed: "bg-emerald-600/15 text-emerald-700",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-destructive/15 text-destructive",
};

const ServiceRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<SR[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("service_requests")
        .select("id, title, status, category, quote_amount, created_at, merchant_id, merchants(business_name)")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data || []) as SR[]);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Back" className="-ml-2 rounded-full p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">My service requests</h1>
        </div>
        <Button asChild size="sm">
          <Link to="/services/request/new"><Plus className="mr-1 h-4 w-4" /> New</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-xl space-y-3 p-4 pb-32">
        {rows === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No service requests yet"
            description="Send a brief to a merchant for thesis, projects, research or freelance work."
          >
            <Button asChild><Link to="/services/request/new">Send a request</Link></Button>
          </EmptyState>
        ) : (
          rows.map((r) => (
            <Link key={r.id} to={`/services/requests/${r.id}`} className="block">
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{r.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {r.merchants?.business_name || "Merchant"} · {r.category}
                      </p>
                    </div>
                    <Badge className={STATUS_STYLES[r.status] || ""}>{r.status.replace("_", " ")}</Badge>
                  </div>
                  {r.quote_amount != null && (
                    <p className="text-sm font-medium">Quote: {formatNaira(r.quote_amount)}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </main>
    </div>
  );
};

export default ServiceRequestsPage;
