
import { useNavigate, useLocation } from "react-router-dom";
import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { UserCircle, LogOut, LogIn, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { VenoLogo } from "@/components/ui/logo";
import { useTheme } from "@/providers/ThemeProvider";
import MobileMenu from "@/components/ui/mobile-menu";

const MainLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isHomePage = location.pathname === "/";

  const mainLinks = [
    { name: "Home", path: "/" },
    { name: "CBT", path: "/cbt" },
    { name: "Marketplace", path: "/marketplace" },
    { name: "Blog", path: "/blog" }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <MobileMenu mainLinks={mainLinks} />
            <Link to="/" className="flex items-center space-x-2">
              {isHomePage && <VenoLogo className="h-8 w-8" />}
              <span className="font-bold text-xl">Veno</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
            {mainLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path} 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="ml-auto flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            
            {/* Desktop Auth Controls - hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2">
              {user ? (
                <>
                  <div className="text-sm text-muted-foreground hidden md:block">
                    {user.email}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => navigate('/profile')}
                  >
                    <UserCircle className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => navigate("/auth")}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-4">
          <Outlet />
        </div>
      </main>
      <footer className="border-t py-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-14 text-muted-foreground">
          <p className="text-sm">
            © {new Date().getFullYear()} Veno. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs underline-offset-4 hover:underline">
              Terms of Service
            </Link>
            <Link to="/" className="text-xs underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
