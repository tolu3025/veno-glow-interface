
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Check if there's a referral code in the URL
    const refCode = searchParams.get('ref');
    if (refCode) {
      console.log('Referral code found in 404 page:', refCode);
      // Store the referral code and redirect to signup
      sessionStorage.setItem('referralCode', refCode);
    }
  }, [location.pathname, searchParams]);

  const handleSignUp = () => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      navigate(`/signup?ref=${refCode}`);
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-3">
      <div className="text-center">
        <div className="mb-4 md:mb-6 text-veno-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={isMobile ? "48" : "64"}
            height={isMobile ? "48" : "64"}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto"
          >
            <path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h8" />
            <path d="m9 10 5-5" />
            <path d="m15 5 1 1" />
            <path d="M11 12a1 1 0 1 0 2 0 1 1 0 1 0-2 0Z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">404</h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-4 md:mb-6">
          Oops! Page not found
        </p>
        {searchParams.get('ref') ? (
          <div className="space-y-3 md:space-y-4">
            <p className="text-muted-foreground text-sm md:text-base">
              It looks like you clicked on a referral link. Would you like to sign up?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={handleSignUp}
                className="bg-veno-primary text-white px-4 py-2 rounded text-sm md:text-base"
              >
                Sign Up with Referral
              </button>
              <button
                onClick={() => navigate("/")}
                className="border border-veno-primary text-veno-primary px-4 py-2 rounded text-sm md:text-base"
              >
                Return to Home
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="bg-veno-primary text-white px-4 py-2 rounded text-sm md:text-base"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default NotFound;
