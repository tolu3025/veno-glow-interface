import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert, Ban, Flag } from "lucide-react";
import { format } from "date-fns";
import { invokeAdminOperation } from "@/lib/admin-functions";
import { toast } from "sonner";

const bandVariant = (band: string) =>
  band === "high" ? "destructive" : band === "elevated" ? "secondary" : "outline";

export const RiskySessionsPanel = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyRisky, setOnlyRisky] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await invokeAdminOperation({
      action: "get_risky_sessions",
      bandFilter: onlyRisky ? "risky" : "all",
      page: 0,
      limit: 50,
    });
    if (res.data?.success) setSessions(res.data.sessions || []);
    else toast.error(res.data?.error || "Couldn't load sessions");
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [onlyRisky]);

  const terminate = async (id: string) => {
    setBusyId(id);
    const res = await invokeAdminOperation({ action: "terminate_user_session", sessionId: id });
    setBusyId(null);
    if (!res.data?.success) return toast.error(res.data?.error || "Couldn't end session");
    setSessions((s) => s.map((x) => (x.id === id ? { ...x, status: "terminated" } : x)));
    toast.success("Session ended");
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Sessions ({sessions.length})
        </p>
        <Button variant="outline" size="sm" onClick={() => setOnlyRisky((v) => !v)}>
          {onlyRisky ? "Show all" : "Show risky only"}
        </Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Risk</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left p-3 font-medium text-muted-foreground">IP</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Last seen</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-muted/50">
                  <td className="p-3 text-xs font-medium">{s.user_name || s.user_id?.slice(0, 8)}</td>
                  <td className="p-3">
                    <Badge variant={bandVariant(s.risk_band) as any} className="text-xs">
                      {s.risk_band} · {s.risk_score}
                    </Badge>
                  </td>
                  <td className="p-3 text-xs">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{s.ip_address || "—"}</td>
                  <td className="p-3 text-xs">
                    {s.status === "active" && !s.step_up_verified_at ? "Awaiting PIN" : s.status}
                  </td>
                  <td className="p-3 text-right text-xs text-muted-foreground">
                    {s.last_seen_at ? format(new Date(s.last_seen_at), "MMM d, h:mm a") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline" size="sm"
                      disabled={busyId === s.id || s.status === "terminated"}
                      onClick={() => terminate(s.id)}
                    >
                      {busyId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "End"}
                    </Button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">No sessions found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export const IpBlocksPanel = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await invokeAdminOperation({ action: "get_ip_blocks" });
    if (res.data?.success) setBlocks(res.data.blocks || []);
    else toast.error(res.data?.error || "Couldn't load blocked addresses");
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const unblock = async (ip: string) => {
    setBusy(ip);
    const res = await invokeAdminOperation({ action: "unblock_ip", ip });
    setBusy(null);
    if (!res.data?.success) return toast.error(res.data?.error || "Couldn't unblock");
    setBlocks((b) => b.filter((x) => x.ip_address !== ip));
    toast.success("Address unblocked");
  };

  const block = async () => {
    const ip = newIp.trim();
    if (!ip) return;
    setBusy("new");
    const res = await invokeAdminOperation({ action: "block_ip", ip, hours: 6 });
    setBusy(null);
    if (!res.data?.success) return toast.error(res.data?.error || "Couldn't block");
    setNewIp("");
    toast.success("Address blocked for 6 hours");
    load();
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Ban className="h-4 w-4" /> Blocked addresses ({blocks.length})
      </p>
      <div className="flex gap-2">
        <Input placeholder="Add an address to block" value={newIp} onChange={(e) => setNewIp(e.target.value)} />
        <Button size="sm" onClick={block} disabled={busy === "new" || !newIp.trim()}>Block</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Address</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Level</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Reason</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Strikes</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Until</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blocks.map((b) => (
                <tr key={b.id} className="hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{b.ip_address}</td>
                  <td className="p-3"><Badge variant="secondary" className="text-xs">{b.level}</Badge></td>
                  <td className="p-3 text-xs text-muted-foreground">{b.reason || "—"}</td>
                  <td className="p-3 text-xs">{b.strikes}</td>
                  <td className="p-3 text-right text-xs text-muted-foreground">
                    {b.blocked_until ? format(new Date(b.blocked_until), "MMM d, h:mm a") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="outline" size="sm" disabled={busy === b.ip_address} onClick={() => unblock(b.ip_address)}>
                      {busy === b.ip_address ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unblock"}
                    </Button>
                  </td>
                </tr>
              ))}
              {blocks.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No blocked addresses.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export const FraudFlagsPanel = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await invokeAdminOperation({ action: "get_fraud_flags", page: 0, limit: 50 });
    if (res.data?.success) setFlags(res.data.flags || []);
    else toast.error(res.data?.error || "Couldn't load flags");
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const resolve = async (id: string) => {
    setBusy(id);
    const res = await invokeAdminOperation({ action: "resolve_fraud_flag", flagId: id });
    setBusy(null);
    if (!res.data?.success) return toast.error(res.data?.error || "Couldn't resolve flag");
    setFlags((f) => f.map((x) => (x.id === id ? { ...x, resolved: true } : x)));
    toast.success("Flag resolved");
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Flag className="h-4 w-4" /> Fraud flags ({flags.length})
      </p>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Details</th>
                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                <th className="text-left p-3 font-medium text-muted-foreground">State</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Raised</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {flags.map((f) => (
                <tr key={f.id} className="hover:bg-muted/50">
                  <td className="p-3"><Badge variant="secondary" className="text-xs">{f.flag_type}</Badge></td>
                  <td className="p-3 text-xs max-w-xs truncate">{f.description || "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{f.user_id?.slice(0, 8) || "—"}</td>
                  <td className="p-3 text-xs">{f.resolved ? "Resolved" : "Open"}</td>
                  <td className="p-3 text-right text-xs text-muted-foreground">
                    {format(new Date(f.created_at), "MMM d, h:mm a")}
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="outline" size="sm" disabled={f.resolved || busy === f.id} onClick={() => resolve(f.id)}>
                      {busy === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resolve"}
                    </Button>
                  </td>
                </tr>
              ))}
              {flags.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">No flags raised.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
