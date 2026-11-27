import { useState } from "react";
import { AlertTriangle, Mail, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "support@kukapay.com.ng";

const MatricCorrectionBanner = () => {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(
    () => typeof sessionStorage !== "undefined" && sessionStorage.getItem("kuka_matric_banner_dismissed") === "1"
  );

  if (!profile?.matric_flagged_at || dismissed) return null;

  const deadline = profile.matric_correction_deadline
    ? new Date(profile.matric_correction_deadline)
    : null;
  const now = Date.now();
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - now) / 86400000)) : null;
  const overdue = deadline ? deadline.getTime() <= now : false;

  const subject = encodeURIComponent("Matric number correction request");
  const body = encodeURIComponent(
    `Hi KukaPay team,\n\nI'd like to update my matric number on my KukaPay account.\n\nFull name: ${profile.full_name}\nCampus: ${profile.university}\nCurrent (incorrect) matric: ${profile.matric_number}\nCorrect matric: \n\nThanks.`
  );
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  const onDismiss = () => {
    sessionStorage.setItem("kuka_matric_banner_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="mx-4 mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-destructive">
            {overdue ? "Account at risk of suspension" : "Verify your matric number"}
          </p>
          <p className="text-foreground/80 leading-snug">
            Your matric number doesn't match your campus format. Email{" "}
            <span className="font-medium">{SUPPORT_EMAIL}</span> to correct it
            {daysLeft !== null && !overdue && (
              <> within <span className="font-medium">{daysLeft} day{daysLeft === 1 ? "" : "s"}</span></>
            )}
            {overdue && " now"} or your account will be suspended.
          </p>
          <Button asChild size="sm" variant="destructive" className="h-8">
            <a href={mailto}>
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Email support
            </a>
          </Button>
        </div>
        <button
          aria-label="Dismiss"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground p-1 -m-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MatricCorrectionBanner;
