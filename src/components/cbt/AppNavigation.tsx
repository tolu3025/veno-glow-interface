
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, PlusCircle, BarChart, BookOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";

const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      path: "/cbt",
      icon: <Home size={18} />,
      authRequired: true
    },
    {
      name: "Create Test",
      path: "/cbt/create",
      icon: <PlusCircle size={18} />,
      authRequired: true
    },
    {
      name: "Analytics",
      path: "/cbt/analytics",
      icon: <BarChart size={18} />,
      authRequired: true
    },
    {
      name: "Library",
      path: "/cbt/library",
      icon: <BookOpen size={18} />,
      authRequired: false
    }
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-full border-r bg-background/95 backdrop-blur md:w-64">
      <div className="hidden md:flex flex-col justify-between h-full">
        <nav className="flex flex-col px-4 py-6">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className={`justify-start ${location.pathname === item.path ? 'font-bold' : ''}`}
              onClick={() => navigate(item.path)}
              disabled={item.authRequired && !user}
            >
              {item.icon}
              <span>{item.name}</span>
            </Button>
          ))}
        </nav>
        <div className="px-4 py-6">
          {user ? (
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppNavigation;
