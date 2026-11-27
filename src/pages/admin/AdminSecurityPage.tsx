import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, ChevronLeft, ChevronRight, Search, Shield, Globe, User, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { invokeAdminOperation } from "@/lib/admin-functions";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskySessionsPanel, IpBlocksPanel, FraudFlagsPanel } from "./SecurityOpsPanels";

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  login_attempt: "Login Attempt",
  pin_change: "PIN Changed",
  pin_lockout: "PIN Lockout",
  kyc_submission: "KYC Submitted",
  withdrawal_request: "Withdrawal",
  password_change: "Password Changed",
};

const AdminSecurityPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [logPage, actionFilter]);

  const loadData = async () => {
    setLoading(true);
    const logsRes = await invokeAdminOperation({ action: "get_security_logs", page: logPage, limit: 50, actionFilter, searchQuery });
    if (logsRes.data?.success) {
      setLogs(logsRes.data.logs || []);
      setLogTotal(logsRes.data.total || 0);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setLogPage(0);
    loadData();
  };

  const deleteLog = async (logId: string) => {
    setDeletingId(logId);
    const res = await invokeAdminOperation({ action: "delete_security_log", logId });
    setDeletingId(null);
    if (!res.data?.success) {
      toast.error(res.data?.error || "Failed to delete security log");
      return;
    }
    setLogs((prev) => prev.filter((log) => log.id !== logId));
    setSelectedLog(null);
    setLogTotal((total) => Math.max(0, total - 1));
    toast.success("Security log deleted");
  };

  const deleteAllLogs = async () => {
    if (!confirm("Delete all security logs? This cannot be undone.")) return;
    setDeletingId("all");
    const res = await invokeAdminOperation({ action: "delete_all_security_logs" });
    setDeletingId(null);
    if (!res.data?.success) {
      toast.error(res.data?.error || "Failed to delete security logs");
      return;
    }
    setLogs([]);
    setSelectedLog(null);
    setLogTotal(0);
    toast.success("All security logs deleted");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Shield className="h-5 w-5" /> Security Operations
      </h2>

      {/* Log Detail Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Security Log Detail</SheetTitle>
          </SheetHeader>
          {selectedLog && (
            <div className="mt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedLog.success ? "bg-accent/15" : "bg-destructive/15"}`}>
                    <Shield className={`h-5 w-5 ${selectedLog.success ? "text-accent" : "text-destructive"}`} />
                  </div>
                  <div>
                    <p className="font-semibold">{ACTION_LABELS[selectedLog.action] || selectedLog.action}</p>
                    <Badge variant={selectedLog.success ? "default" : "destructive"} className="text-xs mt-0.5">
                      {selectedLog.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-medium">{selectedLog.user_name || "System"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">{format(new Date(selectedLog.created_at), "PPpp")}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-mono text-xs break-all">{selectedLog.ip_address || "Not recorded"}</span>
                  </div>
                  {selectedLog.user_id && (
                    <div className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="font-mono text-xs break-all">{selectedLog.user_id}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                disabled={deletingId === selectedLog.id}
                onClick={() => deleteLog(selectedLog.id)}
              >
                {deletingId === selectedLog.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Log
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="sessions">Risky Sessions</TabsTrigger>
          <TabsTrigger value="ips">Blocked IPs</TabsTrigger>
          <TabsTrigger value="flags">Fraud Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions"><RiskySessionsPanel /></TabsContent>
        <TabsContent value="ips"><IpBlocksPanel /></TabsContent>
        <TabsContent value="flags"><FraudFlagsPanel /></TabsContent>

        <TabsContent value="logs">
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
      <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Security Logs ({logTotal})</p>
            <Button variant="destructive" size="sm" className="gap-2" onClick={deleteAllLogs} disabled={deletingId === "all" || logTotal === 0}>
              {deletingId === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete All
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setLogPage(0); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="login_attempt">Login Attempt</SelectItem>
                <SelectItem value="pin_change">PIN Change</SelectItem>
                <SelectItem value="pin_lockout">PIN Lockout</SelectItem>
                <SelectItem value="withdrawal_request">Withdrawal</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">IP Address</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                        <td className="p-3">
                          <p className="font-medium text-xs">{log.user_name || "System"}</p>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-xs">
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground">{log.ip_address || "—"}</td>
                        <td className="p-3">
                          <Badge variant={log.success ? "default" : "destructive"} className="text-xs">
                            {log.success ? "OK" : "Failed"}
                          </Badge>
                        </td>
                        <td className="p-3 text-right text-muted-foreground text-xs">
                          {format(new Date(log.created_at), "MMM d, h:mm a")}
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteLog(log.id)} disabled={deletingId === log.id}>
                            {deletingId === log.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={logPage === 0} onClick={() => setLogPage(logPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={(logPage + 1) * 50 >= logTotal} onClick={() => setLogPage(logPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
      </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurityPage;
