import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SUPPORT_EMAIL_LINK } from "@/lib/support";
import error404 from "@/assets/error-404.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] px-6 py-12">
      <div className="w-full max-w-md text-center">
        <img
          src={error404}
          alt="Page not found"
          className="mx-auto mb-6 max-h-[300px] w-auto object-contain"
          draggable={false}
        />
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[#111827]">Page Not Found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99]"
          >
            Back to Home
          </button>
          <a
            href={SUPPORT_EMAIL_LINK}
            className="inline-flex h-12 items-center justify-center rounded-full border border-input bg-background px-6 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
