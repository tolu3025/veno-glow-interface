
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Users, Settings, BarChart, FileText, Bell, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <h3 className="font-semibold">Admin Portal</h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <nav className="space-y-1 px-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin")}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin/users")}
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin/content")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Content
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin/notifications")}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin/settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await signOut();
            toast.success("Logged out successfully");
            navigate("/");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

const AdminLayout = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is an admin
    const checkAdminRole = async () => {
      if (!isLoading && user) {
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error checking admin role:', error);
            toast.error("Error checking permissions");
            navigate('/');
            return;
          }
          
          // If not admin, redirect away
          if (!data || data.role !== 'admin') {
            toast.error("You don't have permission to access the admin panel");
            navigate('/');
          }
        } catch (err) {
          console.error('Error in admin check:', err);
          toast.error("Authentication error");
          navigate('/');
        }
      } else if (!isLoading && !user) {
        toast.error("Please login to access admin panel");
        navigate('/auth', { state: { from: '/admin' } });
      }
    };
    
    checkAdminRole();
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1">
          <div className="container mx-auto p-4">
            <header className="mb-6 flex justify-between items-center">
              <SidebarTrigger>
                <Button variant="outline" size="icon">
                  <ChevronLeft className="h-4 w-4 sidebar-closed:hidden" />
                  <ChevronRight className="h-4 w-4 hidden sidebar-closed:block" />
                </Button>
              </SidebarTrigger>
            </header>
            <div className="bg-card rounded-lg shadow-sm border p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
