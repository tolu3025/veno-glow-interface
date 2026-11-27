import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, CreditCard, Briefcase, ShieldAlert, LogOut, Menu, X,
  Wallet, Store, Flag, UserCheck, GraduationCap, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Users", path: "/admin/users", icon: Users },
  { title: "Campuses", path: "/admin/campuses", icon: GraduationCap },
  { title: "Merchants", path: "/admin/merchants", icon: Store },
  { title: "Collections", path: "/admin/collections", icon: CreditCard },
  { title: "Withdrawals", path: "/admin/withdrawals", icon: Wallet },
  { title: "Errands", path: "/admin/errands", icon: Briefcase },
  { title: "Runners", path: "/admin/runners", icon: UserCheck },
  { title: "Disputes", path: "/admin/disputes", icon: Flag },
  { title: "Feedback", path: "/admin/feedback", icon: MessageSquare },
  { title: "Security", path: "/admin/security", icon: ShieldAlert },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Must be signed in
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        if (!cancelled) navigate("/admin");
        return;
      }
      // 2. Must hold admin role (server-checked, RLS-backed)
      const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (roleErr || !isAdmin) {
        sessionStorage.removeItem("admin_verified");
        toast.error("Admin access required");
        if (!cancelled) navigate("/admin");
        return;
      }
      // 3. Admin PIN step must have been completed this session
      const pinVerified = sessionStorage.getItem("admin_verified") === "true";
      if (!pinVerified) {
        if (!cancelled) navigate("/admin");
        return;
      }
      if (!cancelled) {
        setVerified(true);
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    sessionStorage.removeItem("admin_verified");
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/admin");
  };

  if (checking || !verified) return null;


  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-sm">
            {navItems.find((n) => n.path === location.pathname)?.title || "Admin"}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
