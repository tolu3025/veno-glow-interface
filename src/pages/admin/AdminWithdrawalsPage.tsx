import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { invokeAdminOperation } from "@/lib/admin-functions";

const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await invokeAdminOperation({ action: "get_withdrawals", statusFilter, page, limit: 20 });
      if (data?.success) {
        setWithdrawals(data.withdrawals || []);
        setTotal(data.total || 0);
      }
      setLoading(false);
    };
    load();
  }, [page, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold">Withdrawal Queue</h2>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
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
                    <th className="text-left p-3 font-medium text-muted-foreground">Account</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Bank</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <p className="font-medium">{w.account_name}</p>
                        <p className="text-xs text-muted-foreground font-mono-num">{w.account_number}</p>
                      </td>
                      <td className="p-3 text-muted-foreground">{w.bank_name}</td>
                      <td className="p-3 text-right font-mono-num font-semibold">₦{Number(w.amount).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge
                          variant={w.status === "completed" ? "default" : w.status === "processing" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {w.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell text-muted-foreground">
                        {format(new Date(w.created_at), "MMM d, h:mm a")}
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

export default AdminWithdrawalsPage;
