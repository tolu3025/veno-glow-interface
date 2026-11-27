import { useEffect } from "react";
import { ExternalLink, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Runners now operate on their own subdomain. Keeps the student app clean.
export const RUNNER_PORTAL_URL = "https://runner.kukapay.com.ng";

const RunnerRegistrationPage = () => {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = RUNNER_PORTAL_URL;
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="px-5 pt-16 pb-10 flex flex-col items-center text-center space-y-4 max-w-sm mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Truck className="h-7 w-7 text-primary" />
      </div>
      <h1 className="text-xl font-bold">Runner tools have moved</h1>
      <p className="text-sm text-muted-foreground">
        Runner sign-up, jobs and earnings now live on
        <br />
        <span className="font-semibold text-foreground">runner.kukapay.com.ng</span>.
        Redirecting you now…
      </p>
      <Button asChild className="gap-2">
        <a href={RUNNER_PORTAL_URL}>
          Open runner portal <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
};

export default RunnerRegistrationPage;
