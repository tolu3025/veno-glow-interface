
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { VenoLogo } from "@/components/ui/logo";
import { useTheme } from "@/providers/ThemeProvider";
import { LogOut, LogIn, Moon, Sun, UserCircle } from "lucide-react";
import { toast } from "sonner";

interface MobileMenuProps {
  mainLinks: { name: string; path: string }[];
  appLinks?: { name: string; path: string; icon: React.ElementType; requiresAuth?: boolean }[];
}

const MobileMenu = ({ mainLinks, appLinks }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={24} />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 mt-2">
            <Link to="/" className="flex items-center space-x-2">
              <VenoLogo className="h-8 w-8" />
              <span className="font-bold text-xl">Veno</span>
            </Link>
            <Button onClick={toggleTheme} variant="ghost" size="icon">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <h3 className="text-sm font-medium px-4">Main Navigation</h3>
              <nav className="flex flex-col space-y-1">
                {mainLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="px-4 py-2 hover:bg-accent rounded-md transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {appLinks && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium px-4">App Navigation</h3>
                <nav className="flex flex-col space-y-1">
                  {appLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="flex items-center px-4 py-2 hover:bg-accent rounded-md transition-colors"
                      onClick={(e) => {
                        if (link.requiresAuth && !user) {
                          e.preventDefault();
                          navigate('/auth');
                        }
                      }}
                    >
                      {link.icon && <link.icon className="mr-2 h-5 w-5" />}
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </div>

          <div className="border-t py-4">
            {user ? (
              <div className="space-y-2">
                <div className="px-4 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={() => navigate('/profile')}
                  >
                    <UserCircle className="h-5 w-5 mr-2" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
