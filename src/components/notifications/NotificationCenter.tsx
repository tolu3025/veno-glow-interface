import {
  Bell, CheckCheck, ArrowDownLeft, Send, Briefcase, Users, CreditCard,
  Loader2, ShieldCheck, ShieldAlert, Trash2, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  metadata: unknown;
  created_at: string;
  user_id: string;
}

const typeIcon = (type: string) => {
  switch (type) {
    case "deposit": return <ArrowDownLeft className="h-4 w-4 text-accent" />;
    case "transfer": return <Send className="h-4 w-4 text-primary" />;
    case "errand": return <Briefcase className="h-4 w-4 text-chart-4" />;
    case "collection": return <Users className="h-4 w-4 text-primary" />;
    case "withdrawal": return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    case "kyc": return <ShieldCheck className="h-4 w-4 text-accent" />;
    case "security": return <ShieldAlert className="h-4 w-4 text-destructive" />;
    default: return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
};

const typeRoute = (type: string): string | null => {
  switch (type) {
    case "deposit": case "transfer": return "/";
    case "errand": return "/errands";
    case "collection": return "/collect";
    case "withdrawal": return "/withdraw";
    case "kyc": return "/kyc";
    case "security": return "/profile";
    default: return null;
  }
};

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) ?? []);
    setUnreadCount((data ?? []).filter((n: Notification) => !n.read).length);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for new notification
          const route = typeRoute(newNotif.type);
          toast(newNotif.title, {
            description: newNotif.message,
            duration: 5000,
            action: route
              ? { label: "View", onClick: () => navigate(route) }
              : undefined,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, navigate]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from("notifications").delete().eq("id", id);
    const removed = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (removed && !removed.read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) markAsRead(notif.id);
    const route = typeRoute(notif.type);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={markAllRead}>
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
          </div>
          <SheetDescription className="sr-only">Your recent in-app notifications</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotifClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNotifClick(notif);
                    }
                  }}
                  className={`w-full text-left px-5 py-3.5 flex items-start gap-3 transition-colors group cursor-pointer outline-none focus-visible:bg-muted/40 ${
                    !notif.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    !notif.read ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {typeIcon(notif.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <p className={`text-sm break-words ${!notif.read ? "font-semibold" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      {!notif.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line break-words">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => deleteNotification(e, notif.id)}
                    className="mt-1 shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
