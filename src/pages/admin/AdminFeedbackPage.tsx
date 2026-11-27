import { useEffect, useMemo, useState } from "react";
import { Star, Search, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

interface FeedbackRow {
  id: string;
  rating: number;
  comment: string | null;
  transaction_id: string | null;
  user_id: string | null;
  created_at: string;
  user_name?: string | null;
}

const AdminFeedbackPage = () => {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transaction_feedback" as any)
      .select("id, rating, comment, transaction_id, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    const list = ((data ?? []) as unknown) as FeedbackRow[];
    const userIds = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean))) as string[];
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const map = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
      list.forEach((r) => {
        r.user_name = r.user_id ? (map.get(r.user_id) ?? null) : null;
      });
    }
    setRows(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (r.comment ?? "").toLowerCase().includes(q) ||
          (r.user_name ?? "").toLowerCase().includes(q) ||
          (r.transaction_id ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rows, ratingFilter, search]);

  const stats = useMemo(() => {
    if (!rows.length) return { avg: 0, count: 0 };
    const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
    return { avg, count: rows.length };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold">User Feedback</h2>
          <p className="text-xs text-muted-foreground">
            {stats.count} total · average {stats.avg.toFixed(2)} ★
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, comment, or txn ref…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={ratingFilter === "all" ? "default" : "outline"}
            onClick={() => setRatingFilter("all")}
          >
            All
          </Button>
          {[5, 4, 3, 2, 1].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={ratingFilter === n ? "default" : "outline"}
              onClick={() => setRatingFilter(n)}
              className="gap-1"
            >
              {n} <Star className="h-3 w-3 fill-current" />
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback yet"
          description="Once users rate their transactions, the reviews show up here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i <= r.rating
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {r.user_name ?? "Unknown user"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-sm text-foreground/90">"{r.comment}"</p>
                )}
                {r.transaction_id && (
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    Txn: {r.transaction_id}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackPage;
