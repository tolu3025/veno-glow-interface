import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { invokeAdminOperation } from "@/lib/admin-functions";

const AdminCollectionsPage = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await invokeAdminOperation({ action: "get_collections", page, limit: 20 });
      if (data?.success) {
        setCollections(data.collections || []);
        setTotal(data.total || 0);
      }
      setLoading(false);
    };
    load();
  }, [page]);

  const isSuspicious = (c: any) => Number(c.target_amount) > 500000;

  const exportCSV = () => {
    const headers = ["Title", "Status", "Target", "Collected", "Participants", "Created"];
    const rows = collections.map(c => [
      c.title, c.status, c.target_amount, c.total_collected, c.participant_count,
      format(new Date(c.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "collections_export.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">Collections</h2>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>Export CSV</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Target</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Collected</th>
                    <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">Participants</th>
                    <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {collections.map((c) => (
                    <tr key={c.id} className={`hover:bg-muted/50 ${isSuspicious(c) ? "bg-destructive/5" : ""}`}>
                      <td className="p-3 font-medium">{c.title}</td>
                      <td className="p-3">
                        <Badge variant={c.status === "active" ? "default" : c.status === "completed" ? "secondary" : "destructive"} className="text-xs">
                          {c.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono-num">₦{Number(c.target_amount).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono-num">₦{Number(c.total_collected).toLocaleString()}</td>
                      <td className="p-3 text-right hidden sm:table-cell">{c.participant_count}</td>
                      <td className="p-3 text-right hidden md:table-cell text-muted-foreground">
                        {format(new Date(c.created_at), "MMM d")}
                      </td>
                      <td className="p-3 text-right">
                        {isSuspicious(c) && (
                          <AlertTriangle className="h-4 w-4 text-destructive inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={(page + 1) * 20 >= total} onClick={() => setPage(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AdminCollectionsPage;
