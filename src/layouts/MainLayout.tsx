
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Book, Bot, Home, ShoppingCart, Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/lib/utils";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [animateNav, setAnimateNav] = useState(false);

  // Ensure component is mounted on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    setAnimateNav(true);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", icon: <Home className="w-6 h-6" />, label: "Home" },
    { path: "/cbt", icon: <Book className="w-6 h-6" />, label: "CBT" },
    { path: "/marketplace", icon: <ShoppingCart className="w-6 h-6" />, label: "Market" },
    { path: "/bot", icon: <Bot className="w-6 h-6" />, label: "Bot" },
  ];

  if (!mounted) {
    return <div className="bg-background min-h-screen"></div>;
  }

  return (
    <div className="relative bg-background min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-16 z-10 backdrop-blur-lg bg-background/70 border-b border-border/40 flex items-center justify-between px-4">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-foreground">
            <span className="text-veno-primary">Veno</span>
          </h1>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full bg-secondary/50 text-foreground hover:bg-secondary"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <main className="pt-16 pb-20 flex-1 px-4 md:px-6 max-w-5xl mx-auto w-full">
        <div className="animate-fade-in py-4 h-full">
          <Outlet />
        </div>
      </main>

      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-10 border-t border-border/40 bg-background/70 backdrop-blur-lg transition-all duration-500 transform",
        animateNav ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="grid grid-cols-4 gap-1 px-2 py-2 max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-xl transition-colors duration-200",
                isActive(item.path)
                  ? "text-veno-primary"
                  : "text-foreground/70 hover:text-foreground"
              )}
            >
              <div className="relative">
                {item.icon}
                {isActive(item.path) && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-veno-primary" />
                )}
              </div>
              <span className="text-xs font-medium mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
