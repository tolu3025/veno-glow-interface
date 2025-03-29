
import { useNavigate, useLocation } from "react-router-dom";
import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { UserCircle, LogOut, LogIn, Moon, Sun, Facebook, Instagram, Youtube, Twitter } from "lucide-react";
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
            
            {/* Mobile Menu - now positioned at the right */}
            <MobileMenu mainLinks={mainLinks} />
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
          
          {/* Social Media Links */}
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <a 
              href="https://www.facebook.com/share/1DvXpB5pM3/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
            <a 
              href="https://www.instagram.com/veno_official_4?igsh=MXM4c3FjNWI1bGlwcw%3D%3D&utm_source=qr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a 
              href="https://youtube.com/@veno_official-f9t?si=fzBQcfESIP4eDSW5" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="YouTube"
            >
              <Youtube size={20} />
            </a>
            <a 
              href="https://www.tiktok.com/@veno_official3?_t=ZM-8v1Yo7Wdsf9&_r=1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="TikTok"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="current-fill"
              >
                <path 
                  d="M17 4.5c1.7 1.3 3 2 5 2v3c-1.3.1-3-.1-5-1v6.5C17 20.4 13.4 24 8 24S-1 20.4-1 15 2.6 6 8 6c.5 0 1 0 1.5.1V10c-.5-.1-1-.2-1.5-.2-2.7 0-5 2.3-5 5s2.3 5 5 5c2.8 0 5-2.2 5-5V0h4v4.5z" 
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/terms-of-service" className="text-xs underline-offset-4 hover:underline">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="text-xs underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
