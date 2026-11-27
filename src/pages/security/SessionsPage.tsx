import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Loader2, MapPin, Monitor, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  listMySessions,
  endSession,
  endOtherSessions,
  getSessionId,
} from "@/lib/session-risk";

const bandLabel: Record<string, string> = {
  low: "Normal",
  elevated: "Unusual",
  high: "Risky",
};

const deviceName = (ua: string | null) => {
  if (!ua) return "Unknown device";
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) return "Android phone";
  if (/windows/i.test(ua)) return "Windows computer";
  if (/mac os/i.test(ua)) return "Mac";
  return "Web browser";
};

const SessionsPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const current = getSessionId();

  const load = async () => {
    try {
      setSessions(await listMySessions());
    } catch {
      toast.error("Couldn't load your recent activity. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleNotMe = async () => {
    setWorking(true);
    try {
      await endOtherSessions();
      toast.success("All other sign-ins were ended and your account was flagged for review.");
      await load();
    } catch {
      toast.error("Couldn't end the other sign-ins. Please try again.");
    }
    setWorking(false);
  };

  const handleEnd = async (id: string) => {
    setWorking(true);
    try {
      await endSession(id);
      toast.success("That sign-in was ended.");
      await load();
    } catch {
      toast.error("Couldn't end that sign-in. Please try again.");
    }
    setWorking(false);
  };

  return (
    <div className="px-5 py-6 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Recent activity</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Every sign-in to your KukaPay account, with the device and place it came from.
        If you don't recognise one, end it straight away.
      </p>

      <Button
        variant="destructive"
        className="w-full h-12 rounded-xl"
        disabled={working}
        onClick={handleNotMe}
      >
        {working ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
        This wasn't me — end all other sign-ins
      </Button>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No sign-ins recorded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className="rounded-2xl">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    {deviceName(s.user_agent)}
                    {s.id === current && (
                      <Badge variant="secondary" className="text-[10px]">This device</Badge>
                    )}
                  </div>
                  <Badge
                    variant={s.risk_band === "high" ? "destructive" : s.risk_band === "elevated" ? "secondary" : "default"}
                    className="text-[10px]"
                  >
                    {bandLabel[s.risk_band] || s.risk_band}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[s.city, s.country].filter(Boolean).join(", ") || "Location unknown"}
                  {s.ip_address ? ` · ${s.ip_address}` : ""}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {s.last_seen_at
                      ? `${formatDistanceToNow(new Date(s.last_seen_at))} ago`
                      : ""}
                    {s.step_up_verified_at ? " · PIN confirmed" : ""}
                  </span>
                  {s.status === "active" && s.id !== current ? (
                    <Button size="sm" variant="ghost" disabled={working} onClick={() => handleEnd(s.id)}>
                      End
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {s.status === "active" ? "Active" : "Ended"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
