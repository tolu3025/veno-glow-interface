import { GraduationCap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserCampus } from "@/hooks/useUserCampus";
import { useNavigate } from "react-router-dom";

interface Props {
  variant?: "compact" | "banner";
}

const CampusBadge = ({ variant = "compact" }: Props) => {
  const { campus, loading } = useUserCampus();
  const navigate = useNavigate();

  if (loading) return null;

  if (!campus) {
    if (variant === "banner") {
      return (
        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-xs rounded-lg border border-destructive/30 bg-destructive/5 text-destructive px-3 py-2 cursor-pointer"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Your university isn't linked to a campus yet. Tap to update your
            profile so you can post and browse.
          </span>
        </div>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 text-[10px] text-destructive border-destructive/30 cursor-pointer"
        onClick={() => navigate("/profile")}
      >
        <AlertCircle className="h-2.5 w-2.5" /> No campus set
      </Badge>
    );
  }

  if (variant === "banner") {
    return (
      <div className="flex items-center gap-2 text-xs rounded-lg border border-primary/20 bg-primary/5 text-primary px-3 py-2">
        <GraduationCap className="h-3.5 w-3.5 shrink-0" />
        <span>
          Showing items on <strong>{campus.name}</strong> only.
        </span>
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 text-[10px] text-primary border-primary/30"
    >
      <GraduationCap className="h-2.5 w-2.5" /> {campus.name}
    </Badge>
  );
};

export default CampusBadge;
